// Recursive, multi-page Framer site mirror.
//
// The Framer site is a single SPA: every route is rendered client-side by the
// same JS bundle. The `site2code` export only contains the home page, and the
// live site serves a tiny client-render shell for sub-routes — UNLESS requested
// with a crawler User-Agent, in which case Framer returns the full pre-rendered
// HTML. So we:
//   1. read the home page from the local export (the user's source of truth),
//   2. fetch every other route from the live site with a Googlebot UA (full SSR),
//   3. recursively download every framerusercontent.com asset referenced by any
//      page or by the JS/JSON/CMS chunks (following literal URLs, runtime
//      `new URL("./x", base)` calls, and relative ESM imports),
//   4. rewrite asset hosts to a local origin and write each page to
//      public/<route>/index.html.
//
// Host-rewrite rules:
//   - JS  (.mjs/.js): host -> `${location.origin}/framer`  (absolute base, so the
//     bundle's `new URL(relative, base)` calls resolve).
//   - HTML/JSON/CSS : host -> `/framer`                     (element src/href only).
//   - Binary assets : saved verbatim.
// The live framer.app origin in page HTML is rewritten to the production domain
// so canonical/og:url tags are correct.

import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { dirname, join, extname } from "node:path";

const SRC = "C:/Users/Admin/Downloads/site2code-framer-1782314539084/index.html";
const OUT = "D:/AI/hithuc/public";
const LIVE = "https://voluntary-charts-008474.framer.app";
const PROD = "https://hithuc.com";
const DOMAIN = "https://framerusercontent.com";
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const JS_EXT = new Set([".mjs", ".js"]);
const TEXT_EXT = new Set([".mjs", ".js", ".json", ".css", ".map"]);

// --- URL discovery ---------------------------------------------------------
function findLiteralUrls(text) {
  const out = new Set();
  const re = /https:\/\/framerusercontent\.com\/[^\s"'`)\\<>]+/g;
  let m;
  while ((m = re.exec(text))) out.add(m[0].replace(/&amp;/g, "&"));
  return [...out];
}
// runtime `new URL("./rel", "https://framerusercontent.com/.../base.js")`
function findConstructedUrls(text) {
  const out = new Set();
  const re = /new URL\(`(\.\/[^`]+)`,\s*`(https:\/\/framerusercontent\.com\/[^`]+)`\)/g;
  let m;
  while ((m = re.exec(text))) {
    try { out.add(new URL(m[1], m[2]).toString()); } catch {}
  }
  return [...out];
}
function findUrls(text) {
  return [...new Set([...findLiteralUrls(text), ...findConstructedUrls(text)])];
}
// relative ESM specifiers inside a module (sibling chunks, e.g. lazy gsap)
function findRelativeImports(text, baseUrl) {
  const out = new Set();
  const re = /(?:from|import)\s*\(?\s*["'`](\.\.?\/[^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(text))) {
    try { out.add(new URL(m[1], baseUrl).toString()); } catch {}
  }
  return [...out];
}

const localPathFor = (url) => new URL(url).pathname;
const isText = (p) => TEXT_EXT.has(extname(p));
const isJs = (p) => JS_EXT.has(extname(p));
function fetchUrlFor(url) {
  const u = new URL(url);
  if (u.pathname.startsWith("/images/")) u.search = "";
  return u.toString();
}

const otherDomains = new Set();
function noteOtherDomains(text) {
  const re = /https:\/\/([a-z0-9.-]+)\//gi;
  let m;
  while ((m = re.exec(text)))
    if (m[1].toLowerCase() !== "framerusercontent.com") otherDomains.add(m[1].toLowerCase());
}

async function save(relPath, data) {
  const full = join(OUT, "framer", relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, data);
}

// --- collect pages ---------------------------------------------------------
async function getRoutes() {
  const xml = await (await fetch(`${LIVE}/sitemap.xml`, { headers: { "user-agent": UA } })).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(LIVE, "")) // path only
    .filter((p) => p && p !== "/");
}

const routes = await getRoutes();
console.log(`Routes from sitemap: home + ${routes.length} sub-pages`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Framer pre-renders on demand: the first crawler hit can return a ~28KB CSR
// shell while it generates, then full SSR HTML on retry. Retry until full.
async function fetchPage(route) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const html = await (await fetch(`${LIVE}${route}`, { headers: { "user-agent": UA } })).text();
    if (html.length >= 50000) return html;
    console.log(`  ~ ${route}: shell (${html.length}B), retry ${attempt}/6`);
    await sleep(2500);
  }
  throw new Error(`only got shell for ${route} after retries`);
}

