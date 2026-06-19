/// <reference types="@cloudflare/workers-types" />
/**
 * Dynamic sitemap.xml — core routes plus live project/blog URLs from the CMS,
 * each with vi/en hreflang alternates. Falls back to core routes if the CMS
 * is unreachable.
 */
import { Env } from './env';
import { listProjects, listPosts } from './content';

interface Entry {
  path: string;
  changefreq: string;
  priority: string;
}

export async function handleSitemap(origin: string, env: Env): Promise<Response> {
  const entries: Entry[] = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/work', changefreq: 'weekly', priority: '0.8' },
    { path: '/work/web', changefreq: 'monthly', priority: '0.6' },
    { path: '/work/app', changefreq: 'monthly', priority: '0.6' },
    { path: '/work/design', changefreq: 'monthly', priority: '0.6' },
    { path: '/blog', changefreq: 'weekly', priority: '0.7' },
    { path: '/about', changefreq: 'monthly', priority: '0.6' },
  ];

  if (env.EMDASH_BASE) {
    try {
      const [projects, posts] = await Promise.all([listProjects(env), listPosts(env)]);
      for (const p of projects) {
        entries.push({ path: `/project/${p.slug}`, changefreq: 'monthly', priority: '0.7' });
      }
      for (const post of posts) {
        if (post.status === 'published') {
          entries.push({ path: `/blog/${post.slug}`, changefreq: 'monthly', priority: '0.6' });
        }
      }
    } catch {
      /* fall back to core routes */
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map((e) => urlNode(origin, e)).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

function urlNode(origin: string, e: Entry): string {
  const loc = `${origin}${e.path}`;
  return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="vi" href="${loc}?lang=vi"/>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`;
}
