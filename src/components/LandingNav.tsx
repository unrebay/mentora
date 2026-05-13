"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface LandingNavProps {
  /** Lock to light mode (e.g. on pages with no dark hero section) */
  alwaysLight?: boolean;
  /** Show "Dashboard" CTA instead of "Try for free" */
  isLoggedIn?: boolean;
  /** Which nav link to highlight as active */
  activePage?: "pricing";
}

export default function LandingNav({ alwaysLight, isLoggedIn, activePage }: LandingNavProps = {}) {
  const t = useTranslations("nav");
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  /** true while viewport is over the dark hero section (or whole page in dark theme) */
  const [isDark, setIsDark] = useState(alwaysLight ? false : true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (alwaysLight) { setIsDark(false); return; }
    // In dark theme the page background is dark from top to bottom — keep nav in
    // its dark/galaxy styling at all scroll positions.
    if (isDarkTheme) { setIsDark(true); return; }
    function update() {
      const subjects = document.getElementById("subjects");
      if (!subjects) { setIsDark(true); return; }
      setIsDark(subjects.getBoundingClientRect().top > 72);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [alwaysLight, isDarkTheme]);

  useEffect(() => {
    if (!mobileOpen) return;
    function close() { setMobileOpen(false); }
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [mobileOpen]);

  // ── Glass pill styles (same as DashboardNav) ─────────────────────────────
  const linkColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(30,30,50,0.78)";
  const loginColor = isDark ? "rgba(255,255,255,0.90)" : "rgba(30,30,50,0.85)";
  // Apple Liquid Glass: very transparent + strong blur + subtle borders
  const navBg = isDark ? "rgba(18,20,38,0.32)" : "rgba(255,255,255,0.32)";
  const navBlur = "blur(28px) saturate(1.8) brightness(1.04)";
  const navBorder = isDark
    ? "1px solid rgba(255,255,255,0.10)"
    : "1px solid rgba(255,255,255,0.45)";
  const navShadow = isDark
    ? "0 0 0 1px rgba(255,255,255,0.05) inset, 0 12px 40px rgba(0,0,0,0.30), 0 1px 0 rgba(255,255,255,0.10) inset"
    : "0 0 0 1px rgba(255,255,255,0.65) inset, 0 12px 32px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.03)";

  // ── Mobile dropdown bg ────────────────────────────────────────────────────
  const mobileBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";

  return (
    /* Outer sticky strip — always transparent so glass pill shows hero behind it */
    <nav
      className="sticky top-0 z-50"
      style={{
        padding: "10px clamp(8px, 2vw, 14px)",
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      {/* ── Nav content ─────────────────────────────────────────────── */}
      <div
        className="max-w-5xl mx-auto"
        style={{ pointerEvents: "all", position: "relative" }}
      >
        {/* ── Glass pill ─────────────────────────────────────────────── */}
        <div
          style={{
            background: navBg,
            backdropFilter: navBlur,
            WebkitBackdropFilter: navBlur,
            // When mobile menu is open, use a softer radius so the dropdown sits naturally below.
            borderRadius: mobileOpen ? 24 : 9999,
            border: navBorder,
            boxShadow: navShadow,
            overflow: "hidden",
            position: "relative",
            transition: "background 0.3s, box-shadow 0.3s, border-radius 0.2s",
          }}
        >
          {/* Thin top shimmer */}
          <div style={{
            height: 1,
            background: isDark
              ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
              : "linear-gradient(90deg, transparent, rgba(255,255,255,0.90), transparent)",
            position: "absolute", top: 0, left: 0, right: 0,
          }} />

        {/* Main row */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 pl-5 pr-6 py-3">
          {/* Logo */}
          <Logo size="sm" textColor={isDark ? "rgba(255,255,255,0.95)" : undefined} />

          {/* Desktop nav links */}
          <div
            className="hidden md:flex items-center justify-center gap-8 text-sm transition-colors duration-300"
            style={{ color: linkColor }}
          >
            <Link href="/#subjects" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>
              {t("subjects")}
            </Link>
            <Link href="/#how" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.9 }}>
              {t("how")}
            </Link>
            <Link
              href="/#pricing"
              className="hover:opacity-100 transition-opacity"
              style={{ opacity: 0.9, fontWeight: activePage === "pricing" ? 600 : undefined, color: activePage === "pricing" ? (isDark ? "white" : "var(--text)") : undefined }}
            >
              {t("pricing")}
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center justify-end gap-2">
            <LanguageSwitcher dark={isDark} />
            <ThemeToggle />

            {/* Desktop: Войти — ghost (only when not logged in) */}
            {!isLoggedIn && (
              <Link
                href="/auth"
                className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
                style={{ color: loginColor }}
              >
                {t("login")}
              </Link>
            )}

            {/* Desktop: CTA pill */}
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth"}
              className="hidden md:inline-flex items-center px-5 py-2 text-sm font-semibold rounded-full text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
              style={{
                background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
                boxShadow: "0 2px 12px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
            >
              {isLoggedIn ? <span className="inline-flex items-center gap-1.5">{t("dashboard")}<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span> : t("tryFree")}
            </Link>

            {/* Mobile: CTA pill (compact) */}
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth"}
              className="md:hidden inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #5575FF 0%, #4561E8 100%)",
                boxShadow: "0 2px 10px rgba(69,97,232,0.4)",
              }}
            >
              {isLoggedIn ? <span className="inline-flex items-center gap-1.5">{t("dashboard")}<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span> : t("tryFreeShort")}
            </Link>

            {/* Mobile: hamburger / close icon — SVG crossfade for clean X without transform clipping */}
            <button
              className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-full transition-colors shrink-0"
              style={{
                color: isDark ? "rgba(255,255,255,0.85)" : "var(--text)",
                background: "transparent",
              }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={mobileOpen}
            >
              {/* Burger (3 lines) */}
              <svg
                viewBox="0 0 24 24"
                width="20" height="20"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                style={{
                  position: "absolute",
                  opacity: mobileOpen ? 0 : 1,
                  transform: mobileOpen ? "rotate(-90deg) scale(0.85)" : "rotate(0deg) scale(1)",
                  transition: "opacity 180ms ease, transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
              {/* X (close) */}
              <svg
                viewBox="0 0 24 24"
                width="20" height="20"
                fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
                style={{
                  position: "absolute",
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.85)",
                  transition: "opacity 180ms ease, transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        </div>{/* end glass pill */}

        {/* Mobile dropdown — absolute overlay (doesn't push content). Animated via max-height + opacity. */}
        <div
          className="md:hidden absolute left-0 right-0 overflow-hidden"
          style={{
            top: "calc(100% + 8px)",
            maxHeight: mobileOpen ? 360 : 0,
            opacity: mobileOpen ? 1 : 0,
            pointerEvents: mobileOpen ? "all" : "none",
            // Dropdown is more matte than the nav pill itself (which stays transparent).
            background: isDark ? "rgba(18,20,38,0.66)" : "rgba(255,255,255,0.66)",
            backdropFilter: navBlur,
            WebkitBackdropFilter: navBlur,
            borderRadius: 24,
            border: mobileOpen ? navBorder : "1px solid transparent",
            boxShadow: mobileOpen ? navShadow : "none",
            transition: "max-height 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
            zIndex: 60,
          }}
          aria-hidden={!mobileOpen}
        >
          <div
            className="px-3 pt-3 pb-3 flex flex-col gap-0.5"
            style={{
              transform: mobileOpen ? "translateY(0)" : "translateY(-8px)",
              transition: "transform 260ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Link href="/#subjects"
              className="text-sm font-medium px-3 py-3 rounded-xl transition-all"
              style={{ color: linkColor, background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              onClick={() => setMobileOpen(false)}>{t("subjects")}</Link>
            <Link href="/#how"
              className="text-sm font-medium px-3 py-3 rounded-xl transition-all"
              style={{ color: linkColor, background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              onClick={() => setMobileOpen(false)}>{t("how")}</Link>
            <Link href="/#pricing"
              className="text-sm font-medium px-3 py-3 rounded-xl transition-all"
              style={{
                color: activePage === "pricing" ? (isDark ? "white" : "var(--text)") : linkColor,
                fontWeight: activePage === "pricing" ? 700 : 500,
                background: activePage === "pricing" ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(69,97,232,0.06)") : "transparent",
              }}
              onClick={() => setMobileOpen(false)}>{t("pricing")}</Link>
            <div className="mt-2 pt-3 flex items-center justify-between gap-3 px-3" style={{ borderTop: `1px solid ${mobileBorder}` }}>
              <LanguageSwitcher dark={isDark} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