const pages = [{ route: "/", html: await readFile(SRC, "utf8") }];
for (const route of routes) pages.push({ route, html: await fetchPage(route) });
console.log(`Fetched ${pages.length} pages (all full SSR)`);

// --- crawl assets (shared across all pages) --------------------------------
await rm(join(OUT, "framer"), { recursive: true, force: true });
const seen = new Set();
const queue = [];
for (const p of pages) for (const u of findUrls(p.html)) queue.push(u);

let downloaded = 0;
const failed = [];
while (queue.length) {
  const url = queue.shift();
  const relPath = localPathFor(url);
  if (seen.has(relPath)) continue;
  seen.add(relPath);
  try {
    const res = await fetch(fetchUrlFor(url), { headers: { "user-agent": "Mozilla/5.0 (mirror)" } });
    if (!res.ok) { failed.push(`${res.status} ${url}`); continue; }
    if (isText(relPath)) {
      let text = await res.text();
      noteOtherDomains(text);
      const refs = findUrls(text);
      if (isJs(relPath)) refs.push(...findRelativeImports(text, url));
      for (const u of refs) if (!seen.has(localPathFor(u))) queue.push(u);
      text = text.replaceAll(DOMAIN, isJs(relPath) ? "${location.origin}/framer" : "/framer");
      await save(relPath, text);
    } else {
      await save(relPath, Buffer.from(await res.arrayBuffer()));
    }
    if (++downloaded % 25 === 0) console.log(`  ...${downloaded} assets saved`);
  } catch (e) {
    failed.push(`ERR ${url} :: ${e.message}`);
  }
}
console.log(`\nDownloaded ${downloaded} assets to ${OUT}/framer`);
if (otherDomains.size) console.log("Other (left external):", [...otherDomains].sort().join(", "));
if (failed.length) { console.log(`\nFAILED (${failed.length}):`); for (const f of failed) console.log("  " + f); }

// --- sanitize URL-unsafe filenames -----------------------------------------
// Cloudflare's asset server redirects URLs containing `@` to the %40-encoded
// form — an extra hop on every page load (gsap is imported site-wide). Rename
// such files and patch every reference so modules load directly.
import { readdir, rename } from "node:fs/promises";
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const allFiles = await walk(join(OUT, "framer"));
const renames = new Map(); // oldBasename -> newBasename
for (const f of allFiles) {
  const base = f.split(/[\\/]/).pop();
  if (base.includes("@")) {
    const safe = base.replaceAll("@", "-");
    renames.set(base, safe);
    await rename(f, join(dirname(f), safe));
  }
}
if (renames.size) {
  const PATCH_EXT = new Set([".mjs", ".js", ".json", ".css", ".map"]);
  for (const f of allFiles) {
    if (!PATCH_EXT.has(extname(f))) continue;
    const cur = renames.has(f.split(/[\\/]/).pop())
      ? join(dirname(f), renames.get(f.split(/[\\/]/).pop()))
      : f;
    let t = await readFile(cur, "utf8");
    let changed = false;
    for (const [oldB, newB] of renames)
      if (t.includes(oldB)) { t = t.replaceAll(oldB, newB); changed = true; }
    if (changed) await writeFile(cur, t);
  }
  console.log(`Sanitized ${renames.size} URL-unsafe filename(s): ${[...renames.keys()].join(", ")}`);
}

// --- mirror CMS data to /cms/ ----------------------------------------------
// Framer's client router fetches collection data from /cms/<...>.framercms
// (derived at runtime as `<...>/modules/<...>`.replace('/modules/','/cms/')).
// The bytes are identical to the /modules/ copies we already have; replicate
// the tree so client-side navigation to /work and /blog pages resolves.
await rm(join(OUT, "framer", "cms"), { recursive: true, force: true });
for (const f of await walk(join(OUT, "framer", "modules"))) {
  if (!f.endsWith(".framercms")) continue;
  const rel = f.split(/framer[\\/]modules[\\/]/)[1];
  const dest = join(OUT, "framer", "cms", rel);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, await readFile(f));
}
console.log("Mirrored .framercms data under /framer/cms/");

