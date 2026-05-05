// Anchor service worker — caches app shell for offline use

const CACHE_NAME = "anchor-v1";

const SHELL = [
  "/",
  "/index.html",
  "/src/styles.css",
  "/src/main.js",
  "/src/lib/db.js",
  "/src/lib/content.js",
  "/src/views/home.js",
  "/src/views/learning.js",
  "/src/views/journal.js",
  "/src/views/intervention.js",
  "/src/data/content.json",
  "/manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match("/index.html"));
    })
  );
});
