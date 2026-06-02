"use client";
import { useEffect } from "react";

/**
 * Регистрируем /sw.js один раз на app mount. PWA install flow и offline-кеш
 * заводятся только через регистрацию SW (см. public/sw.js).
 *
 * Лежит как client component, чтобы не нужно было прокидывать nonce под Nonce-CSP
 * — useEffect выполняется в браузере, не блокируется CSP script-src.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Регистрируем после window load — не мешаем first paint.
    const onReady = () => {
      navigator.serviceWorker
        // updateViaCache:"none" → the browser always fetches sw.js from network
        // (not HTTP cache), so a new deploy's SW (new CACHE_VERSION) is detected
        // immediately and old caches get purged on activate.
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => { reg.update().catch(() => {}); })
        .catch((e) => console.warn("[sw] register failed:", e));
    };
    if (document.readyState === "complete") onReady();
    else window.addEventListener("load", onReady, { once: true });
    return () => window.removeEventListener("load", onReady);
  }, []);
  return null;
}
