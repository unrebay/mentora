"use client";
import LevelAvatar, { unlockedLevel } from "@/components/LevelAvatar";
import UserDropdown from "@/components/UserDropdown";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import MeLogo from "@/components/MeLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { TourButtonDesktop } from "@/components/TourButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTheme } from "@/components/ThemeProvider";

function getDaysLabel(n: number, locale: string): string {
  if (locale === "en") return n === 1 ? "day" : "days";
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "дней";
  if (m10 === 1) return "день";
  if (m10 >= 2 && m10 <= 4) return "дня";
  return "дней";
}

function getMentyLabel(n: number, locale: string): string {
  if (locale === "en") return "XP";
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "мент";
  if (m10 === 1) return "мента";
  if (m10 >= 2 && m10 <= 4) return "менты";
  return "мент";
}

interface DashboardNavProps {
  isPro: boolean;
  isUltima: boolean;
  totalXP: number;
  currentStreak: number;
  bestStreak: number;
  selectedAvatarLevel?: number | null;
  serialId?: number | null;
  displayName?: string | null;
  email?: string | null;
  initialRank?: number | null;
  initialTotal?: number | null;
  logoutAction: () => Promise<void>;
  /** "dark" — forces dark/galaxy styling regardless of user's theme */
  variant?: "default" | "dark";
}