// Injected into every page <head>:
//   1. hide the "Made in Framer" badge (JS-injected `.__framer-badge`).
//   2. force scroll-to-top on client-side navigation. Framer's links carry a
//      `#work-section`/`#article-section` hash that also exists on the source
//      page, so on SPA nav it scrolls to the *stale* anchor (page bottom) before
//      the destination renders -> you land at the bottom. Overriding scroll to 0
//      for a few frames after each path change (beats Lenis smooth-scroll) keeps
//      detail pages opening at the top.
const HEAD_INJECT =
  `<style id="hithuc-overrides">#__framer-badge-container,.__framer-badge,#__framer-editorbar-container,[class*="__framer-editorbar"]{display:none!important}</style>` +
  // Clear the leftover Framer-editor flag so the edit bar (framer.com/edit) never loads.
  `<script>(function(){try{localStorage.removeItem('__framer_force_showing_editorbar_since')}catch(e){}` +
  `try{if('scrollRestoration'in history)history.scrollRestoration='manual'}catch(e){}` +
  `var lp=location.pathname,lockUntil=0;` +
  `function zero(){try{window.scrollTo(0,0);if(document.scrollingElement)document.scrollingElement.scrollTop=0}catch(e){}}` +
  // Re-zero on every scroll during the lock window so Lenis smooth-scroll can't
  // drag the page back down to the stale anchor.
  `addEventListener('scroll',function(){if(performance.now()<lockUntil)zero()},{passive:true,capture:true});` +
  `function lock(){lockUntil=performance.now()+700;zero();var n=0;(function r(){zero();if(++n<45)requestAnimationFrame(r)})()}` +
  `function nav(){if(location.pathname!==lp){lp=location.pathname;lock()}}` +
  `['pushState','replaceState'].forEach(function(k){var o=history[k];history[k]=function(){var r=o.apply(this,arguments);nav();return r}});` +
  `addEventListener('popstate',nav)})();</script>`;

// --- write pages -----------------------------------------------------------
await rm(join(OUT, "work"), { recursive: true, force: true });
await rm(join(OUT, "blog"), { recursive: true, force: true });
for (const { route, html } of pages) {
  let out = html
    .replaceAll(DOMAIN, "/framer")          // assets -> local
    .replaceAll(LIVE, PROD);                // canonical/og:url -> production
  out = out.replaceAll(
    'content="/framer/assets/BMKOu79jBtM2GOCccyl1NoizDoU.png"',
    `content="${PROD}/framer/assets/BMKOu79jBtM2GOCccyl1NoizDoU.png"`
  );
  out = out.replace(/<head>/i, `<head>${HEAD_INJECT}`); // badge-hide + scroll-to-top
  const file = route === "/" ? join(OUT, "index.html") : join(OUT, route, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, out);
}
console.log(`\nWrote ${pages.length} page(s): / and ${routes.map((r) => r).join(", ")}`);

// --- content overrides -----------------------------------------------------
// Customisations on top of the Framer source. Applied to BOTH the page HTML and
// the JS/JSON bundles, because the SPA re-renders from the bundles after
// hydration (a page-only edit would be overwritten on the client).
const OVERRIDES = [
  ["mejed@templyo.io", "thucpru@gmail.com"], // contact email (was template default)
  [" - Majd", " - Hi Thuc"],                 // page-title brand suffix
  ["https://framer.link/nnhGcWR", "/work"],  // template "Get Started" CTA -> Work page
  // Sellvoxa voice widget: swap the template's tenant for ours (one widget, not two).
  ["snip_56759c6ba7f14d15a003", "snip_630b90edd8b54e7c9e05"],
  // ...and make that CTA open in the same tab (it's the only New-Tab=true button;
  // `vqeCSP_jL` is Framer's "New Tab" boolean prop). Internal nav shouldn't pop a tab.
  ["vqeCSP_jL:!0", "vqeCSP_jL:!1"],
];
const OVR_EXT = new Set([".html", ".mjs", ".js", ".json", ".css", ".map"]);
const everyText = (await walk(OUT)).filter((f) => OVR_EXT.has(extname(f)));
let ovrHits = 0;
for (const f of everyText) {
  let t = await readFile(f, "utf8");
  let changed = false;
  for (const [a, b] of OVERRIDES) if (t.includes(a)) { t = t.replaceAll(a, b); changed = true; ovrHits++; }
  if (changed) await writeFile(f, t);
}
console.log(`Applied content overrides (${ovrHits} file-hits): email, title brand, template CTA -> /work`);
