import React from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileNameEditor } from "@/components/ProfileNameEditor";
import ReferralWidget from "@/components/ReferralWidget";
import GiftProBanner from "@/components/GiftProBanner";
import MeLogo from "@/components/MeLogo";
import DashboardNav from "@/components/DashboardNav";
import StatCard, { MentIcon, FlameIcon, MessageIcon, StarIcon } from "@/components/StatCard";
import SupportCodeCopy from "@/components/SupportCodeCopy";
import TelegramSupportButton from "@/components/TelegramSupportButton";
import InstagramButton from "@/components/InstagramButton";

/** Deterministic 10-char support code derived from UUID — no DB needed */
function makeSupportCode(userId: string): string {
  const hex = userId.replace(/-/g, "").toUpperCase();
  return hex.slice(0, 5) + "-" + hex.slice(5, 10);
}

export const metadata = { title: "Профиль — Mentora" };

const XP_LEVELS = [
  { name: "Новичок",        minXP: 0,    maxXP: 100,      color: "#9ca3af", grad: ["#9ca3af", "#6b7280"] },
  { name: "Исследователь",  minXP: 100,  maxXP: 300,      color: "#3b82f6", grad: ["#60a5fa", "#3b82f6"] },
  { name: "Знаток",         minXP: 300,  maxXP: 600,      color: "#6366f1", grad: ["#818cf8", "#6366f1"] },
  { name: "Историк",        minXP: 600,  maxXP: 1000,     color: "#8b5cf6", grad: ["#a78bfa", "#8b5cf6"] },
  { name: "Эксперт",        minXP: 1000, maxXP: 99999,    color: "#f59e0b", grad: ["#fcd34d", "#f59e0b"] },
];

function getLevel(xp: number) {
  const lvl = XP_LEVELS.slice().reverse().find(l => xp >= l.minXP) ?? XP_LEVELS[0];
  const idx = XP_LEVELS.indexOf(lvl);
  const next = XP_LEVELS[idx + 1];
  const progress = next ? Math.min(100, Math.round(((xp - lvl.minXP) / (next.minXP - lvl.minXP)) * 100)) : 100;
  return { ...lvl, idx, next, progress };
}

function pluralMenty(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "мент";
  if (m10 === 1) return "мента";
  if (m10 >= 2 && m10 <= 4) return "менты";
  return "мент";
}

type BadgeDef = {
  id: string; icon: React.ReactNode; name: string; desc: string;
  tier: "bronze" | "silver" | "gold" | "special";
  check: (s: Stats) => boolean;
};
type Stats = { totalXP: number; bestStreak: number; totalMessages: number; isPro: boolean; isUltima: boolean; joinedDaysAgo: number; joinedBefore?: number };

