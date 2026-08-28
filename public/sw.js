// public/sw.js
//
// Caches the APP SHELL — this site's own HTML/CSS/JS — so a repeat visit
// opens with no network at all. Deliberately does NOT touch map tiles or
// PMTiles packs: those are large, explicit downloads the visitor chooses in
// OfflineMapsPanel.astro and stores in OPFS (src/lib/offlinePacks.ts). A
// service worker caching gigabytes of tile bytes behind the scenes would be
// exactly the "download without asking" this project's Goodwill pillar
// (DURABILITY.md) rules out — and Cache API storage counts against the
// same-origin quota a phone-sized OPFS pack budget already has to share.
//
// Strategy: cache-first for anything already cached (instant, no network
// wait — the point of a PWA shell), falling back to network and caching what
// comes back. A navigation request that fails offline with nothing cached
// yet falls back to the cached "/" so the app frame still loads.

const SHELL_CACHE = "sea-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/icon.svg"])),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isTileRequest(url) {
  // Never intercept PMTiles archives (this origin's /*.pmtiles, if ever
  // served locally) or the configured tile hosts — those are handled by
  // offlinePacks.ts's own OPFS storage, on the visitor's explicit action, not
  // by this worker's implicit cache.
  return url.pathname.endsWith(".pmtiles") || url.hostname.includes("tiles.");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let tile/vendor requests pass through untouched
  if (isTileRequest(url)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => (event.request.mode === "navigate" ? caches.match("/") : undefined));
    }),
  );
});
