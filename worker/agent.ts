/// <reference types="@cloudflare/workers-types" />
/**
 * Chatbot session minting (Phase 3).
 *
 * Gates a new bot session behind Turnstile + per-IP rate limit + a daily cap,
 * then starts a Pipecat Cloud agent session and returns the Daily room + token
 * for the client to connect to.
 */
import { Env, json } from './env';

const DAILY_CAP = 300; // max sessions/day site-wide (soft cap)
const PIPECAT_START = (agent: string) =>
  `https://api.pipecat.daily.co/v1/public/${agent}/start`;

export async function handleAgentSession(request: Request, env: Env): Promise<Response> {
  if (!env.PIPECAT_API_KEY || !env.PIPECAT_AGENT) {
    return json({ error: 'Agent not configured' }, 503);
  }

  let payload: { turnstileToken?: string; sessionId?: string; lang?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

  // 1) Turnstile
  if (env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET, payload.turnstileToken ?? '', ip);
    if (!ok) return json({ error: 'Turnstile verification failed' }, 403);
  }

  // 2) Per-IP rate limit
  if (env.RATE_LIMITER) {
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return json({ error: 'Rate limited' }, 429);
  }

  // 3) Daily site-wide cap (soft, KV counter)
  if (env.RATE) {
    const day = new Date().toISOString().slice(0, 10);
    const key = `cap:${day}`;
    const count = Number((await env.RATE.get(key)) ?? '0');
    if (count >= DAILY_CAP) return json({ error: 'Daily limit reached' }, 429);
    await env.RATE.put(key, String(count + 1), { expirationTtl: 60 * 60 * 26 });
  }

  // 4) Start the Pipecat Cloud agent session
  const start = await fetch(PIPECAT_START(env.PIPECAT_AGENT), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.PIPECAT_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      createDailyRoom: true,
      body: {
        sessionId: payload.sessionId ?? crypto.randomUUID(),
        lang: payload.lang === 'vi' ? 'vi' : 'en',
        siteOrigin: new URL(request.url).origin,
      },
    }),
  });

  if (!start.ok) {
    const detail = await start.text();
    return json({ error: 'Failed to start agent', detail: detail.slice(0, 300) }, 502);
  }

  const data = (await start.json()) as { dailyRoom?: string; dailyToken?: string };
  // Return both Pipecat-native and transport-native key names for client compatibility.
  return json({
    dailyRoom: data.dailyRoom,
    dailyToken: data.dailyToken,
    room_url: data.dailyRoom,
    token: data.dailyToken,
  });
}

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) return false;
  const out = (await res.json()) as { success: boolean };
  return out.success === true;
}
