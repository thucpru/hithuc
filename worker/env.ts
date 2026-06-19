/// <reference types="@cloudflare/workers-types" />

export interface Env {
  // Static assets (React SPA)
  ASSETS: Fetcher;

  // Phase 2 — EmDash headless CMS proxy
  EMDASH_BASE?: string;
  EMDASH_TOKEN?: string;

  // Phase 3 — chatbot
  AI?: Ai;                       // Workers AI (embeddings)
  VEC?: VectorizeIndex;          // Vectorize (RAG index)
  RATE?: KVNamespace;            // usage counters / daily caps
  RATE_LIMITER?: RateLimit;      // Workers Rate Limiting binding (per-IP)

  // Secrets
  TURNSTILE_SECRET?: string;
  PIPECAT_API_KEY?: string;
  PIPECAT_AGENT?: string;        // e.g. "hithuc-bot"
  KB_REINDEX_SECRET?: string;
}

/** Minimal Rate Limiting binding shape (avoids extra type deps). */
export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