export default function DashboardNav({
  isPro, isUltima, totalXP, currentStreak, bestStreak, selectedAvatarLevel, serialId, displayName, email, initialRank, initialTotal, logoutAction, variant = "default"
}: DashboardNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const { theme } = useTheme();
  // dk: forced dark (e.g. galaxy page) OR user's dark theme
  const dk = variant === "dark" || theme === "dark";

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  /* ── glass pill for active nav link ── */
  function navLinkStyle(href: string): React.CSSProperties {
    const active = isActive(href);
    if (active) {
      return {
        color: dk ? "#fff" : "#4561E8",
        background: dk
          ? "rgba(255,255,255,0.11)"
          : "rgba(69,97,232,0.1)",
        borderRadius: 9999,
        padding: "5px 13px",
        fontWeight: 700,
        fontSize: "0.8125rem",
        border: dk
          ? "1px solid rgba(255,255,255,0.14)"
          : "1px solid rgba(69,97,232,0.2)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        lineHeight: 1,
        transition: "all 0.18s ease",
      };
    }
    return {
      color: dk ? "rgba(255,255,255,0.55)" : "var(--text-secondary)",
      borderRadius: 9999,
      padding: "5px 13px",
      fontWeight: 500,
      fontSize: "0.8125rem",
      border: "1px solid transparent",
      lineHeight: 1,
      transition: "all 0.18s ease",
    };
  }

  /* ── glass pill hover class ── */
  const navLinkClass = (href: string) =>
    isActive(href)
      ? ""
      : dk
        ? "hover:text-white/90 hover:bg-white/[0.06]"
        : "hover:text-[var(--text)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]";

  /* ── iOS 26 Liquid Glass pill ── */
  const navBg = dk ? "rgba(6,6,18,0.38)" : "rgba(255,255,255,0.50)";
  const navBlur = "blur(16px) saturate(1.6) brightness(1.02)";
  // No visible border — white border on light is invisible, subtle glow on dark
  const navBorder = dk
    ? "1px solid rgba(255,255,255,0.09)"
    : "1px solid rgba(255,255,255,0.70)";
  const navShadow = dk
    ? "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08) inset"
    : "0 0 0 1px rgba(255,255,255,0.95) inset, 0 8px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)";

  const navLinks = [
    { href: "/dashboard",           label: t("dashboard.nav.subjects") },
    { href: "/dashboard/analytics", label: t("dashboard.nav.analytics") },
    { href: "/knowledge",           label: t("dashboard.nav.galaxy") },
    { href: "/dashboard/about",     label: t("dashboard.nav.about") },
  ];

  const mobileLinks = [
    ...navLinks.slice(0, 3),
    { href: "/knowledge", label: t("dashboard.nav.galaxyFull") },
    ...navLinks.slice(4),
    ...(!isPro ? [{ href: "/pricing", label: t("nav.pricing") }] : []),
  ];

  return (
    /* Outer sticky strip — transparent, just provides the floating gap */
    <nav
      className="sticky top-0 z-20"
      style={{
        padding: "10px 14px",
        background: "transparent",  // always transparent — pill handles its own bg
        pointerEvents: "none",
      }}
    >
      {/* ── The actual glass pill ── */}
      <div
        data-tour="nav-pill"
        className="max-w-6xl mx-auto"
        style={{
          pointerEvents: "all",
          background: navBg,
          backdropFilter: navBlur,
          WebkitBackdropFilter: navBlur,
          borderRadius: 28,
          border: navBorder,
          boxShadow: navShadow,
          overflow: "visible", // visible so UserDropdown can extend beyond pill
          position: "relative",
        }}
      >
        {/* thin top shimmer line */}
        <div style={{
          height: 1,
          background: dk
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.90), transparent)",
          position: "absolute", top: 0, left: 0, right: 0,
        }} />

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4" style={{ height: 52 }}>

        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-1">
          <Logo size="sm" href="" textColor={dk ? "rgba(255,255,255,0.95)" : undefined} />

          <div className="hidden md:flex items-center gap-1 ml-7">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={navLinkClass(href)}
                style={navLinkStyle(href)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-2">
          <TourButtonDesktop forceDark={dk} />
          <ThemeToggle forceDark={dk} />
          <LanguageSwitcher dark={dk} />

          {/* Avatar dropdown — replaces direct profile link */}
          <div className="hidden md:flex items-center" style={{ marginRight: 6 }}>
            <UserDropdown
              totalXP={totalXP}
              currentStreak={currentStreak}
              isPro={isPro}
              isUltima={isUltima}
              selectedAvatarLevel={selectedAvatarLevel}
              serialId={serialId}
              displayName={displayName}
              email={email}
              initialRank={initialRank}
              initialTotal={initialTotal}
            />
          </div>
          {totalXP > 0 && (
            <div className="hidden sm:flex items-center gap-1.5" data-tour="nav-stats">
              {/* XP pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 5, height: 30,
                padding: "0 11px", borderRadius: 9999, fontWeight: 700,
                fontSize: "0.8125rem", lineHeight: 1,
                background: dk
                  ? "linear-gradient(155deg, rgba(69,97,232,0.85) 0%, rgba(36,56,176,0.85) 100%)"
                  : "linear-gradient(155deg, #4561E8 0%, #2438B0 100%)",
                color: "#fff",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 14px rgba(69,97,232,0.4)",
                cursor: "default",
                userSelect: "none",
                flexShrink: 0,
              }}>
                <MeLogo
                  height={14}
                  colorM="rgba(255,255,255,0.97)"
                  colorE="rgba(255,255,255,0.7)"
                />
                <span style={{ lineHeight: 1 }}>{totalXP}</span>
              </div>

              {/* Streak pill */}
              {currentStreak > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, height: 30,
                  padding: "0 11px", borderRadius: 9999, fontWeight: 700,
                  fontSize: "0.8125rem", lineHeight: 1,
                  background: "linear-gradient(155deg, rgba(255,107,53,0.9) 0%, rgba(198,40,40,0.9) 100%)",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 14px rgba(255,80,0,0.4)",
                  cursor: "default",
                  userSelect: "none",
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14, flexShrink: 0 }}>
                    <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="rgba(255,255,255,0.95)"/>
                  </svg>
                  <span style={{ lineHeight: 1 }}>{currentStreak} {getDaysLabel(currentStreak, locale)}</span>
                </div>
              )}
            </div>
          )}

          {!isPro && (
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: dk
                  ? "rgba(69,97,232,0.25)"
                  : "rgba(69,97,232,0.1)",
                color: dk ? "rgba(255,255,255,0.9)" : "#4561E8",
                border: dk
                  ? "1px solid rgba(69,97,232,0.35)"
                  : "1px solid rgba(69,97,232,0.25)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                height: 30,
                lineHeight: 1,
              }}
            >
              {t("nav.pricing")}
            </Link>
          )}

          <form action={logoutAction} className="hidden md:block">
            <button
              type="submit"
              className="text-xs transition-colors px-2 py-1.5"
              style={{ color: dk ? "rgba(255,255,255,0.35)" : "var(--text-muted)" }}
            >
              {t("dashboard.logout")}
            </button>
          </form>

          {/* Burger — mobile */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full transition-all"
            style={{
              background: open
                ? (dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)")
                : "transparent",
              border: open
                ? (dk ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)")
                : "1px solid transparent",
            }}
          >
            <div className="relative w-[16px] h-[11px]">
              <span className={`absolute left-0 w-full h-[1.5px] rounded-full transition-all duration-200 origin-center ${open ? "top-[4.75px] rotate-45" : "top-0"}`}
                style={{ background: dk ? "rgba(255,255,255,0.85)" : "var(--text)" }} />
              <span className={`absolute left-0 top-[4.75px] w-full h-[1.5px] rounded-full transition-all duration-200 ${open ? "opacity-0 scale-x-0" : ""}`}
                style={{ background: dk ? "rgba(255,255,255,0.85)" : "var(--text)" }} />
              <span className={`absolute left-0 w-full h-[1.5px] rounded-full transition-all duration-200 origin-center ${open ? "bottom-[4.75px] -rotate-45" : "bottom-0"}`}
                style={{ background: dk ? "rgba(255,255,255,0.85)" : "var(--text)" }} />
            </div>
          </button>
        </div>
      </div>{/* end top bar */}
      </div>{/* end pill */}

      {/* ── Mobile dropdown (pill below) ── */}
      {open && (
        <div
          className="md:hidden max-w-5xl mx-auto mt-2"
          style={{
            pointerEvents: "all",
            background: dk ? "rgba(6,6,18,0.96)" : "rgba(255,255,255,0.82)",
            backdropFilter: "blur(40px) saturate(2.2)",
            WebkitBackdropFilter: "blur(40px) saturate(2.2)",
            borderRadius: 28,
            border: navBorder,
            boxShadow: navShadow,
          }}
        >
          <div className="px-3 py-2 flex flex-col gap-0.5">
            {mobileLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={isActive(href) ? {
                  color: dk ? "#fff" : "#4561E8",
                  background: dk ? "rgba(255,255,255,0.1)" : "rgba(69,97,232,0.08)",
                  fontWeight: 700,
                } : {
                  color: dk ? "rgba(255,255,255,0.6)" : "var(--text-secondary)",
                }}
              >
                {label}
              </Link>
            ))}

            {totalXP > 0 && (
              <div
                className="flex gap-3 px-3 py-2.5 rounded-xl"
                style={{ color: dk ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}
              >
                <span className="font-semibold flex items-center gap-1 text-xs">
                  <MeLogo height={14}
                    colorM={dk ? "rgba(255,255,255,0.95)" : undefined}
                    colorE={dk ? "#6b87ff" : undefined}
                  />
                  {totalXP} {getMentyLabel(totalXP, locale)}
                </span>
                {currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-orange-500 font-medium text-xs">
                    <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M7 13C4.79 13 3 11.21 3 9c0-1.63.93-3.33 1.86-4.5.31-.39.93-.16.93.31v.15c0 .47.31.85.78.93.31.08.62-.08.78-.31C7.82 4.73 8.07 4.2 8.07 4.2c.23-.39.78-.31.93.08.31.78.47 1.63.23 2.33.7-.62.78-1.63.78-1.63 0-.47.54-.78.93-.54C11.7 5.12 12.4 6.36 12.4 7.77 12.4 10.55 10.44 13 7 13z"/>
                    </svg>
                    {currentStreak} {getDaysLabel(currentStreak, locale)}
                  </span>
                )}
              </div>
            )}

            <div
              className="border-t mt-1 pt-1"
              style={{ borderColor: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
            >
              {/* Language switcher in mobile */}
              <div className="px-3 py-2">
                <LanguageSwitcher dark={dk} />
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full text-left flex items-center px-3 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ color: dk ? "rgba(255,255,255,0.3)" : "var(--text-muted)" }}
                >
                  {t("dashboard.logout")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
