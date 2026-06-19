/// <reference types="@cloudflare/workers-types" />
/**
 * hithuc.com Worker.
 *
 * - Serves the React SPA from the `ASSETS` static-assets binding.
 * - Exposes `/api/*` which proxies the EmDash headless CMS, merging EmDash's
 *   row-per-locale content (a `vi` row + an `en` row sharing a
 *   `translation_group`) back into the `{vi,en}` JSON shape the React app
 *   already consumes (identical to `public/data/*.json`).
 *
 * If `EMDASH_BASE` is unset or EmDash is unreachable, `/api/*` returns 502 and
 * the client falls back to the static `/data/*.json` shipped with the build.
 */

interface Env {
  ASSETS: Fetcher;
  EMDASH_BASE?: string;
  EMDASH_TOKEN?: string;
}

const LOCALES = ['vi', 'en'] as const;
type Locale = (typeof LOCALES)[number];

const EDGE_TTL = 60; // seconds

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(url, env, ctx);
    }
    // Everything else → static assets (SPA fallback handled by wrangler config).
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.EMDASH_BASE) {
    return json({ error: 'EMDASH_BASE not configured' }, 502);
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const body = await route(url, env);
    if (body === undefined) return json({ error: 'Not found' }, 404);

    const res = json(body, 200, {
      'Cache-Control': `public, max-age=${EDGE_TTL}`,
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Upstream error' }, 502);
  }
}

async function route(url: URL, env: Env): Promise<unknown> {
  const path = url.pathname;

  if (path === '/api/projects') return listProjects(env);
  if (path.startsWith('/api/projects/')) {
    const slug = decodeURIComponent(path.slice('/api/projects/'.length));
    return (await listProjects(env)).find((p) => p.slug === slug);
  }
  if (path === '/api/posts') return listPosts(env);
  if (path.startsWith('/api/posts/')) {
    const slug = decodeURIComponent(path.slice('/api/posts/'.length));
    return (await listPosts(env)).find((p) => p.slug === slug);
  }
  if (path === '/api/profile') return getProfile(env);
  return undefined;
}

/* ------------------------------ EmDash fetch ------------------------------ */

async function fetchCollection(env: Env, collection: string, locale: Locale): Promise<RawItem[]> {
  const base = env.EMDASH_BASE!.replace(/\/$/, '');
  const u = `${base}/_emdash/api/content/${collection}?status=published&locale=${locale}&limit=200`;
  const res = await fetch(u, {
    headers: env.EMDASH_TOKEN ? { authorization: `Bearer ${env.EMDASH_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error(`EmDash ${collection} (${locale}) → ${res.status}`);
  const payload = (await res.json()) as { data?: { items?: RawItem[] }; items?: RawItem[] };
  return payload.data?.items ?? payload.items ?? [];
}

/**
 * Pair up the per-locale rows of a collection by `translation_group` (falling
 * back to slug), then run `map(vi, en)` for each logical entry.
 */
async function pairLocales<T>(
  env: Env,
  collection: string,
  map: (vi: RawItem | undefined, en: RawItem | undefined) => T,
): Promise<T[]> {
  const [vi, en] = await Promise.all([
    fetchCollection(env, collection, 'vi'),
    fetchCollection(env, collection, 'en'),
  ]);

  const groups = new Map<string, { vi?: RawItem; en?: RawItem }>();
  const keyOf = (item: RawItem) =>
    String(field(item, 'translation_group') ?? item.translation_group ?? field(item, 'slug') ?? '');

  for (const item of vi) {
    const k = keyOf(item);
    groups.set(k, { ...(groups.get(k) ?? {}), vi: item });
  }
  for (const item of en) {
    const k = keyOf(item);
    groups.set(k, { ...(groups.get(k) ?? {}), en: item });
  }

  return [...groups.values()].map(({ vi: v, en: e }) => map(v, e));
}

/* ------------------------------- mappers ---------------------------------- */

async function listProjects(env: Env) {
  const items = await pairLocales(env, 'projects', (vi, en) => {
    const base = en ?? vi!;
    return {
      id: String(field(base, 'slug') ?? field(base, 'id') ?? ''),
      slug: String(field(base, 'slug') ?? ''),
      type: String(field(base, 'type') ?? 'web'),
      title: loc(vi, en, 'title'),
      summary: loc(vi, en, 'summary'),
      description: loc(vi, en, 'description'),
      coverImage: imageUrl(field(base, 'coverImage')),
      gallery: asJson(field(base, 'gallery')) ?? [],
      tags: asJson(field(base, 'tags')) ?? [],
      role: field(base, 'role') ?? undefined,
      year: field(base, 'year') != null ? String(field(base, 'year')) : undefined,
      stack: asJson(field(base, 'stack')) ?? [],
      links: asJson(field(base, 'links')) ?? {},
      featured: Boolean(field(base, 'featured')),
      order: Number(field(base, 'order') ?? Number.MAX_SAFE_INTEGER),
    };
  });
  return items
    .filter((p) => p.slug)
    .sort((a, b) => a.order - b.order);
}

async function listPosts(env: Env) {
  const items = await pairLocales(env, 'posts', (vi, en) => {
    const base = en ?? vi!;
    return {
      slug: String(field(base, 'slug') ?? ''),
      status: String(field(base, 'status') ?? 'published'),
      publishedAt: String(field(base, 'publishedAt') ?? field(base, 'created_at') ?? ''),
      cover: imageUrl(field(base, 'cover')),
      tags: asJson(field(base, 'tags')) ?? [],
      title: loc(vi, en, 'title'),
      excerpt: loc(vi, en, 'excerpt'),
      body: loc(vi, en, 'body'),
    };
  });
  return items.filter((p) => p.slug);
}

async function getProfile(env: Env) {
  const items = await pairLocales(env, 'profile', (vi, en) => {
    const base = en ?? vi!;
    return {
      name: String(field(base, 'name') ?? ''),
      tagline: loc(vi, en, 'tagline'),
      bio: loc(vi, en, 'bio'),
      avatar: imageUrl(field(base, 'avatar')),
      socials: asJson(field(base, 'socials')) ?? [],
      contact: asJson(field(base, 'contact')) ?? { email: '' },
    };
  });
  return items[0] ?? null;
}

/* ------------------------------- helpers ---------------------------------- */

interface RawItem {
  [key: string]: unknown;
  translation_group?: unknown;
  fields?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

/** Read a content field whether EmDash returns it flat or nested under fields/data. */
function field(item: RawItem | undefined, name: string): unknown {
  if (!item) return undefined;
  if (item[name] !== undefined) return item[name];
  if (item.fields && item.fields[name] !== undefined) return item.fields[name];
  if (item.data && item.data[name] !== undefined) return item.data[name];
  return undefined;
}

/** Build a `{vi,en}` localized string from the paired rows. */
function loc(vi: RawItem | undefined, en: RawItem | undefined, name: string) {
  const v = field(vi, name);
  const e = field(en, name);
  return {
    vi: String(v ?? e ?? ''),
    en: String(e ?? v ?? ''),
  };
}

/** Parse a JSON-typed field that may arrive as an object or a JSON string. */
function asJson(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
}

/** Normalize an EmDash image field (string URL, or `{url}`/`{src}` object). */
function imageUrl(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return String(o.url ?? o.src ?? o.href ?? '');
  }
  return '';
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
