const CACHE = "vocab-app-v4";
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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // API·사전 호출은 그대로 통과

  const isShell = req.mode === "navigate" || /\.(html|js)$/.test(url.pathname) || url.pathname.endsWith("/");

  if (isShell) {
    // 앱 코드: 네트워크 우선 → 항상 최신. 오프라인이면 캐시.
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // 그 외(아이콘 등): 캐시 우선 + 뒤에서 갱신
  e.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
