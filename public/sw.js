/**
 * Mentora Service Worker.
 *
 * Goals:
 *   1. Offline fallback for navigations (subway / weak LTE / airplane).
 *   2. Cache-first для static assets (logo, fonts, icons, JS chunks) — мгновенный
 *      повторный запуск установленного PWA.
 *   3. Network-first для всего остального — мы не хотим кешировать API/auth/chat
 *      (живые данные), но хотим работать без сети если уже кешировано.
 *   4. Чистая очистка старых кешей при bump CACHE_VERSION.
 *
 * Update strategy: bump CACHE_VERSION → старый кеш удалён в `activate`. Юзер
 * получит свежий код на следующем визите без ручного очищения cache.
 */

// CACHE_VERSION is stamped at deploy time: deploy-russia.yml replaces __BUILD_ID__
// with the git SHA, so EVERY deploy gets a fresh cache namespace and the `activate`
// handler purges all stale assets. Without this, returning users keep serving
// cache-first _next/static chunks from an old build → ChunkLoadError / blank page.
// (If the placeholder isn't replaced — local dev/build-check — it's just a constant.)
const CACHE_VERSION = "mentora-__BUILD_ID__";
const OFFLINE_URL = "/offline.html";

// Базовый набор, который дёргаем при install — чтобы offline работал сразу.
const CORE_ASSETS = [
  "/offline.html",
  "/logo.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll fails atomically if any single resource 404s — wrap each so
      // одна missing icon не сломает install.
      Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((e) => console.warn("[sw] cache add failed:", url, e))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => {
            console.log("[sw] drop stale cache:", k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Cross-origin (Resend image hosting, Supabase, ЮKassa redirects, Spline, etc.) —
  // не трогаем: пусть браузер сам разбирается с CORS и кешами.
  if (url.origin !== self.location.origin) return;

  // API/auth routes: network only, без кеша. Если упало — отдаём 503 + offline.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/callback")) {
    return;
  }

  // HTML navigations: network-first, fallback на offline.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Кешируем последний успешный HTML — для повторного визита оффлайн
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Static assets (images, fonts, CSS, JS chunks): cache-first
  if (
    req.destination === "image" ||
    req.destination === "font" ||
    req.destination === "style" ||
    req.destination === "script" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone)).catch(() => {});
            }
            return res;
          })
      )
    );
    return;
  }

  // Всё остальное — network с graceful fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL)))
  );
});
