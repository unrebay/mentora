"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

function MentoraE() {
  return (
    <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#4561E8", fontStyle: "italic", fontWeight: 700, fontSize: "1.2em", lineHeight: 1, marginRight: "0.1em" }}>е</span>
  );
}

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
  maxStreak: number;
  logoutAction: () => Promise<void>;
}

export default function DashboardNav({ isPro, isUltima, totalXP, maxStreak, logoutAction }: DashboardNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--border)]" style={{ background: "var(--bg-nav)", backdropFilter: "blur(12px)" }}>
      {/* Top bar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="hidden md:flex items-center gap-5 ml-2">
            <a href="/dashboard/progress" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Прогресс</a>
            <a href="/dashboard/analytics" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Аналитика</a>
            <a href="/knowledge" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Галактика знаний</a>
            <a href="/profile" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Профиль</a>
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          {totalXP > 0 && (
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="font-semibold text-[var(--text)]"><MentoraE />{totalXP} {pluralMenty(totalXP)}</span>
              {maxStreak > 0 && <span className="text-orange-500 font-semibold">🔥 {maxStreak} {pluralDays(maxStreak)}</span>}
            </div>
          )}
          {!isPro && (
            <Link href="/pricing" className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
              Тарифы
            </Link>
          )}
          <form action={logoutAction} className="hidden md:block">
            <button type="submit" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">Выйти</button>
          </form>

          {/* Burger button — mobile only */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <div className="relative w-[18px] h-[12px]">
              <span className={`absolute left-0 w-full h-[2px] rounded-full bg-[var(--text)] transition-all duration-200 origin-center ${open ? "top-[5px] rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-[5px] w-full h-[2px] rounded-full bg-[var(--text)] transition-all duration-200 ${open ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`absolute left-0 w-full h-[2px] rounded-full bg-[var(--text)] transition-all duration-200 origin-center ${open ? "bottom-[5px] -rotate-45" : "bottom-0"}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)]" style={{ background: "var(--bg-nav)" }}>
          <div className="max-w-5xl mx-auto px-3 py-2 flex flex-col">
            {[
              { href: "/dashboard", label: "📚 Предметы" },
              { href: "/dashboard/progress", label: "Прогресс" },
              { href: "/dashboard/analytics", label: "Аналитика" },
              { href: "/knowledge", label: "🌌 Галактика знаний" },
              { href: "/profile", label: "Профиль" },
              ...(!isPro ? [{ href: "/pricing", label: "✨ Тарифы" }] : []),
            ].map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors">
                {label}
              </a>
            ))}
            {totalXP > 0 && (
              <div className="flex gap-4 px-3 py-2 text-xs text-[var(--text-muted)]">
                <span className="font-semibold"><MentoraE />{totalXP} {pluralMenty(totalXP)}</span>
                {maxStreak > 0 && <span className="text-orange-500 font-medium">🔥 {maxStreak} {pluralDays(maxStreak)}</span>}
              </div>
            )}
            <div className="border-t border-[var(--border)] mt-1 pt-1">
              <form action={logoutAction}>
                <button type="submit" className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
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
