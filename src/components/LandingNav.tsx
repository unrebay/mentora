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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function update() {
      const subjects = document.getElementById("subjects");
      setScrolled(window.scrollY > 20);
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

  const linkColor = isDark ? "rgba(255,255,255,0.72)" : "var(--text-secondary)";

  // Glass container style — more opaque/solid when scrolled
  const glassStyle: React.CSSProperties = isDark
    ? {
        background: scrolled
          ? "rgba(4,6,15,0.82)"
          : "rgba(4,6,15,0.55)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: scrolled
          ? "0 8px 32px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.05) inset"
          : "0 4px 20px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.04) inset",
      }
    : {
        background: scrolled
          ? "rgba(255,255,255,0.88)"
          : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: scrolled
          ? "0 8px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.9) inset"
          : "0 4px 20px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.8) inset",
      };

  return (
    <div className="sticky top-0 z-50 px-3 pt-3 pb-0">
      {/* Floating glass pill container */}
      <nav
        className="max-w-5xl mx-auto rounded-2xl transition-all duration-300"
        style={glassStyle}
      >
        {/* Main row */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3">
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

            {/* Desktop: Войти — pill button */}
            <Link
              href="/auth"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
              style={{
                color: linkColor,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              }}
            >
              {t("login")}
            </Link>

            {/* Desktop: CTA pill */}
            <Link
              href="/auth"
              className="hidden md:inline-flex items-center px-5 py-2 text-sm font-semibold rounded-full text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
              style={{
                background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
                boxShadow: "0 2px 12px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
            >
              {t("tryFree")}
            </Link>

            {/* Mobile: CTA pill (compact) */}
            <Link
              href="/auth"
              className="md:hidden inline-flex items-center px-3.5 py-2 text-sm font-semibold rounded-full text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #5575FF 0%, #4561E8 100%)",
                boxShadow: "0 2px 10px rgba(69,97,232,0.4)",
              }}
            >
              {t("tryFreeShort")}
            </Link>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-full transition-colors shrink-0"
              style={{
                color: isDark ? "rgba(255,255,255,0.8)" : "var(--text)",
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            >
              <span
                className="block w-4 h-0.5 bg-current transition-all duration-200 origin-center"
                style={{ transform: mobileOpen ? "rotate(45deg) translate(0, 6px)" : "none" }}
              />
              <span
                className="block w-4 h-0.5 bg-current transition-all duration-200"
                style={{ opacity: mobileOpen ? 0 : 1 }}
              />
              <span
                className="block w-4 h-0.5 bg-current transition-all duration-200 origin-center"
                style={{ transform: mobileOpen ? "rotate(-45deg) translate(0, -6px)" : "none" }}
              />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-5 py-4 flex flex-col gap-1 rounded-b-2xl"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            }}
          >
            <a
              href="#subjects"
              className="text-sm font-medium py-2.5 border-b transition-opacity"
              style={{ color: linkColor, borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
              onClick={() => setMobileOpen(false)}
            >
              {t("subjects")}
            </a>
            <a
              href="#how"
              className="text-sm font-medium py-2.5 border-b transition-opacity"
              style={{ color: linkColor, borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
              onClick={() => setMobileOpen(false)}
            >
              {t("how")}
            </a>
            <Link
              href="/pricing"
              className="text-sm font-medium py-2.5 border-b"
              style={{ color: linkColor, borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
              onClick={() => setMobileOpen(false)}
            >
              {t("pricing")}
            </Link>
            <div className="pt-3 flex items-center gap-3">
              <LanguageSwitcher dark={isDark} />
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
