// SNV Money Jars — minimal service worker.
// Its main job is to make the app installable and load fast.
// We deliberately keep caching simple: cache the app shell, but
// always go to the network for Supabase API calls (never cache data).

const CACHE = "snv-money-jars-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache Supabase (auth + data must always be live).
  if (url.hostname.endsWith("supabase.co")) return;

  // Only handle GET requests for our own origin.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Network-first for navigation (so new deploys show up), fall back to cache offline.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
