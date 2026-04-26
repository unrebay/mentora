"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import MeLogo from "@/components/MeLogo";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { TourButtonDesktop } from "@/components/TourButton";

function pluralDays(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "дней";
  if (m10 === 1) return "день";
  if (m10 >= 2 && m10 <= 4) return "дня";
  return "дней";
}

function pluralMenty(n: number): string {
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
  logoutAction: () => Promise<void>;
  /** "dark" — forces dark/galaxy styling regardless of user's theme */
  variant?: "default" | "dark";
}

export default function DashboardNav({
  isPro, isUltima, totalXP, currentStreak, bestStreak, logoutAction, variant = "default"
}: DashboardNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dk = variant === "dark";

  function navClass(href: string) {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    if (active) return "text-sm font-semibold transition-colors";
    return dk
      ? "text-sm font-medium text-white/60 hover:text-white/90 transition-colors"
      : "text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors";
  }
  function navStyle(href: string) {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return active ? { color: "#4561E8" } : {};
  }

  return (
    <nav
      className="sticky top-0 z-20 border-b"
      style={{
        background: dk ? "rgba(6,6,15,0.97)" : "var(--bg-nav)",
        borderColor: dk ? "rgba(255,255,255,0.07)" : "var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Top bar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-3">
          {/* Logo: white "M…ntora" + blue italic "e" on dark bg */}
          <Logo size="sm" textColor={dk ? "rgba(255,255,255,0.95)" : undefined} />

          <div className="hidden md:flex items-center gap-5 ml-2">
            <a href="/dashboard/progress" className={navClass("/dashboard/progress")} style={navStyle("/dashboard/progress")}>Прогресс</a>
            <a href="/dashboard/analytics" className={navClass("/dashboard/analytics")} style={navStyle("/dashboard/analytics")}>Аналитика</a>
            <a href="/knowledge" className={navClass("/knowledge")} style={navStyle("/knowledge")}>Галактика знаний</a>
            <a href="/profile" className={navClass("/profile")} style={navStyle("/profile")}>Профиль</a>
            <a href="/about" className={navClass("/about")} style={navStyle("/about")}>О проекте</a>
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-2 md:gap-2">
          {/* Tour help button */}
          <TourButtonDesktop forceDark={dk} />

          {/* Theme toggle — always renders dark-styled on dark pages */}
          <ThemeToggle forceDark={dk} />

          {totalXP > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              {/* XP pill — 3D */}
              <div style={{
                display: "flex", alignItems: "center", gap: 5, height: 30,
                padding: "0 12px", borderRadius: 9999, fontWeight: 700,
                fontSize: "0.875rem", lineHeight: 1,
                background: "linear-gradient(155deg, #4561E8 0%, #2438B0 100%)",
                color: "#fff",
                boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 14px rgba(69,97,232,0.45), 0 2px 5px rgba(0,0,0,0.3)",
                transition: "transform 0.12s ease, box-shadow 0.12s ease",
                cursor: "default",
                userSelect: "none",
              }}>
                <MeLogo
                  height={15}
                  colorM="rgba(255,255,255,0.97)"
                  colorE="rgba(255,255,255,0.7)"
                />
                <span style={{ lineHeight: 1 }}>{totalXP}</span>
              </div>

              {/* Streak pill — 3D */}
              {currentStreak > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, height: 30,
                  padding: "0 12px", borderRadius: 9999, fontWeight: 700,
                  fontSize: "0.875rem", lineHeight: 1,
                  background: "linear-gradient(155deg, #FF6B35 0%, #C62828 100%)",
                  color: "#fff",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 14px rgba(255,80,0,0.45), 0 2px 5px rgba(0,0,0,0.3)",
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                  cursor: "default",
                  userSelect: "none",
                }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 15, height: 15, flexShrink: 0, display: "block" }}>
                    <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="rgba(255,255,255,0.95)"/>
                  </svg>
                  <span style={{ lineHeight: 1 }}>{currentStreak} {pluralDays(currentStreak)}</span>
                </div>
              )}
            </div>
          )}

          {!isPro && (
            <Link href="/pricing" className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
              Тарифы
            </Link>
          )}

          <form action={logoutAction} className="hidden md:block">
            <button
              type="submit"
              className="text-sm transition-colors"
              style={{ color: dk ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}
            >
              Выйти
            </button>
          </form>

          {/* Burger button — mobile only */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ background: open ? (dk ? "rgba(255,255,255,0.08)" : "var(--bg-secondary)") : "transparent" }}
          >
            <div className="relative w-[18px] h-[12px]">
              <span className={`absolute left-0 w-full h-[2px] rounded-full transition-all duration-200 origin-center ${open ? "top-[5px] rotate-45" : "top-0"}`}
                style={{ background: dk ? "rgba(255,255,255,0.85)" : "var(--text)" }} />
              <span className={`absolute left-0 top-[5px] w-full h-[2px] rounded-full transition-all duration-200 ${open ? "opacity-0 scale-x-0" : ""}`}
                style={{ background: dk ? "rgba(255,255,255,0.85)" : "var(--text)" }} />
              <span className={`absolute left-0 w-full h-[2px] rounded-full transition-all duration-200 origin-center ${open ? "bottom-[5px] -rotate-45" : "bottom-0"}`}
                style={{ background: dk ? "rgba(255,255,255,0.85)" : "var(--text)" }} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div
          className="md:hidden border-t"
          style={{
            background: dk ? "rgba(6,6,15,0.97)" : "var(--bg-nav)",
            borderColor: dk ? "rgba(255,255,255,0.07)" : "var(--border)",
          }}
        >
          <div className="max-w-5xl mx-auto px-3 py-2 flex flex-col">
            {[
              { href: "/dashboard", label: "Предметы" },
              { href: "/dashboard/progress", label: "Прогресс" },
              { href: "/dashboard/analytics", label: "Аналитика" },
              { href: "/knowledge", label: "Галактика знаний" },
              { href: "/profile", label: "Профиль" },
              { href: "/about", label: "О проекте" },
              ...(!isPro ? [{ href: "/pricing", label: "Тарифы" }] : []),
            ].map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: dk ? "rgba(255,255,255,0.65)" : "var(--text-secondary)" }}>
                {label}
              </a>
            ))}
            {totalXP > 0 && (
              <div className="flex gap-4 px-3 py-2 text-xs" style={{ color: dk ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>
                <span className="font-semibold flex items-center gap-1">
                  <MeLogo height={15}
                    colorM={dk ? "rgba(255,255,255,0.95)" : undefined}
                    colorE={dk ? "#4561E8" : undefined}
                  />
                  {totalXP} {pluralMenty(totalXP)}
                </span>
                {currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-orange-500 font-medium">
                    <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5"><path d="M7 13C4.79 13 3 11.21 3 9c0-1.63.93-3.33 1.86-4.5.31-.39.93-.16.93.31v.15c0 .47.31.85.78.93.31.08.62-.08.78-.31C7.82 4.73 8.07 4.2 8.07 4.2c.23-.39.78-.31.93.08.31.78.47 1.63.23 2.33.7-.62.78-1.63.78-1.63 0-.47.54-.78.93-.54C11.7 5.12 12.4 6.36 12.4 7.77 12.4 10.55 10.44 13 7 13z"/></svg>
                    {currentStreak} {pluralDays(currentStreak)}
                  </span>
                )}
              </div>
            )}
            <div className="border-t mt-1 pt-1" style={{ borderColor: dk ? "rgba(255,255,255,0.07)" : "var(--border)" }}>
              <form action={logoutAction}>
                <button type="submit"
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ color: dk ? "rgba(255,255,255,0.35)" : "var(--text-muted)" }}>
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
