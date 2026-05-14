"use client";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/**
 * Sticky bottom CTA — mobile only. Appears after the user has scrolled past
 * the hero (>500px) and dismisses on scroll-up to the very top. Provides a
 * persistent path to /auth without forcing the user back to the hero buttons.
 *
 * Hidden on auth-walled or product pages — render only from public marketing
 * surfaces (landing).
 */
export default function StickyMobileCTA() {
  const t = useTranslations("nav");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const viewportH = window.innerHeight;
      // Show after the hero is fully off-screen (y > 1 hero-height).
      // Hide near the very bottom of the page so the footer CTA isn't doubled.
      const docH = document.documentElement.scrollHeight;
      const nearBottom = y + viewportH > docH - 200;
      setVisible(y > viewportH * 0.9 && !nearBottom);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="md:hidden fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        transform: visible ? "translateY(0)" : "translateY(140%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease",
      }}
      aria-hidden={!visible}
    >
      <Link
        href="/auth"
        className="block text-center font-semibold text-sm rounded-full text-white py-3 px-5 mx-auto max-w-xs"
        style={{
          pointerEvents: visible ? "auto" : "none",
          background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
          boxShadow: "0 6px 24px rgba(69,97,232,0.55), 0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(255,255,255,0.08) inset",
        }}
      >
        {t("tryFree")} →
      </Link>
    </div>
  );
}