// SVG badge icons
const BadgeIcon = {
  // Chat bubble with message dots
  chat: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6.5 17.5H20C21.1 17.5 22 16.6 22 15.5V4C22 2.9 21.1 2 20 2Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    <circle cx="8" cy="11" r="1.3" fill={c}/>
    <circle cx="12" cy="11" r="1.3" fill={c}/>
    <circle cx="16" cy="11" r="1.3" fill={c}/>
  </svg>,
  // Open book with text lines
  books: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M3 7C3 7 6.5 5.5 12 6.5V21C6.5 20 3 21.5 3 21.5V7Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M21 7C21 7 17.5 5.5 12 6.5V21C17.5 20 21 21.5 21 21.5V7Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 6.5V21" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5.5 10h4M5.5 13h4M14.5 10h4M14.5 13h4" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>,
  // Graduation cap with tassel
  grad: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M12 4.5L2 9.5L12 14.5L22 9.5L12 4.5Z" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M6 12V17.5C8.5 20 15.5 20 18 17.5V12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M22 9.5V14" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="22" cy="14.5" r="1.2" fill={c}/>
  </svg>,
  // Open books (professor) — two books
  book: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M12 7C9.5 5.5 5 5.5 3 6.5V19.5C5 18.5 9.5 18.5 12 20V7Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 7C14.5 5.5 19 5.5 21 6.5V19.5C19 18.5 14.5 18.5 12 20V7Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 7V20" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M5.5 9.5h4.5M5.5 12.5h4.5M14 9.5h4.5M14 12.5h4.5" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
  </svg>,
  // Flame with inner glow core
  flame: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M12 2C12 2 7 7.5 7 12.5C7 15.54 9.24 18 12 18C14.76 18 17 15.54 17 12.5C17 11 16.5 10 16 9C16 9 15.5 11.5 13.5 12C14.5 9.5 13.5 5.5 12 2Z" fill={c}/>
    <path d="M12 15.5C11 15.5 9.5 14.5 9.5 13C9.5 11.8 11 10.5 12 9.8C13 10.5 14.5 11.8 14.5 13C14.5 14.5 13 15.5 12 15.5Z" fill="#FFDD44" fillOpacity="0.9"/>
  </svg>,
  // Trophy with base and handles
  trophy: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M7 3H17V11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11V3Z" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M4 5H7V10C5.5 10 4 8.5 4 7V5Z" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M20 5H17V10C18.5 10 20 8.5 20 7V5Z" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M12 16V19" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8.5 21.5H15.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="12" cy="10" r="1.8" fill={c} fillOpacity="0.35"/>
  </svg>,
  // 5-point star with inner highlight
  spark: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M12 2L14.6 8.8L22 9.5L16.8 14.3L18.5 21.5L12 17.8L5.5 21.5L7.2 14.3L2 9.5L9.4 8.8L12 2Z" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 5.5L13.6 9.8L18 10.2L14.8 13L15.8 17.5L12 15.3L8.2 17.5L9.2 13L6 10.2L10.4 9.8L12 5.5Z" fill={c} fillOpacity="0.35"/>
  </svg>,
  // Diamond gem with facets
  gem: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M5.5 3H18.5L22 9L12 22L2 9L5.5 3Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M2 9H22" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M8.5 3L6 9L12 22" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.6"/>
    <path d="M15.5 3L18 9L12 22" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.6"/>
    <path d="M5.5 3L8.5 9H15.5L18.5 3" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.6"/>
  </svg>,
  // Rocket (первопроходец)
  bird: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M12 2C12 2 8 6 8 12V14L6 16L8 17V15H16V17L18 16L16 14V12C16 6 12 2 12 2Z" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="2" fill={c} fillOpacity="0.5" stroke={c} strokeWidth="1.2"/>
    <path d="M10 17.5C10 19.5 11 21 12 21C13 21 14 19.5 14 17.5H10Z" fill={c} fillOpacity="0.25" stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>,
  // Crown with jewels
  crown: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M3 17L4.5 8L9 13.5L12 5L15 13.5L19.5 8L21 17H3Z" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="4.5" cy="8" r="1.4" fill={c}/>
    <circle cx="12" cy="5" r="1.4" fill={c}/>
    <circle cx="19.5" cy="8" r="1.4" fill={c}/>
    <path d="M3 19.5H21" stroke={c} strokeWidth="2" strokeLinecap="round"/>
  </svg>,
  // Stack of books (профессор)
  stack: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <rect x="4" y="16.5" width="16" height="3.5" rx="1" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <rect x="5.5" y="11.5" width="13" height="3.5" rx="1" fill={c} fillOpacity="0.22" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <rect x="7" y="6.5" width="10" height="3.5" rx="1" fill={c} fillOpacity="0.32" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M7 6.5V10M6 11.5V15M5 16.5V20" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
  </svg>,
  // Calendar (неделя знаний)
  calendar: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 9.5H21" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M8 2.5V6.5M16 2.5V6.5" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="7.5" cy="13.5" r="1.2" fill={c} fillOpacity="0.45"/>
    <circle cx="12" cy="13.5" r="1.2" fill={c} fillOpacity="0.45"/>
    <circle cx="16.5" cy="13.5" r="1.2" fill={c} fillOpacity="0.45"/>
    <circle cx="7.5" cy="17.5" r="1.2" fill={c} fillOpacity="0.45"/>
    <circle cx="12" cy="17.5" r="1.5" fill={c}/>
    <path d="M10.8 17.5l.9.9 1.7-1.7" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Medal (знаток — отличается от звезды первых шагов)
  medal: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <circle cx="12" cy="14.5" r="6.5" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5"/>
    <path d="M9.5 6L8 3H16L14.5 6" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M9.5 6H14.5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M12 10.5l1.2 2.6 2.8.4-2 2 .5 2.8L12 17l-2.5 1.3.5-2.8-2-2 2.8-.4z" fill={c} fillOpacity="0.55" stroke={c} strokeWidth="0.9" strokeLinejoin="round"/>
  </svg>,
  // Infinity (ультра — отличается от алмаза мастера)
  infinity: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
    <path d="M12 12C12 12 9.5 8 6.5 8C4 8 2 10 2 12C2 14 4 16 6.5 16C9.5 16 12 12 12 12Z" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M12 12C12 12 14.5 16 17.5 16C20 16 22 14 22 12C22 10 20 8 17.5 8C14.5 8 12 12 12 12Z" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    <circle cx="6.5" cy="12" r="1.5" fill={c} fillOpacity="0.5"/>
    <circle cx="17.5" cy="12" r="1.5" fill={c} fillOpacity="0.5"/>
  </svg>,
};

