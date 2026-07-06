/* Staff Challenge 26 — service worker.
   Two jobs only: (1) repeat opens paint instantly — the app shell is served from
   cache while a background fetch refreshes it (stale-while-revalidate, so a deploy
   reaches every device on its NEXT open, same order of staleness GitHub Pages'
   10-minute cache already allowed); (2) the installed PWA opens offline instead
   of a white page. Data stays live: Supabase and ESPN requests are NEVER
   intercepted — every score, pick and save hits the network exactly as before.
   Carto map tiles are also left alone (unbounded surface; the browser HTTP cache
   handles them). Bump VER to drop every old cache on the next activate. */
const VER = "wc26-sw-v1";
const CORE = ["/", "/watch.html", "/manifest.json", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];
/* immutable-ish third parties: font files, flag PNGs, versioned cdnjs libs */
const CDN_CACHE_FIRST = ["fonts.gstatic.com", "flagcdn.com", "cdnjs.cloudflare.com"];
/* UA-keyed but tiny and stable per device: the Google Fonts CSS */
const CDN_SWR = ["fonts.googleapis.com"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VER).then(function (c) {
      /* per-URL add: one 404 (e.g. a renamed icon) must not fail the whole install */
      return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VER; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* stale-while-revalidate: cached copy now, network copy into the cache for next time */
function swr(req, key) {
  return caches.open(VER).then(function (c) {
    return c.match(key || req).then(function (hit) {
      const net = fetch(req).then(function (r) {
        if (r && (r.ok || r.type === "opaque")) c.put(key || req, r.clone());
        return r;
      }).catch(function () { return null; });
      return hit || net.then(function (r) { return r || Response.error(); });
    });
  });
}

function cacheFirst(req) {
  return caches.open(VER).then(function (c) {
    return c.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (r) {
        if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone());
        return r;
      });
    });
  });
}

self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET") return; /* writes always go straight through */
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin === location.origin) {
    /* pages: key by pathname so /?tv and / share one cached shell (and /index.html === /) */
    if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
      const key = url.pathname === "/index.html" ? "/" : url.pathname;
      e.respondWith(swr(req, key));
      return;
    }
    e.respondWith(swr(req)); /* manifest, icons, og */
    return;
  }
  if (CDN_CACHE_FIRST.indexOf(url.hostname) >= 0) { e.respondWith(cacheFirst(req)); return; }
  if (CDN_SWR.indexOf(url.hostname) >= 0) { e.respondWith(swr(req)); return; }
  /* everything else — Supabase REST, ESPN live scores, Carto tiles — untouched */
});
