/// <reference types="@cloudflare/workers-types" />
/**
 * RAG knowledge base (Phase 3).
 *
 * - `/api/kb/search`: embed the query (Workers AI bge-m3) and query Vectorize.
 * - `/api/kb/reindex`: pull content from the EmDash proxy, embed per-locale
 *   documents and upsert them into Vectorize. Triggered by a cron and by a
 *   secret-guarded POST.
 */
import { Env, json } from './env';
import { listProjects, listPosts } from './content';

const EMBED_MODEL = '@cf/baai/bge-m3';
const TOP_K = 5;

interface KbMatch {
  text: string;
  url: string;
  title: string;
  score: number;
}

export async function handleKbSearch(request: Request, env: Env): Promise<Response> {
  if (!env.AI || !env.VEC) return json({ error: 'KB not configured' }, 503);

  let query = '';
  try {
    const body = (await request.json()) as { query?: string };
    query = (body.query ?? '').trim();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!query) return json({ error: 'Missing query' }, 400);

  const vector = await embed(env, [query]);
  const result = await env.VEC.query(vector[0], { topK: TOP_K, returnMetadata: 'all' });

  const matches: KbMatch[] = (result.matches ?? []).map((m) => ({
    score: m.score,
    text: String(m.metadata?.text ?? ''),
    url: String(m.metadata?.url ?? ''),
    title: String(m.metadata?.title ?? ''),
  }));

  return json({ matches });
}

export async function reindex(env: Env): Promise<{ upserted: number }> {
  if (!env.AI || !env.VEC) throw new Error('KB not configured');

  const [projects, posts] = await Promise.all([listProjects(env), listPosts(env)]);
  const docs: { id: string; text: string; url: string; title: string }[] = [];

  for (const p of projects) {
    for (const lang of ['vi', 'en'] as const) {
      docs.push({
        id: `project:${p.slug}:${lang}`,
        title: p.title[lang],
        url: `/project/${p.slug}`,
        text: [p.title[lang], p.summary[lang], p.description[lang], (p.tags as string[] | undefined)?.join(', ')]
          .filter(Boolean)
          .join('\n'),
      });
    }
  }
  for (const post of posts) {
    if (post.status !== 'published') continue;
    for (const lang of ['vi', 'en'] as const) {
      docs.push({
        id: `post:${post.slug}:${lang}`,
        title: post.title[lang],
        url: `/blog/${post.slug}`,
        text: [post.title[lang], post.excerpt[lang], post.body[lang]].filter(Boolean).join('\n'),
      });
    }
  }

  // Embed + upsert in batches to stay within model/Vectorize limits.
  const BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    const vectors = await embed(env, slice.map((d) => d.text));
    await env.VEC.upsert(
      slice.map((d, j) => ({
        id: d.id,
        values: vectors[j],
        metadata: { text: d.text.slice(0, 1000), url: d.url, title: d.title },
      })),
    );
    upserted += slice.length;
  }
  return { upserted };
}

async function embed(env: Env, texts: string[]): Promise<number[][]> {
  const res = (await env.AI!.run(EMBED_MODEL, { text: texts })) as { data: number[][] };
  return res.data;
}
