/// <reference types="@cloudflare/workers-types" />
/**
 * hithuc.com Worker.
 *
 * - Serves the React SPA from the `ASSETS` static-assets binding.
 * - `/api/projects|posts|profile` → EmDash CMS proxy (Phase 2), edge-cached.
 * - `/api/agent/session` → mint a Pipecat Cloud chatbot session (Phase 3).
 * - `/api/kb/search` → RAG query over Vectorize (Phase 3).
 * - `/api/kb/reindex` (+ cron) → rebuild the Vectorize index from CMS content.
 */
import { Env, json } from './env';
import { routeContent } from './content';
import { handleAgentSession } from './agent';
import { handleKbSearch, reindex } from './kb';
import { handleSitemap } from './sitemap';

const CONTENT_EDGE_TTL = 60; // seconds

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith('/api/')) {
      return handleApi(request, url, env, ctx);
    }
    if (pathname === '/sitemap.xml') {
      return handleSitemap(url.origin, env);
    }
    // Everything else → static assets (SPA fallback via wrangler config).
    return env.ASSETS.fetch(request);
  },

  // Cron: keep the RAG index fresh from CMS content.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(reindex(env).then(() => undefined).catch(() => undefined));
  },
};

async function handleApi(
  request: Request,
  url: URL,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const { pathname } = url;

  // --- Chatbot (POST, no cache) ---
  if (pathname === '/api/agent/session' && request.method === 'POST') {
    return handleAgentSession(request, env);
  }
  if (pathname === '/api/kb/search' && request.method === 'POST') {
    return handleKbSearch(request, env);
  }
  if (pathname === '/api/kb/reindex' && request.method === 'POST') {
    if (!env.KB_REINDEX_SECRET || request.headers.get('x-reindex-secret') !== env.KB_REINDEX_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }
    try {
      return json(await reindex(env));
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'reindex failed' }, 500);
    }
  }

  // --- CMS content (GET, edge-cached) ---
  if (request.method === 'GET') {
    if (!env.EMDASH_BASE) return json({ error: 'EMDASH_BASE not configured' }, 502);

    const cache = caches.default;
    const cacheKey = new Request(url.toString());
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      const body = await routeContent(pathname, env);
      if (body === undefined) return json({ error: 'Not found' }, 404);
      const res = json(body, 200, { 'Cache-Control': `public, max-age=${CONTENT_EDGE_TTL}` });
      ctx.waitUntil(cache.put(cacheKey, res.clone()));
      return res;
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'Upstream error' }, 502);
    }
  }

  return json({ error: 'Not found' }, 404);
}
