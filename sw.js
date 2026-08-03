const CACHE = "erindale-vocab-v1";
const FILES = [
  "./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png",
  "./data/set_a.js", "./data/set_a1.js", "./data/set_b.js", "./data/set_b1.js",
  "./data/set_c.js", "./data/set_c1.js", "./data/set_d.js", "./data/set_d1.js",
  "./data/set_e.js", "./data/set_e1.js", "./data/set_f.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선 + 백그라운드 갱신: 오프라인에서도 열리고, 온라인이면 다음 방문에 최신 반영
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
