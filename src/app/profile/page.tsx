import React from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileNameEditor } from "@/components/ProfileNameEditor";
import ReferralWidget from "@/components/ReferralWidget";
import DashboardNav from "@/components/DashboardNav";

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
type Stats = { totalXP: number; maxStreak: number; totalMessages: number; isPro: boolean; isUltima: boolean; joinedDaysAgo: number };

// SVG badge icons
const BadgeIcon = {
  chat: (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  books: (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  grad:  (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  book:  (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  flame: (c: string) => <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}><path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill={c}/><path d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z" fill="rgba(255,200,80,0.85)"/></svg>,
  trophy:(c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  spark: (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  gem:   (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3L8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>,
  bird:  (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M22 2l-7.7 19.4-4.3-9.1L1.2 7.9 22 2z"/></svg>,
  crown: (c: string) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}><path d="M2 4l4 8 6-6 6 6 4-8v14H2V4z"/></svg>,
};

const BADGES: BadgeDef[] = [
  { id: "first_message", icon: BadgeIcon.chat("#d97706"), name: "Первый вопрос", desc: "Отправил первое сообщение", tier: "bronze", check: s => s.totalMessages >= 1 },
  { id: "student", icon: BadgeIcon.books("#d97706"), name: "Студент", desc: "50 сообщений ментору", tier: "bronze", check: s => s.totalMessages >= 50 },
  { id: "scholar", icon: BadgeIcon.grad("#6b7280"), name: "Учёный", desc: "200 сообщений ментору", tier: "silver", check: s => s.totalMessages >= 200 },
  { id: "professor", icon: BadgeIcon.book("#f59e0b"), name: "Профессор", desc: "500 сообщений ментору", tier: "gold", check: s => s.totalMessages >= 500 },
  { id: "streak3", icon: BadgeIcon.flame("#FF7A00"), name: "На разогреве", desc: "3 дня учёбы подряд", tier: "bronze", check: s => s.maxStreak >= 3 },
  { id: "streak7", icon: BadgeIcon.flame("#FF7A00"), name: "Неделя знаний", desc: "7 дней учёбы подряд", tier: "silver", check: s => s.maxStreak >= 7 },
  { id: "streak30", icon: BadgeIcon.trophy("#f59e0b"), name: "Месяц упорства", desc: "30 дней учёбы подряд", tier: "gold", check: s => s.maxStreak >= 30 },
  { id: "xp100", icon: BadgeIcon.spark("#d97706"), name: "Первые шаги", desc: "Набрал 100 ментов", tier: "bronze", check: s => s.totalXP >= 100 },
  { id: "xp500", icon: BadgeIcon.spark("#6b7280"), name: "Знаток", desc: "Набрал 500 ментов", tier: "silver", check: s => s.totalXP >= 500 },
  { id: "xp1000", icon: BadgeIcon.gem("#f59e0b"), name: "Мастер", desc: "Набрал 1000 ментов", tier: "gold", check: s => s.totalXP >= 1000 },
  { id: "early_bird", icon: BadgeIcon.bird("#8b5cf6"), name: "Первопроходец", desc: "Присоединился в первые 90 дней", tier: "special", check: s => s.joinedDaysAgo <= 90 },
  { id: "pro", icon: BadgeIcon.crown("#8b5cf6"), name: "Pro подписчик", desc: "Поддержал развитие Mentora", tier: "special", check: s => s.isPro },
  { id: "ultima", icon: BadgeIcon.gem("#8b5cf6"), name: "Ultima", desc: "Максимальный план Mentora", tier: "special", check: s => s.isUltima },
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
    supabase.from("users").select("plan, created_at, display_name, name_changes_count, full_name, age, phone").eq("id", user.id).single(),
    supabase.from("user_progress").select("xp_total, streak_days").eq("user_id", user.id),
    supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "user"),
  ]);

  const totalXP = progressData?.reduce((s, p) => s + (p.xp_total ?? 0), 0) ?? 0;
  const maxStreak = progressData?.reduce((m, p) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const totalMessages = msgCount ?? 0;
  const isUltima = profile?.plan === "ultima";
  const isPro = isUltima || profile?.plan === "pro";
  const joinedDaysAgo = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
    : 999;

  const stats: Stats = { totalXP, maxStreak, totalMessages, isPro, isUltima, joinedDaysAgo };
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

      <DashboardNav isPro={isPro} isUltima={isUltima} totalXP={totalXP} maxStreak={maxStreak} logoutAction={handleLogout} />

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
              {isPro && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                  style={{ background: isUltima ? "linear-gradient(135deg, #4561E8, #7C3AED)" : "linear-gradient(135deg, #4561E8, #6B8FFF)" }}>
                  {isUltima ? "+ ULTRA" : "PRO"}
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
          {[
            {
              label: "Мент",
              value: totalXP,
              suffix: "",
              icon: <span style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.3rem", lineHeight: 1 }}><span style={{ color: "var(--text)" }}>M</span><span style={{ color: "var(--brand)", fontStyle: "italic" }}>е</span></span>,
              accent: "var(--brand)",
            },
            {
              label: "Рекорд стрика",
              value: maxStreak,
              suffix: "",
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#FF7A00"/></svg>,
              accent: "#FF7A00",
            },
            {
              label: "Сообщений",
              value: totalMessages,
              suffix: "",
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#10B981"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>,
              accent: "#10B981",
            },
            {
              label: "Достижений",
              value: earned.length,
              suffix: "",
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
              accent: "#f59e0b",
            },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border text-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={i === 0
                  ? { background: "rgba(69,97,232,0.08)", border: "1.5px solid rgba(140,165,240,0.45)" }
                  : { background: `${s.accent}18` }}>
                {s.icon}
              </div>
              <div className="font-bold text-xl" style={{ color: "var(--text)" }}>
                {s.value.toLocaleString("ru-RU")}
                <span className="text-sm font-medium ml-0.5" style={{ color: "var(--text-muted)" }}>{s.suffix}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
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

        {/* ── Referral ─────────────────────────────────────── */}
        <div className="pb-4">
          <ReferralWidget />
        </div>

      </main>
    </div>
  );
}
