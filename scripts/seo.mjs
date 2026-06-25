// SEO/AEO/GEO post-processor for the hithuc.com static export.
//
// Idempotent: runs on the already-generated files in ./public (so it can be run
// standalone — `node scripts/seo.mjs` — after any edit) and is also invoked at
// the end of scripts/mirror.mjs, so everything below survives a re-mirror.
//
// It (1) writes robots.txt (with Sitemap + AI-crawler intent), sitemap.xml, and
// llms.txt, and (2) injects schema.org JSON-LD into every page <head> based on
// the route: home = Person + WebSite, /work = CollectionPage, /work/* =
// CreativeWork (about the product), /blog = Blog, /blog/* = BlogPosting.
//
// AEO (rich results / AI Overviews) and GEO (LLM citations) both lean on this
// structured data + llms.txt; hithuc.com is the entity hub linking all products.

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");
const PROD = "https://hithuc.com";
const MARKER = 'data-seo="hithuc"'; // idempotency: identifies our injected block

// --- helpers ---------------------------------------------------------------
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const decode = (s) =>
  (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .trim();

const pick = (html, re) => {
  const m = html.match(re);
  return m ? decode(m[1]) : "";
};

// route ("/", "/work", "/blog/slug") -> absolute prod URL
const routeOf = (file) => {
  const r = file.slice(OUT.length).replace(/\\/g, "/").replace(/\/index\.html$/, "");
  return r === "" ? "/" : r;
};
const absUrl = (route) => PROD + (route === "/" ? "/" : route);

// og:image is a relative /framer/... path (often with ?width=640); make it
// absolute + decode entities so schema/social get a real URL.
const absImage = (raw) => {
  const v = decode(raw);
  if (!v) return `${PROD}/og-image.png`;
  if (v.startsWith("http")) return v;
  return PROD + v;
};

// Products behind the /work/* case studies (drives the schema `about` node).
const PRODUCTS = {
  peachgen: { type: "SoftwareApplication", category: "MultimediaApplication", os: "Web", name: "Peachgen" },
  lovdes: { type: "SoftwareApplication", category: "DesignApplication", os: "Figma, Adobe Photoshop, Web", name: "Lovdes" },
  sellvoxa: { type: "SoftwareApplication", category: "BusinessApplication", os: "Web", name: "Sellvoxa" },
  aimatee: { type: "MobileApplication", category: "EducationApplication", os: "Android", name: "Aimatee" },
};

const PERSON = {
  "@type": "Person",
  "@id": `${PROD}/#person`,
  name: "Hi Thuc",
  url: `${PROD}/`,
  jobTitle: "AI Product Designer & Builder",
  description:
    "Independent builder who designs and ships AI-powered web and mobile products end-to-end.",
};

// --- search-result metadata (title / description) per route ----------------
// Google shows the <title> and <meta name="description">. The Framer export
// leaves the home title bare ("Hi Thuc") and reuses ONE description across
// home/work/blog (duplicate snippets Google collapses). Override the hub routes
// with unique, keyword-led copy; other routes keep their own Framer title/desc.
const BRAND = "Hi Thuc";
const SUFFIX = ` — ${BRAND}`;
const META = {
  "/": {
    title: "Hi Thuc — AI Web & App Builder, Idea to Live",
    description:
      "Hi Thuc designs and builds AI-powered web and mobile products end-to-end — from idea to a live, revenue-ready product. Launch faster, spend less, convert more.",
  },
  "/work": {
    title: `Work${SUFFIX}`,
    description:
      "Selected work by Hi Thuc: Sellvoxa (voice AI agent for websites), Lovdes (AI design in Figma), Peachgen (AI creative platform), and Aimatee (AI English app) — built end-to-end.",
  },
  "/blog": {
    title: `Blog${SUFFIX}`,
    description:
      "Essays by Hi Thuc on shipping AI products solo: design-to-code loops, AI agents, landing pages that convert, and choosing between web and mobile.",
  },
};

// Brand-name typos in the Framer source titles ("Peach Gen", "Sell Voxa").
const BRAND_FIXES = [
  ["Peach Gen", "Peachgen"],
  ["Sell Voxa", "Sellvoxa"],
];
const fixBrand = (s) => BRAND_FIXES.reduce((t, [a, b]) => t.split(a).join(b), s);
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Square favicon set (cropped portrait) + manifest, replacing Framer's
// non-square portrait icon that Google can't render as a favicon.
const ICON_LINKS =
  `<link rel="icon" href="/favicon.ico" sizes="any">` +
  `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">` +
  `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">` +
  `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` +
  `<link rel="manifest" href="/site.webmanifest">`;

// Rewrite a single <meta> tag's content (matches either attribute order). Adds
// the tag before </head> if absent. Idempotent.
function setMeta(html, selector, value) {
  const re = new RegExp(
    `<meta(?=[^>]*${selector})[^>]*>`,
    "i"
  );
  const tag =
    selector.startsWith('property=')
      ? `<meta property="${selector.slice(10, -1)}" content="${esc(value)}">`
      : `<meta name="${selector.slice(6, -1)}" content="${esc(value)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `${tag}</head>`);
}

// Every blog post ships the SAME generic Framer description. Each post does,
// however, carry a one/two-sentence "Summary" block right under its title —
// the perfect, accurate snippet. Pull its text (words are wrapped in per-letter
// animation spans) so each post gets a unique description that tracks the copy.
function extractSummary(html) {
  const m = html.match(/data-framer-name="Summary"[^>]*>(.*?)<\/div>/is);
  if (!m) return "";
  const text = decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
  if (text.length < 40) return "";
  return text.length > 300 ? text.slice(0, 297).replace(/\s+\S*$/, "") + "…" : text;
}

// Apply title/description/og/twitter/favicon to a page's <head>. Returns the
// HTML plus the final {name, description} used for the JSON-LD graph.
function applyHeadMeta(html, route) {
  const rawTitle = fixBrand(pick(html, /<title>([^<]*)<\/title>/i).replace(/\s+/g, " ").trim());
  const override = META[route];
  const title = override?.title || rawTitle || BRAND;
  const description =
    override?.description ||
    (route.startsWith("/blog/") && extractSummary(html)) ||
    pick(html, /<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
    "Hi Thuc — AI-powered web & mobile products, designed and built end-to-end.";

  // <title>
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
  // description + social titles/descriptions (keep og:image/url untouched)
  html = setMeta(html, 'name="description"', description);
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', description);

  // Favicons: strip Framer's icon/apple-touch/manifest links, inject our set once.
  html = html
    .replace(/<link[^>]*rel="(?:icon|apple-touch-icon|manifest)"[^>]*>\s*/gi, "")
    .replace(/<\/head>/i, `${ICON_LINKS}</head>`);

  // schema's `name` drops the brand suffix (it's the entity/page name).
  const name = title.replace(/\s*[—-]\s*Hi Thuc\s*$/i, "").trim() || BRAND;
  return { html, name, description };
}

// --- per-route JSON-LD graph ----------------------------------------------
function graphFor(route, { name, description, url, image }) {
  const base = [PERSON];

  if (route === "/") {
    base.push({
      "@type": "WebSite",
      "@id": `${PROD}/#website`,
      url: `${PROD}/`,
      name: "Hi Thuc",
      inLanguage: "en",
      publisher: { "@id": `${PROD}/#person` },
    });
    base.push({
      "@type": "ProfilePage",
      url,
      name,
      description,
      mainEntity: { "@id": `${PROD}/#person` },
    });
    return base;
  }

  if (route === "/work") {
    base.push({
      "@type": "CollectionPage",
      url,
      name,
      description,
      isPartOf: { "@id": `${PROD}/#website` },
      about: { "@id": `${PROD}/#person` },
    });
    return base;
  }

  const workSlug = route.startsWith("/work/") ? route.slice("/work/".length) : null;
  if (workSlug && PRODUCTS[workSlug]) {
    const p = PRODUCTS[workSlug];
    base.push({
      "@type": "CreativeWork",
      url,
      name,
      description,
      image,
      author: { "@id": `${PROD}/#person` },
      about: {
        "@type": p.type,
        name: p.name,
        applicationCategory: p.category,
        operatingSystem: p.os,
        description,
      },
    });
    return base;
  }

  if (route === "/blog") {
    base.push({
      "@type": "Blog",
      url,
      name,
      description,
      inLanguage: "en",
      publisher: { "@id": `${PROD}/#person` },
    });
    return base;
  }

  if (route.startsWith("/blog/")) {
    base.push({
      "@type": "BlogPosting",
      headline: name,
      description,
      url,
      image,
      mainEntityOfPage: url,
      inLanguage: "en",
      author: { "@id": `${PROD}/#person` },
      publisher: { "@id": `${PROD}/#person` },
    });
    return base;
  }

  // Fallback: a plain WebPage.
  base.push({ "@type": "WebPage", url, name, description });
  return base;
}

