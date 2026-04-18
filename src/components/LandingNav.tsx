"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Scroll-aware landing page nav.
 * Dark styling while over the dark hero/features section,
 * switches to light theme styling once the #subjects section scrolls into view.
 */
export default function LandingNav() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    function update() {
      const subjects = document.getElementById("subjects");
      if (!subjects) { setIsDark(true); return; }
      // Switch to light when the subjects section top is at or above the nav (~72px)
      setIsDark(subjects.getBoundingClientRect().top > 72);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 border-b transition-colors duration-300"
      style={{
        background: isDark ? "rgba(4,6,15,0.88)" : "var(--bg-nav)",
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
        {/* Logo — white when over dark section */}
        <Logo size="sm" fontSize="1.44rem" textColor={isDark ? "white" : undefined} />

        {/* Desktop nav links */}
        <div
          className="hidden md:flex items-center justify-center gap-8 text-sm transition-colors duration-300"
          style={{ color: isDark ? "rgba(255,255,255,0.55)" : "var(--text-secondary)" }}
        >
          <a href="#subjects" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>Предметы</a>
          <a href="#how" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>Как работает</a>
          <Link href="/pricing" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>Тарифы</Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-3">
          <ThemeToggle />
          <Link
            href="/auth"
            className="hidden sm:inline px-4 py-2 text-sm font-medium transition-colors duration-300"
            style={{ color: isDark ? "rgba(255,255,255,0.55)" : "var(--text-secondary)" }}
          >
            Войти
          </Link>
          <Link
            href="/auth"
            className="inline-flex px-3 py-2 sm:px-5 sm:py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            <span className="hidden sm:inline">Попробовать бесплатно</span>
            <span className="sm:hidden">Войти</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