const BADGES: BadgeDef[] = [
  { id: "first_message", icon: BadgeIcon.chat("#d97706"), name: "Первый вопрос", desc: "Отправил первое сообщение", tier: "bronze", check: s => s.totalMessages >= 1 },
  { id: "student", icon: BadgeIcon.books("#d97706"), name: "Студент", desc: "50 сообщений Менторе", tier: "bronze", check: s => s.totalMessages >= 50 },
  { id: "scholar", icon: BadgeIcon.grad("#6b7280"), name: "Учёный", desc: "200 сообщений Менторе", tier: "silver", check: s => s.totalMessages >= 200 },
  { id: "professor", icon: BadgeIcon.stack("#f59e0b"), name: "Профессор", desc: "500 сообщений Менторе", tier: "gold", check: s => s.totalMessages >= 500 },
  { id: "streak3", icon: BadgeIcon.flame("#FF7A00"), name: "На разогреве", desc: "3 дня учёбы подряд", tier: "bronze", check: s => s.bestStreak >= 3 },
  { id: "streak7", icon: BadgeIcon.calendar("#f59e0b"), name: "Неделя знаний", desc: "7 дней учёбы подряд", tier: "silver", check: s => s.bestStreak >= 7 },
  { id: "streak30", icon: BadgeIcon.trophy("#f59e0b"), name: "Месяц упорства", desc: "30 дней учёбы подряд", tier: "gold", check: s => s.bestStreak >= 30 },
  { id: "xp100", icon: BadgeIcon.spark("#d97706"), name: "Первые шаги", desc: "Набрал 100 мент", tier: "bronze", check: s => s.totalXP >= 100 },
  { id: "xp500", icon: BadgeIcon.medal("#6b7280"), name: "Знаток", desc: "Набрал 500 мент", tier: "silver", check: s => s.totalXP >= 500 },
  { id: "xp1000", icon: BadgeIcon.gem("#f59e0b"), name: "Мастер", desc: "Набрал 1000 мент", tier: "gold", check: s => s.totalXP >= 1000 },
  { id: "early_bird", icon: BadgeIcon.bird("#8b5cf6"), name: "Первопроходец", desc: "Присоединился до официального запуска 1 июня 2026", tier: "special", check: s => !!(s.joinedBefore && s.joinedBefore < new Date("2026-06-01").getTime()) },
  { id: "pro", icon: BadgeIcon.crown("#8b5cf6"), name: "Pro подписчик", desc: "Поддержал развитие Mentora", tier: "special", check: s => s.isPro },
  { id: "ultima", icon: BadgeIcon.infinity("#8b5cf6"), name: "Ultra", desc: "Максимальный план Mentora", tier: "special", check: s => s.isUltima },
];

