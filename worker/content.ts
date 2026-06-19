/// <reference types="@cloudflare/workers-types" />
/**
 * EmDash headless CMS proxy (Phase 2).
 *
 * Fetches each collection per locale and merges EmDash's row-per-locale content
 * (a `vi` row + an `en` row sharing a `translation_group`) into the `{vi,en}`
 * JSON shape the React app consumes (identical to `public/data/*.json`).
 */
import { Env } from './env';

const LOCALES = ['vi', 'en'] as const;
type Locale = (typeof LOCALES)[number];

export interface LocalizedString {
  vi: string;
  en: string;
}

export interface ProjectOut {
  id: string;
  slug: string;
  type: string;
  title: LocalizedString;
  summary: LocalizedString;
  description: LocalizedString;
  coverImage: string;
  gallery: unknown;
  tags: unknown;
  role?: string;
  year?: string;
  stack: unknown;
  links: unknown;
  featured: boolean;
  order: number;
}

export interface PostOut {
  slug: string;
  status: string;
  publishedAt: string;
  cover: string;
  tags: unknown;
  title: LocalizedString;
  excerpt: LocalizedString;
  body: LocalizedString;
}

/** Resolve one of the content routes; returns `undefined` for unknown paths. */
export async function routeContent(path: string, env: Env): Promise<unknown | undefined> {
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

export async function listProjects(env: Env): Promise<ProjectOut[]> {
  const items = await pairLocales(env, 'projects', (vi, en): ProjectOut => {
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
      role: field(base, 'role') != null ? String(field(base, 'role')) : undefined,
      year: field(base, 'year') != null ? String(field(base, 'year')) : undefined,
      stack: asJson(field(base, 'stack')) ?? [],
      links: asJson(field(base, 'links')) ?? {},
      featured: Boolean(field(base, 'featured')),
      order: Number(field(base, 'order') ?? Number.MAX_SAFE_INTEGER),
    };
  });
  return items.filter((p) => p.slug).sort((a, b) => a.order - b.order);
}

export async function listPosts(env: Env): Promise<PostOut[]> {
  const items = await pairLocales(env, 'posts', (vi, en): PostOut => {
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

export async function getProfile(env: Env): Promise<unknown> {
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

async function pairLocales<T>(
  env: Env,
  collection: string,
  map: (vi: RawItem | undefined, en: RawItem | undefined) => T,
): Promise<T[]> {
  if (!env.EMDASH_BASE) throw new Error('EMDASH_BASE not configured');
  const [vi, en] = await Promise.all([
    fetchCollection(env, collection, 'vi'),
    fetchCollection(env, collection, 'en'),
  ]);

  const groups = new Map<string, { vi?: RawItem; en?: RawItem }>();
  const keyOf = (item: RawItem) =>
    String(field(item, 'translation_group') ?? field(item, 'slug') ?? '');

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

/* ------------------------------- helpers ---------------------------------- */

interface RawItem {
  [key: string]: unknown;
  fields?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

function field(item: RawItem | undefined, name: string): unknown {
  if (!item) return undefined;
  if (item[name] !== undefined) return item[name];
  if (item.fields && item.fields[name] !== undefined) return item.fields[name];
  if (item.data && item.data[name] !== undefined) return item.data[name];
  return undefined;
}

function loc(vi: RawItem | undefined, en: RawItem | undefined, name: string): LocalizedString {
  const v = field(vi, name);
  const e = field(en, name);
  return { vi: String(v ?? e ?? ''), en: String(e ?? v ?? '') };
}

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

function imageUrl(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return String(o.url ?? o.src ?? o.href ?? '');
  }
  return '';
}
