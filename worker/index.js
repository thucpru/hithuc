// Static-asset Worker with one job beyond serving files: honour Framer's CMS
// byte-range protocol for `*.framercms` data chunks.
//
// Framer's client-side router loads collection/detail content by fetching byte
// ranges of these files, encoding the range in the QUERY string as
// `?range=<from>-<to>` (inclusive, e.g. `?range=0-121` -> 122 bytes). It does
// NOT use an HTTP Range header. Framer's CDN returns just those bytes; the
// static-asset server (and `wrangler dev`) ignores the query and returns the
// whole file, so the CMS reader gets the wrong bytes and the page renders blank
// after client-side navigation. Here we read the whole asset and return the
// exact requested slice (status 200, matching the CDN). Everything else passes
// straight through to the static assets (keeping html_handling / not_found).

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isFramerCms =
      url.pathname.startsWith("/framer/") && url.pathname.endsWith(".framercms");
    const rangeParam = url.searchParams.get("range");
    const m = rangeParam && /^(\d+)-(\d+)$/.exec(rangeParam);

    if (isFramerCms && m) {
      // Fetch the full file from static assets (query stripped).
      const assetRes = await env.ASSETS.fetch(
        new Request(url.origin + url.pathname, { headers: { "Accept-Encoding": "identity" } })
      );
      if (!assetRes.ok) return assetRes;

      const buf = await assetRes.arrayBuffer();
      const total = buf.byteLength;
      const from = parseInt(m[1], 10);
      const to = parseInt(m[2], 10); // inclusive
      if (from > to || from >= total) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}`, "Accept-Ranges": "bytes" },
        });
      }
      const slice = buf.slice(from, Math.min(to, total - 1) + 1);
      return new Response(slice, {
        status: 200,
        headers: {
          "Content-Type":
            assetRes.headers.get("Content-Type") || "application/octet-stream",
          "Content-Length": String(slice.byteLength),
          "Accept-Ranges": "bytes",
          "Access-Control-Expose-Headers": "Content-Range",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // For everything else, serve the static asset — but make sure HTML carries an
    // explicit charset in the HTTP header. The static-asset server returns bare
    // `text/html` (no charset); with `X-Content-Type-Options: nosniff` the browser
    // then falls back to a locale default and mojibakes UTF-8 punctuation (em-dash
    // `—` -> `â`). Setting the header is authoritative and overrides any meta tag.
    const res = await env.ASSETS.fetch(request);
    const ct = res.headers.get("Content-Type") || "";
    if (ct.startsWith("text/html") && !/charset/i.test(ct)) {
      const headers = new Headers(res.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }
    return res;
  },
};
