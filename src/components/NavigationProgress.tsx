"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top progress bar shown during route transitions.
 *
 * Without this, Next.js App Router navigations feel unresponsive on slower
 * networks — the click does nothing visible until the new page is ready, so
 * users tap multiple times. We intercept anchor/Link clicks, light up a 2px
 * gradient bar, and dismiss it once the pathname (or query) changes.
 *
 * The bar:
 *  - sits at the very top, z-index above nav
 *  - animates indeterminately (no real progress — we never know real % from
 *    the browser side, so a moving accent reads as "loading" without lying)
 *  - auto-dismisses on pathname change OR after a hard 8s safety timeout
 *    (in case the click was intercepted by something else like an external
 *    redirect — we don't want the bar stuck forever).
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dismiss on URL change (pathname OR query string)
  useEffect(() => {
    setActive(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname]);

  // Intercept clicks bubbling up to <body>
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Ignore non-primary clicks, modifier-clicks (open in new tab etc.)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      // Skip hash links, mailto/tel/javascript, downloads, external targets
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        anchor.hasAttribute("download") ||
        anchor.target === "_blank"
      ) return;

      // External URL? Skip — browser handles native page load + chrome shows its own progress.
      if (href.startsWith("http")) {
        try {
          const url = new URL(href, window.location.href);
          if (url.host !== window.location.host) return;
        } catch { return; }
      }

      // Same-page anchor (just changing hash) — skip
      try {
        const url = new URL(href, window.location.href);
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      } catch { /* relative href that fails URL parse — proceed anyway */ }

      setActive(true);

      // Safety timer — if URL change event never fires (e.g. user navigated to
      // the same path), kill the bar after 8s.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setActive(false), 8000);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Also dismiss on user-initiated back/forward (browser fires popstate before
  // App Router commits) — usePathname effect catches the commit, but popstate
  // gives us a faster dismiss for the rare cases where pathname stays the same.
  useEffect(() => {
    const onPop = () => setActive(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
        background: "rgba(69,97,232,0.08)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "40%",
          background: "linear-gradient(90deg, transparent, #4561E8 30%, #7C3AED 70%, transparent)",
          boxShadow: "0 0 10px rgba(124,58,237,0.6)",
          animation: "mentoraNavProgress 1.1s cubic-bezier(0.4,0,0.2,1) infinite",
        }}
      />
    </div>
  );
}
