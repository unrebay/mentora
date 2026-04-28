"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LandingNav() {
  const t = useTranslations("nav");
  const [isDark, setIsDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function update() {
      const subjects = document.getElementById("subjects");
      if (!subjects) { setIsDark(true); return; }
      setIsDark(subjects.getBoundingClientRect().top > 72);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function close() { setMobileOpen(false); }
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [mobileOpen]);

  const linkColor = isDark ? "rgba(255,255,255,0.65)" : "var(--text-secondary)";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "var(--border)";

  return (
    <nav
      className="sticky top-0 z-50 border-b transition-colors duration-300"
      style={{
        background: isDark ? "rgba(4,6,15,0.88)" : "var(--bg-nav)",
        borderColor,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Main row */}
      <div className="max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
        {/* Logo */}
        <Logo size="sm" fontSize="1.44rem" textColor={isDark ? "white" : undefined} />

        {/* Desktop nav links */}
        <div
          className="hidden md:flex items-center justify-center gap-8 text-sm transition-colors duration-300"
          style={{ color: linkColor }}
        >
          <a href="#subjects" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>{t("subjects")}</a>
          <a href="#how" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>{t("how")}</a>
          <Link href="/pricing" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>{t("pricing")}</Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-2">
          <LanguageSwitcher dark={isDark} />
          <ThemeToggle />

          {/* Desktop: Войти */}
          <Link
            href="/auth"
            className="hidden md:inline px-4 py-2 text-sm font-medium transition-colors duration-300"
            style={{ color: linkColor }}
          >
            {t("login")}
          </Link>

          {/* Desktop: CTA */}
          <Link
            href="/auth"
            className="hidden md:inline-flex px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            {t("tryFree")}
          </Link>

          {/* Mobile: CTA (compact) */}
          <Link
            href="/auth"
            className="md:hidden inline-flex px-3 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            {t("tryFreeShort")}
          </Link>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg transition-colors shrink-0"
            style={{ color: isDark ? "rgba(255,255,255,0.8)" : "var(--text)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
          >
            <span
              className="block w-5 h-0.5 bg-current transition-all duration-200 origin-center"
              style={{ transform: mobileOpen ? "rotate(45deg) translate(0, 7px)" : "none" }}
            />
            <span
              className="block w-5 h-0.5 bg-current transition-all duration-200"
              style={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="block w-5 h-0.5 bg-current transition-all duration-200 origin-center"
              style={{ transform: mobileOpen ? "rotate(-45deg) translate(0, -7px)" : "none" }}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-6 py-5 flex flex-col gap-1"
          style={{
            background: isDark ? "rgba(4,6,15,0.97)" : "var(--bg-nav)",
            borderColor,
          }}
        >
          <a
            href="#subjects"
            className="text-sm font-medium py-2.5 border-b transition-opacity"
            style={{ color: linkColor, borderColor }}
            onClick={() => setMobileOpen(false)}
          >
            {t("subjects")}
          </a>
          <a
            href="#how"
            className="text-sm font-medium py-2.5 border-b transition-opacity"
            style={{ color: linkColor, borderColor }}
            onClick={() => setMobileOpen(false)}
          >
            {t("how")}
          </a>
          <Link
            href="/pricing"
            className="text-sm font-medium py-2.5 border-b"
            style={{ color: linkColor, borderColor }}
            onClick={() => setMobileOpen(false)}
          >
            {t("pricing")}
          </Link>
          {/* Language switcher in mobile menu */}
          <div className="pt-3 flex items-center gap-3">
            <LanguageSwitcher dark={isDark} />
          </div>
        </div>
      )}
    </nav>
  );
}