const TIER_CONFIG: Record<string, { color: string; label: string }> = {
  bronze: { color: "#d97706", label: "Бронза" },
  silver: { color: "#6b7280", label: "Серебро" },
  gold:   { color: "#f59e0b", label: "Золото" },
  special:{ color: "#8b5cf6", label: "Особый" },
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: progressData }, { count: msgCount }] = await Promise.all([
    supabase.from("users").select("plan, trial_expires_at, created_at, display_name, name_changes_count, full_name, age, phone, gift_pro_claimed, messages_today, messages_window_start").eq("id", user.id).single(),
    supabase.from("user_progress").select("xp_total, streak_days, best_streak").eq("user_id", user.id),
    supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "user"),
  ]);

  const totalXP = progressData?.reduce((s, p) => s + (p.xp_total ?? 0), 0) ?? 0;
  const currentStreak = progressData?.reduce((m, p) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const bestStreak = progressData?.reduce((m, p) => Math.max(m, p.best_streak ?? 0), 0) ?? 0;
  const totalMessages = msgCount ?? 0;
  const isUltima = profile?.plan === "ultima";
  const isTrialActive = profile?.trial_expires_at ? new Date(profile.trial_expires_at) > new Date() : false;
  const isPro = isUltima || profile?.plan === "pro" || isTrialActive;

  // Rolling 8-hour window counter for free users (starts from first message sent)
  const FREE_LIMIT = 10;
  const WINDOW_HOURS = 8;
  const windowStart = profile?.messages_window_start ? new Date(profile.messages_window_start) : null;
  const windowExpired = !windowStart || (Date.now() - windowStart.getTime()) >= WINDOW_HOURS * 3600_000;
  const usedToday = windowExpired ? 0 : (profile?.messages_today ?? 0);
  const remainingToday = Math.max(0, FREE_LIMIT - usedToday);

  const joinedDaysAgo = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
    : 999;
  const joinedBefore = profile?.created_at ? new Date(profile.created_at).getTime() : undefined;

  const stats: Stats = { totalXP, bestStreak, totalMessages, isPro, isUltima, joinedDaysAgo, joinedBefore };
  const lvl = getLevel(totalXP);
  const changesLeft = Math.max(0, 2 - (profile?.name_changes_count ?? 0));
  const name = profile?.full_name ?? profile?.display_name ?? user.email?.split("@")[0] ?? "Пользователь";
  const initial = name[0].toUpperCase();

  const earned = BADGES.filter(b => b.check(stats));
  const locked = BADGES.filter(b => !b.check(stats));

  async function handleLogout() {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
    const { redirect } = await import("next/navigation");
    redirect("/");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      <DashboardNav isPro={isPro} isUltima={isUltima} totalXP={totalXP} currentStreak={currentStreak} bestStreak={bestStreak} logoutAction={handleLogout} />

      {/* Ambient BG */}
      <div className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 70% at 15% 10%, ${lvl.color}0a 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 85% 90%, ${lvl.color}07 0%, transparent 55%)`,
        }}
      />

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* ── Profile card ─────────────────────────────────── */}
        <div className="rounded-2xl p-6 border flex flex-col sm:flex-row items-start sm:items-center gap-5"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: isUltima ? "linear-gradient(135deg, #4561E8, #7C3AED)" : isPro ? "linear-gradient(135deg, #4561E8, #6B8FFF)" : `linear-gradient(135deg, ${lvl.grad[0]}, ${lvl.grad[1]})`, boxShadow: isUltima ? "0 4px 20px rgba(69,97,232,0.4)" : isPro ? "0 4px 20px rgba(69,97,232,0.35)" : `0 4px 20px ${lvl.color}40` }}>
              {initial}
            </div>

          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <p className="text-xl font-bold truncate" style={{ color: "var(--text)" }}>{name}</p>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: `${lvl.color}18`, color: lvl.color }}>
                {lvl.name}
              </span>
              {isPro ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                  style={{ background: isUltima ? "linear-gradient(135deg, #4561E8, #7C3AED)" : "linear-gradient(135deg, #4561E8, #6B8FFF)" }}>
                  {isUltima ? "ULTRA" : "PRO"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(100,116,139,0.12)", color: "var(--text-muted)", border: "1px solid rgba(100,116,139,0.2)" }}>
                  FREE
                  <span className="font-bold" style={{ color: remainingToday <= 5 ? "#f59e0b" : "var(--text-secondary)" }}>
                    · {remainingToday}/{FREE_LIMIT}
                  </span>
                </span>
              )}
            </div>
            <p className="text-sm mb-3 truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            <ProfileNameEditor
              currentNickname={profile?.display_name ?? null}
              changesLeft={changesLeft}
              currentFullName={profile?.full_name ?? null}
              currentAge={profile?.age ?? null}
              currentPhone={profile?.phone ?? null}
            />
          </div>
        </div>

        {/* ── Stats grid ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Мент"          value={totalXP}       icon={<MentIcon />}    accent="var(--brand)" isBrand />
          <StatCard label="Рекорд стрика" value={bestStreak}    icon={<FlameIcon />}   accent="#FF7A00" />
          <StatCard label="Сообщений"     value={totalMessages} icon={<MessageIcon />} accent="#10B981" />
          <StatCard label="Достижений"    value={earned.length} icon={<StarIcon />}    accent="#f59e0b" />
        </div>

        {/* ── XP Progress bar ──────────────────────────────── */}
        <div className="rounded-2xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "var(--text)" }}>{lvl.name}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${lvl.color}15`, color: lvl.color }}>
                {lvl.progress}%
              </span>
            </div>
            {lvl.next && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {lvl.next.name} через{" "}
                <span className="font-semibold" style={{ color: lvl.color }}>{(lvl.next.minXP - totalXP).toLocaleString("ru-RU")}</span>
                {" "}{pluralMenty(lvl.next.minXP - totalXP)}
              </span>
            )}
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${lvl.progress}%`,
                background: `linear-gradient(90deg, ${lvl.grad[0]}, ${lvl.grad[1]})`,
                boxShadow: `0 0 8px ${lvl.color}60`,
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {totalXP.toLocaleString("ru-RU")} / {(lvl.next?.minXP ?? totalXP).toLocaleString("ru-RU")} {pluralMenty(lvl.next?.minXP ?? totalXP)}
          </p>
        </div>

        {/* ── Earned badges ────────────────────────────────── */}
        {earned.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-[0.18em] uppercase mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Достижения · {earned.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earned.map(b => {
                const tc = TIER_CONFIG[b.tier];
                return (
                  <div key={b.id}
                    className="rounded-2xl p-4 border-2 flex flex-col items-center text-center gap-2 relative overflow-hidden"
                    style={{ borderColor: tc.color, background: `${tc.color}0d` }}
                  >
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${tc.color}18, transparent 60%)` }} />
                    <div className="relative z-10 w-10 h-10 flex items-center justify-center">{b.icon}</div>
                    <span className="font-bold text-sm relative z-10" style={{ color: "var(--text)" }}>{b.name}</span>
                    <span className="text-xs leading-snug relative z-10" style={{ color: "var(--text-secondary)" }}>{b.desc}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 relative z-10"
                      style={{ background: `${tc.color}20`, color: tc.color }}>
                      {tc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Locked badges ────────────────────────────────── */}
        {locked.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-[0.18em] uppercase mb-4" style={{ color: "var(--text-muted)" }}>
              Ещё не разблокировано · {locked.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {locked.map(b => (
                <div key={b.id}
                  className="rounded-2xl p-4 border flex flex-col items-center text-center gap-2"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", opacity: 0.45 }}
                >
                  <div className="w-10 h-10 flex items-center justify-center opacity-50"
                    style={{ filter: "grayscale(1)" }}>{b.icon}</div>
                  <span className="font-bold text-sm" style={{ color: "var(--text-secondary)" }}>{b.name}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{b.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Gift Pro banner — only for users registered before June 1 ── */}
        <div className="pb-4">
          <GiftProBanner
            giftClaimed={profile?.gift_pro_claimed ?? false}
            isUltima={isUltima}
            eligible={
              profile?.created_at
                ? new Date(profile.created_at).getTime() < new Date("2026-06-01T00:00:00+03:00").getTime()
                : false
            }
          />
        </div>

        {/* ── Referral ─────────────────────────────────────── */}
        <div className="pb-4">
          <ReferralWidget />
        </div>

        {/* ── Support code ─────────────────────────────────── */}
        <div className="pb-4 flex justify-center">
          <SupportCodeCopy code={makeSupportCode(user.id)} />
        </div>

        {/* ── Support ──────────────────────────────────────── */}
        <div className="pb-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Вопросы или проблемы?</p>
          <div className="flex gap-2 flex-wrap justify-center items-start">
            <TelegramSupportButton label="Написать в поддержку" supportCode={makeSupportCode(user.id)} />
            <InstagramButton label="@mentora.su" />
          </div>
          <a href="mailto:hello@mentora.su"
            className="text-xs"
            style={{ color: "var(--text-muted)", textDecoration: "underline", textDecorationStyle: "dotted" }}>
            hello@mentora.su
          </a>
        </div>

      </main>
    </div>
  );
}
