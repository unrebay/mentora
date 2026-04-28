"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LandingNav() {
  const t = useTranslations("nav");
  /** true while viewport is over the dark hero section */
  const [isDark, setIsDark] = useState(true);
  /** true once user has scrolled enough to reveal the pill bg */
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function update() {
      const y = window.scrollY;
      setScrolled(y > 40);
      // "subjects" section is the first light-background block
      const subjects = document.getElementById("subjects");
      if (!subjects) { setIsDark(true); return; }
      // Switch to light when that section enters the nav area
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

  // ── Pill visual states (mirrors DashboardNav dk / light) ──────────────────
  // Transparent while at the very top of the dark hero; pills appear on scroll
  const showPill = scrolled || !isDark;

  const navBg = isDark
    ? (showPill ? "rgba(8,8,20,0.65)" : "transparent")
    : "var(--bg-nav)";

  const navBlur = showPill ? "blur(28px) saturate(1.8)" : "none";

  const navBorder = showPill
    ? (isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid var(--border-light)")
    : "1px solid transparent";

  const navShadow = showPill
    ? (isDark
        ? "0 2px 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset"
        : "0 4px 24px rgba(0,0,0,0.09), 0 1px 0 rgba(255,255,255,0.8) inset")
    : "none";

  const linkColor = isDark ? "rgba(255,255,255,0.65)" : "var(--text-secondary)";
  const loginColor = isDark ? "rgba(255,255,255,0.72)" : "var(--text-secondary)";

  // ── Mobile dropdown bg ────────────────────────────────────────────────────
  const mobileBg = isDark ? "rgba(8,8,20,0.97)" : "var(--bg-nav)";
  const mobileBorder = isDark ? "rgba(255,255,255,0.06)" : "var(--border-light)";

  return (
    /* Outer sticky strip — background matches hero so the 10px gap is seamless */
    <nav
      className="sticky top-0 z-50"
      style={{
        padding: "10px 14px",
        // Transparent over dark hero so content bleeds through the gaps;
        // matches page bg when over the light section (same as DashboardNav).
        background: isDark ? "transparent" : "var(--bg)",
        pointerEvents: "none",
      }}
    >
      {/* ── The actual pill ─────────────────────────────────────────────── */}
      <div
        className="max-w-5xl mx-auto transition-all duration-300"
        style={{
          pointerEvents: "all",
          background: navBg,
          backdropFilter: navBlur,
          WebkitBackdropFilter: navBlur,
          borderRadius: 28,
          border: navBorder,
          boxShadow: navShadow,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* thin top shimmer line — only when visible */}
        {showPill && (
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 1,
            background: isDark
              ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)"
              : "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
            pointerEvents: "none",
          }} />
        )}

        {/* Main row */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3">
          {/* Logo */}
          <Logo size="sm" fontSize="1.44rem" textColor={isDark ? "white" : undefined} />

          {/* Desktop nav links */}
          <div
            className="hidden md:flex items-center justify-center gap-8 text-sm transition-colors duration-300"
            style={{ color: linkColor }}
          >
            <a href="#subjects" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>
              {t("subjects")}
            </a>
            <a href="#how" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>
              {t("how")}
            </a>
            <Link href="/pricing" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>
              {t("pricing")}
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center justify-end gap-2">
            <LanguageSwitcher dark={isDark} />
            <ThemeToggle />

            {/* Desktop: Войти — ghost pill */}
            <Link
              href="/auth"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
              style={{ color: loginColor }}
            >
              {t("login")}
            </Link>

            {/* Desktop: CTA pill button */}
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
              className="md:hidden inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #5575FF 0%, #4561E8 100%)",
                boxShadow: "0 2px 10px rgba(69,97,232,0.4)",
              }}
            >
              {t("tryFreeShort")}
            </Link>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5.5px] rounded-full transition-colors shrink-0"
              style={{
                color: isDark ? "rgba(255,255,255,0.8)" : "var(--text)",
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
              }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            >
              <span
                className="block w-4 h-[1.5px] bg-current transition-all duration-200 origin-center"
                style={{ transform: mobileOpen ? "rotate(45deg) translate(0, 7px)" : "none" }}
              />
              <span
                className="block w-4 h-[1.5px] bg-current transition-all duration-200"
                style={{ opacity: mobileOpen ? 0 : 1 }}
              />
              <span
                className="block w-4 h-[1.5px] bg-current transition-all duration-200 origin-center"
                style={{ transform: mobileOpen ? "rotate(-45deg) translate(0, -7px)" : "none" }}
              />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-5 py-4 flex flex-col gap-1"
            style={{ background: mobileBg, borderColor: mobileBorder }}
          >
            <a
              href="#subjects"
              className="text-sm font-medium py-2.5 border-b"
              style={{ color: linkColor, borderColor: mobileBorder }}
              onClick={() => setMobileOpen(false)}
            >
              {t("subjects")}
            </a>
            <a
              href="#how"
              className="text-sm font-medium py-2.5 border-b"
              style={{ color: linkColor, borderColor: mobileBorder }}
              onClick={() => setMobileOpen(false)}
            >
              {t("how")}
            </a>
            <Link
              href="/pricing"
              className="text-sm font-medium py-2.5 border-b"
              style={{ color: linkColor, borderColor: mobileBorder }}
              onClick={() => setMobileOpen(false)}
            >
              {t("pricing")}
            </Link>
            <div className="pt-3 flex items-center gap-3">
              <LanguageSwitcher dark={isDark} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