// --- inject JSON-LD into one page ------------------------------------------
async function injectPage(file) {
  let html = await readFile(file, "utf8");
  const route = routeOf(file);

  // Normalise search-result metadata (title/description/og/twitter/favicons)
  // first, then build the JSON-LD from the SAME final title/description.
  const applied = applyHeadMeta(html, route);
  html = applied.html;
  const name = applied.name;
  const description = applied.description;
  const canonical = pick(html, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) || absUrl(route);
  const image = absImage(pick(html, /<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i));

  const graph = graphFor(route, { name, description, url: canonical, image });
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  const block = `<script type="application/ld+json" ${MARKER}>${json}</script>`;

  // Idempotent: drop any previously-injected block, then add the fresh one.
  html = html.replace(
    new RegExp(`<script type="application/ld\\+json" ${MARKER}>.*?</script>`, "s"),
    ""
  );
  html = html.replace(/<\/head>/i, `${block}</head>`);
  await writeFile(file, html);
  return route;
}

// --- robots.txt / sitemap.xml / llms.txt -----------------------------------
async function writeSiteFiles(routes) {
  await writeFile(
    join(OUT, "robots.txt"),
    `# Hi Thuc — ${PROD}
# Everything is public. AI answer-engine crawlers (GPTBot, ClaudeBot,
# PerplexityBot, Google-Extended, Applebot-Extended, Bingbot…) match the
# wildcard group and are intentionally ALLOWED — this is the entity hub we want
# AI engines to read and cite (GEO).

User-agent: *
Allow: /

Sitemap: ${PROD}/sitemap.xml
`
  );

  const urls = routes
    .slice()
    .sort()
    .map(
      (r) =>
        `  <url>\n    <loc>${absUrl(r)}</loc>\n    <changefreq>${
          r === "/" ? "weekly" : "monthly"
        }</changefreq>\n    <priority>${r === "/" ? "1.0" : r.includes("/") && r !== "/work" && r !== "/blog" ? "0.7" : "0.8"}</priority>\n  </url>`
    )
    .join("\n");
  await writeFile(
    join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );

  await writeFile(
    join(OUT, "llms.txt"),
    `# Hi Thuc

> Hi Thuc (hithuc.com) is the portfolio of an independent builder who designs and
> ships AI-powered web and mobile products end-to-end — from idea to live,
> revenue-ready product, without an agency price tag. Languages: English & Vietnamese.

## Products / case studies
- Sellvoxa — embeddable Voice AI Agent for any website ("Website Biết Nói"). https://sellvoxa.com/ · ${PROD}/work/sellvoxa
- Lovdes — AI design assistant inside Figma & Photoshop. https://lovdes.com/ · ${PROD}/work/lovdes
- Peachgen — all-in-one AI creative platform (images, video, voice). https://peachgen.com/ · ${PROD}/work/peachgen
- Aimatee — mobile app to learn workplace English with AI colleagues (Android). https://aimatee.com/ · ${PROD}/work/aimatee

## Writing
- Blog: ${PROD}/blog — essays on shipping AI products solo, design-to-code loops, AI agents, and web vs mobile.

## Contact
- thucpru@gmail.com
`
  );
}

// --- run -------------------------------------------------------------------
const pages = (await walk(OUT)).filter((f) => f.replace(/\\/g, "/").endsWith("/index.html"));
const routes = [];
for (const f of pages) routes.push(await injectPage(f));
await writeSiteFiles(routes);
console.log(
  `✓ SEO: injected JSON-LD into ${routes.length} pages; wrote robots.txt, sitemap.xml (${routes.length} urls), llms.txt`
);
