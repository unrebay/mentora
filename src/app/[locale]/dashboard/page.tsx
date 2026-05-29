import type { Metadata } from "next";
import { AppFooter } from "@/components/SiteFooter";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { computeFreeLimit, FREE_WINDOW_LIMIT } from "@/lib/free-limit";
import { getEffectivePlan } from "@/lib/plan";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import Link from "next/link";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import PaymentSuccessTracker from "@/components/PaymentSuccessTracker";
import { Suspense } from "react";
import { ProActivationBanner, ProExpiryBanner } from "@/components/ProBanners";
import AdminMessageBanner from "@/components/AdminMessageBanner";
import SubjectLibrarySection from "@/components/SubjectLibrarySection";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";
import BadgesSection from "@/components/BadgesSection";
import MeLogo from "@/components/MeLogo";
import WhatsNewBanner from "@/components/WhatsNewBanner";
import LaunchBanner from "@/components/LaunchBanner";
import FreeWindowPill from "@/components/FreeWindowPill";
import ReferralWidget from "@/components/ReferralWidget";
import SphereBlobScene, { SUBTLE_SPHERES } from "@/components/SphereBlobScene";
import TelegramSupportButton from "@/components/TelegramSupportButton";
import FadeUp from "@/components/FadeUp";
import dynamic from "next/dynamic";
const StreakRewardCelebration = dynamic(() => import("@/components/StreakRewardCelebration"), { ssr: false });

// Free-limit: single source of truth lives in src/lib/free-limit.ts

function pluralDaysRu(n: number): string {
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

function getFirstName(fullName?: string | null, email?: string | null, fallback?: string): string {
  if (fullName) return fullName.split(" ")[0];
  if (email) return email.split("@")[0];
  return fallback ?? "Student";
}

/**
 * SUBJECT_SYMBOLS — decorative thematic symbols rendered as low-opacity background
 * inside the «Продолжить обучение» card. Each subject has 8-12 unicode characters
 * that hint at the field without taking visual focus.
 */
const SUBJECT_SYMBOLS: Record<string, string[]> = {
  "russian-history":  ["1812", "1861", "1917", "Я", "Ѳ", "ѣ", "Русь", "Иванъ"],
  "world-history":    ["1492", "1789", "Caesar", "⚔", "Ω", "☥", "Empire", "Renaissance"],
  "mathematics":      ["∫", "∑", "π", "√", "∂", "∞", "≈", "lim", "x²", "ƒ(x)", "△"],
  "physics":          ["E=mc²", "F=ma", "λ", "ℏ", "Ω", "⚛", "Δt", "v=s/t", "α", "β"],
  "chemistry":        ["H₂O", "CO₂", "Fe", "Au", "Cu", "NaCl", "C₆H₁₂O₆", "pH", "⚗"],
  "biology":          ["DNA", "ATP", "RNA", "C₆H₁₂O₆", "mitosis", "↻"],
  "english":          ["the", "a/an", "have been", "had", "would", "Past Perfect", "tense", "/ɪŋ/"],
  "literature":       ["«…»", "✦", "§", "стих", "ямб", "хорей", "глава", "vol.I"],
  "russian-language": ["А", "Б", "В", "ё", "ъ", "ь", "падеж", "склонение"],
  "social-studies":   ["§", "⚖", "конст.", "право", "общество", "государство"],
  "geography":        ["⛰", "⊕", "◯", "N°", "E°", "карта", "широта", "долгота"],
  "computer-science": ["{ }", "[ ]", ";", "() =>", "//", "==", "0/1", "fn", "API"],
  "astronomy":        ["☉", "☽", "★", "♁", "♃", "♄", "ly", "AU", "✦"],
  "psychology":       ["ψ", "Σ", "EQ", "Id", "Ego", "архетип", "стимул", "когниция"],
  "philosophy":       ["?", "∴", "∵", "∀", "∃", "logos", "cogito", "ψυχή"],
  "economics":        ["₽", "$", "€", "%", "↑", "↓", "ВВП", "Δ", "GDP"],
  "discovery":        ["?", "!", "⚡", "✦", "↻", "→", "?!"],
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("dashboard")]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(locale === "en" ? "/en/auth" : "/auth");

  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed, plan, plan_expires_at, trial_expires_at, reward_plan, reward_expires_at, streak_reward_claimed, messages_today, messages_window_start, admin_message")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect(locale === "en" ? "/en/onboarding" : "/onboarding");

  const effectivePlan = getEffectivePlan(profile ?? {});
  const isUltima = effectivePlan === "ultima";
  const isPro = effectivePlan === "pro" || effectivePlan === "ultima";
  const isTrialActive = !!(profile?.trial_expires_at && new Date(profile.trial_expires_at) > new Date());

  const trialExpiresDate = profile?.trial_expires_at
    ? new Date(profile.trial_expires_at).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "long" })
    : null;

  const { messagesRemaining, resetAt } = computeFreeLimit(profile, isPro);

  const { data: progressData } = await supabase.from("user_progress").select("*").eq("user_id", user.id);

  const totalXP = progressData?.reduce((sum, p) => sum + (p.xp_total ?? 0), 0) ?? 0;
  const _todayStr  = new Date().toISOString().slice(0, 10);
  const _yestStr   = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const _liveStreak = (p: { streak_days?: number | null; last_active_at?: string | null }) => {
    const d = p.last_active_at?.slice(0, 10);
    return (d === _todayStr || d === _yestStr) ? (p.streak_days ?? 0) : 0;
  };
  const currentStreak = progressData?.reduce((max, p) => Math.max(max, _liveStreak(p)), 0) ?? 0;
  const bestStreak = progressData?.reduce((max, p) => Math.max(max, p.best_streak ?? 0), 0) ?? 0;

  const { data: userSubjectRows } = await supabase
    .from("user_subjects")
    .select("subject_id")
    .eq("user_id", user.id);

  let userSubjectIds: string[] = userSubjectRows?.map((r: { subject_id: string }) => r.subject_id) ?? [];
  if (userSubjectIds.length === 0) {
    await supabase
      .from("user_subjects")
      .upsert({ user_id: user.id, subject_id: "russian-history" }, { onConflict: "user_id,subject_id" });
    userSubjectIds = ["russian-history"];
  }

  const userSubjects = SUBJECTS.filter((s) => userSubjectIds.includes(s.id));

  // Last active subject — most recent last_active_at from progressData
  const lastActiveProgress = progressData
    ?.filter(p => p.last_active_at)
    .sort((a, b) => new Date(b.last_active_at!).getTime() - new Date(a.last_active_at!).getTime())[0];
  const lastActiveSubject = lastActiveProgress
    ? SUBJECTS.find(s => s.id === lastActiveProgress.subject) ?? null
    : null;

  // Last message the user sent for the active subject — used as "last topic" hint
  let lastTopicHint: string | null = null;
  if (lastActiveProgress) {
    const { data: lastMsg } = await supabase
      .from("chat_messages")
      .select("content")
      .eq("user_id", user.id)
      .eq("subject", lastActiveProgress.subject)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (lastMsg?.content) {
      const raw = lastMsg.content.trim().replace(/\s+/g, " ");
      lastTopicHint = raw.length > 140 ? raw.slice(0, 140) + "…" : raw;
    }
  }

  const firstName = getFirstName(
    user.user_metadata?.full_name ?? user.user_metadata?.name,
    user.email,
    locale === "en" ? "Student" : "Студент"
  );
  // Locale helpers for streak pluralization
  const streakDaysLabel = (n: number) => locale === "en"
    ? `${n} ${n === 1 ? "day" : "days"}`
    : `${n} ${pluralDaysRu(n)}`;

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(locale === "en" ? "/en" : "/");
  }

  const streakPct = Math.round((currentStreak / 7) * 100);
  const daysLeft = 7 - currentStreak;

  return (
    <>
      <main className="text-[var(--text)]" style={{ background: "var(--bg)" }}>
      {/* Dark theme: 3D sphere blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden dark:block hidden">
        <SphereBlobScene spheres={SUBTLE_SPHERES} intensity={0.5} />
      </div>
      {/* Ambient glow orbs — light theme; hidden in dark (SphereBlobScene handles that) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden dark:hidden">
        {/* Top-left: brand blue — centered IN viewport so glow spans nav + content uniformly */}
        <div className="absolute rounded-full" style={{
          width: 900, height: 900, top: "3%", left: "-250px",
          background: "radial-gradient(circle, rgba(69,97,232,0.18) 0%, transparent 55%)",
          animation: "ambientDrift1 18s ease-in-out infinite",
        }} />
        {/* Top-right: violet — starts at viewport top so it's visible behind nav AND below */}
        <div className="absolute rounded-full" style={{
          width: 680, height: 680, top: "0%", right: "-180px",
          background: "radial-gradient(circle, rgba(130,80,255,0.14) 0%, transparent 55%)",
          animation: "ambientDrift2 22s ease-in-out infinite",
        }} />
        {/* Mid-right: warm orange */}
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, top: "38%", right: "-120px",
          background: "radial-gradient(circle, rgba(255,110,0,0.14) 0%, transparent 58%)",
          animation: "ambientDrift3 26s ease-in-out infinite",
        }} />
        {/* Bottom-left: teal */}
        <div className="absolute rounded-full" style={{
          width: 560, height: 560, bottom: "-180px", left: "-100px",
          background: "radial-gradient(circle, rgba(40,180,200,0.14) 0%, transparent 58%)",
          animation: "ambientDrift2 30s ease-in-out infinite reverse",
        }} />
        {/* Center fill: faint blue so mid-page has uniform warmth */}
        <div className="absolute rounded-full" style={{
          width: 800, height: 800, top: "40%", left: "15%",
          background: "radial-gradient(circle, rgba(69,97,232,0.08) 0%, transparent 62%)",
          animation: "ambientDrift1 28s ease-in-out infinite reverse",
        }} />
      </div>
      <style>{`
        @keyframes ambientDrift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(40px, 30px) scale(1.08); }
          70% { transform: translate(-20px, 15px) scale(0.96); }
        }
        @keyframes ambientDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          35% { transform: translate(-35px, 20px) scale(1.1); }
          65% { transform: translate(15px, -10px) scale(0.94); }
        }
        @keyframes ambientDrift3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-30px, -25px) scale(1.06); }
        }
      `}</style>

      <StreakRewardCelebration />
      <PostHogIdentify userId={user.id} email={user.email ?? ""} />
      <Suspense fallback={null}><PaymentSuccessTracker /></Suspense>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 pt-6 pb-0 sm:pt-10 sm:pb-10">

        {/* ── Admin message banner (personal gift/notification) ─────── */}
        {profile?.admin_message && <AdminMessageBanner message={profile.admin_message} />}

        {/* ── Pro activation banner (payment=success in URL) ────────── */}
        <ProActivationBanner plan={profile?.plan ?? "free"} />

        {/* ── Pro expiry warning (≤3 days left) ────────────────────── */}
        <ProExpiryBanner
          trialExpiresAt={profile?.trial_expires_at ?? null}
          isPro={isPro}
        />

        {/* ── Trial active banner ───────────────────────────── */}
        {isTrialActive && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 border"
            style={{
              background: "rgba(69,97,232,0.07)",
              borderColor: "rgba(69,97,232,0.25)",
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: profile?.streak_reward_claimed ? "rgba(255,122,0,0.15)" : "rgba(69,97,232,0.15)" }}>
              {profile?.streak_reward_claimed ? (
                /* Fire icon — streak reward */
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#FF7A00"/>
                </svg>
              ) : (
                /* Star icon — referral / generic trial */
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="var(--brand)" stroke="none"/>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: profile?.streak_reward_claimed ? "#FF7A00" : "var(--brand)" }}>
                {t("trialActive", { date: trialExpiresDate ?? "" })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {profile?.streak_reward_claimed ? t("trialStreakMsg") : t("trialGenericMsg")}
              </p>
            </div>
          </div>
        )}

        {/* ── Streak progress banner ───────────────────────── */}
        {!isPro && !profile?.streak_reward_claimed && currentStreak < 7 && (
          <div className="mb-6 rounded-2xl px-5 py-4 border overflow-hidden relative"
            style={{
              background: "rgba(255,122,0,0.06)",
              borderColor: "rgba(255,122,0,0.25)",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,122,0,0.15)" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"
                    fill="url(#streakGrad)" />
                  <path d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z" fill="rgba(255,200,80,0.9)" />
                  <defs>
                    <linearGradient id="streakGrad" x1="12" y1="2" x2="12" y2="17" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FF4500" />
                      <stop offset="100%" stopColor="#FF9800" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm" style={{ color: "rgba(180,80,0,1)" }}>
                    {currentStreak === 0 ? t("streakBannerStart") : t("streakBannerProgress", { current: currentStreak })}
                  </p>
                  <span className="text-sm font-bold shrink-0 ml-3" style={{ color: "#FF7A00" }}>{currentStreak}/7</span>
                </div>
                <p className="text-xs mb-2" style={{ color: "rgba(200,100,20,0.8)" }}>
                  {locale === "en"
                    ? t("streakBannerDesc", { n: daysLeft })
                    : `${t("streakBannerDesc", { n: daysLeft, days: pluralDaysRu(daysLeft) })}`}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,122,0,0.15)" }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${streakPct}%`,
                    background: "linear-gradient(90deg, #FF4500, #FF9800)",
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Trial used banner ────────────────────────────── */}
        {!isPro && profile?.streak_reward_claimed && !isTrialActive && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 border"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--bg-card)" }}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2l1.5 4H14l-3.5 2.5 1.3 4L8 10 4.2 12.5 5.5 8.5 2 6h4.5L8 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{t("trialUsedTitle")}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {t("trialUsedDesc")}{" "}
                <Link href="/pricing" style={{ color: "var(--brand)" }} className="font-medium hover:underline">
                  {t("trialUsedCta")}
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ── Greeting ─────────────────────────────────────── */}
        <FadeUp className="mb-10">
          <p className="text-xs font-bold tracking-[0.18em] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            {t("libraryTitle")}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            {locale === "en" ? "Hello," : "Привет,"}{" "}
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {firstName}
            </span>
          </h1>
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            {t("subGreeting")}
          </p>

          <WhatsNewBanner />

          {/* ── June 1st launch banner ─────────────────────────── */}
          <LaunchBanner />

          {/* Stats pills — left: XP + streak / right: plan + messages */}
          <div data-tour="stats-chips" className="flex items-center justify-between gap-3 flex-wrap">

            {/* ── LEFT: Me XP + Streak ───────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
              {totalXP > 0 && (
                <div className="inline-flex items-center gap-2 select-none"
                  style={{
                    background: "var(--bg-nav)",
                    backdropFilter: "blur(20px) saturate(1.8)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 999,
                    boxShadow: "0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}>
                  <MeLogo height={14} />
                  <span className="tabular-nums">{totalXP}</span>
                </div>
              )}
              {currentStreak > 0 && (
                <div className="inline-flex items-center gap-2 select-none"
                  style={{
                    background: "var(--bg-nav)",
                    backdropFilter: "blur(20px) saturate(1.8)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                    border: "1px solid rgba(255,122,0,0.18)",
                    borderRadius: 999,
                    boxShadow: "0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#FF7A00" />
                  </svg>
                  {t("streakLabel")} <span style={{ color: "#FF7A00", fontWeight: 700 }}>{streakDaysLabel(currentStreak)}</span>
                </div>
              )}
            </div>

            {/* ── RIGHT: Plan + messages/limit ───────────────── */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Plan pill */}
              {!isPro && (
                <span style={{
                  background: "var(--bg-nav)",
                  backdropFilter: "blur(20px) saturate(1.8)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 999,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                  padding: "5px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}>FREE</span>
              )}
              {isPro && (
                <span style={isUltima
                  ? { background: "linear-gradient(135deg,#FF7A00,#7C3AED)", color: "#fff", borderRadius: 999, padding: "5px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", boxShadow: "0 2px 12px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)", textTransform: "uppercase" as const }
                  : { background: "linear-gradient(135deg,#4561E8,#6B8FFF)", color: "#fff", borderRadius: 999, padding: "5px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", boxShadow: "0 2px 12px rgba(69,97,232,0.35), inset 0 1px 0 rgba(255,255,255,0.15)", textTransform: "uppercase" as const }
                }>
                  {isUltima ? "ULTRA" : "PRO"}
                </span>
              )}
              {/* Messages + timer (free only) */}
              {!isPro && (
                <FreeWindowPill
                  remaining={messagesRemaining ?? FREE_WINDOW_LIMIT}
                  limit={FREE_WINDOW_LIMIT}
                  windowResetAt={resetAt}
                />
              )}
              {/* Unlimited (pro only) */}
              {isPro && (
                <div className="inline-flex items-center gap-2"
                  style={{
                    background: "var(--bg-nav)",
                    backdropFilter: "blur(20px) saturate(1.8)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 999,
                    boxShadow: "0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--brand)",
                  }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4.5 10c0-1.93 1.57-3.5 3.5-3.5S11.5 8.07 11.5 10s-1.57 3.5-3.5 3.5S4.5 11.93 4.5 10zm7 0c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5" />
                  </svg>
                  {t("unlimitedMessages")}
                </div>
              )}
              {/* Убрать лимит */}
              {!isPro && (
                <Link href="/pricing"
                  className="inline-flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                  style={{
                    background: "rgba(69,97,232,0.07)",
                    backdropFilter: "blur(20px) saturate(1.8)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                    border: "1px solid rgba(69,97,232,0.18)",
                    borderRadius: 999,
                    boxShadow: "0 2px 16px rgba(69,97,232,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--brand)",
                  }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1l1.5 4.5H14l-3.75 2.72 1.43 4.38L8 10l-3.68 2.6 1.43-4.38L2 5.5h4.5L8 1z" />
                  </svg>
                  {t("removeLimit")}
                </Link>
              )}
            </div>
          </div>
        </FadeUp>

        {/* ── Продолжить обучение ─────────────────────────── */}
        {lastActiveSubject && (() => {
          const accent = subjectColor(lastActiveSubject.id);
          const xp = lastActiveProgress?.xp_total ?? 0;
          const streak = lastActiveProgress?.streak_days ?? 0;
          // XP progress within current level
          const XP_THRESHOLDS = [
            { minXP: 0,    maxXP: 100  },
            { minXP: 100,  maxXP: 300  },
            { minXP: 300,  maxXP: 600  },
            { minXP: 600,  maxXP: 1000 },
            { minXP: 1000, maxXP: Infinity },
          ];
          const lvl = [...XP_THRESHOLDS].reverse().find(l => xp >= l.minXP) ?? XP_THRESHOLDS[0];
          const next = XP_THRESHOLDS[XP_THRESHOLDS.indexOf(lvl) + 1];
          const pct = next
            ? Math.min(100, Math.round(((xp - lvl.minXP) / (next.minXP - lvl.minXP)) * 100))
            : 100;

          return (
            <FadeUp delay={0.08} className="mt-8 mb-6">
            <div data-tour="continue-learning" className="rounded-2xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${accent}0d 0%, ${accent}06 60%, rgba(255,255,255,0.03) 100%)`,
                border: `1px solid ${accent}28`,
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                boxShadow: `0 4px 28px ${accent}12, inset 0 1px 0 rgba(255,255,255,0.10)`,
              }}
            >
              {/* Top shimmer line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${accent}40, transparent)`,
              }} />

              {/* Decorative subject symbols — themed background pattern */}
              {SUBJECT_SYMBOLS[lastActiveSubject.id] && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                  {SUBJECT_SYMBOLS[lastActiveSubject.id].map((sym, i) => {
                    // Pseudo-random but stable positions/sizes/rotations from index
                    const positions = [
                      { top: "8%",  left: "62%", size: 22, rot: -8 },
                      { top: "18%", left: "82%", size: 36, rot: 12 },
                      { top: "38%", left: "70%", size: 26, rot: -15 },
                      { top: "55%", left: "88%", size: 32, rot: 5 },
                      { top: "72%", left: "65%", size: 24, rot: -12 },
                      { top: "85%", left: "78%", size: 28, rot: 8 },
                      { top: "12%", left: "92%", size: 20, rot: 20 },
                      { top: "62%", left: "92%", size: 18, rot: -5 },
                      { top: "30%", left: "55%", size: 16, rot: 10 },
                      { top: "78%", left: "55%", size: 18, rot: -18 },
                      { top: "48%", left: "94%", size: 22, rot: 15 },
                      { top: "92%", left: "62%", size: 20, rot: -3 },
                    ];
                    const p = positions[i % positions.length];
                    return (
                      <span key={i} style={{
                        position: "absolute",
                        top: p.top, left: p.left,
                        fontSize: p.size,
                        fontFamily: "var(--font-playfair), Georgia, serif",
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${accent}, ${accent}66)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        opacity: 0.18,
                        transform: `rotate(${p.rot}deg)`,
                        userSelect: "none",
                        whiteSpace: "nowrap",
                        letterSpacing: "-0.02em",
                      }}>
                        {sym}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="p-5">
                {/* Header row: icon + label + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0" style={{ marginTop: 2 }}>
                    <div className="absolute pointer-events-none" aria-hidden
                      style={{
                        top: -6, left: -6, width: 60, height: 60, borderRadius: "50%",
                        background: `radial-gradient(circle, ${accent}26 0%, transparent 70%)`,
                        filter: "blur(10px)",
                      }}
                    />
                    <SubjectIcon id={lastActiveSubject.id} size={48} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-[0.18em] uppercase flex items-center gap-1.5"
                      style={{ color: accent }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
                      {t("continueLearning")}
                    </p>
                    <p className="font-black text-xl leading-tight mt-1" style={{ color: "var(--text)", letterSpacing: "-0.01em" }}>
                      {lastActiveSubject.title}
                    </p>
                    {lastTopicHint && (
                      <p className="text-sm mt-1.5 leading-snug" style={{
                        color: "var(--text-secondary)",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                      }}>
                        {lastTopicHint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>
                    {locale === "en" ? `${xp} XP` : `${xp} ${pluralMenty(xp)}`}
                  </span>
                  {streak > 0 && (
                    <>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="#f97316" style={{ marginTop: 2 }}>
                        <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"/>
                      </svg>
                      <span>{streak} {t("xpInRow")}</span>
                    </>
                  )}
                  {next && (
                    <>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span>{pct}%</span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-4 rounded-full overflow-hidden" style={{ height: 5, background: `${accent}18` }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${accent}99, ${accent})`,
                      boxShadow: `0 0 6px ${accent}60`,
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>

                {/* CTA button — full width */}
                <Link href={`/learn/${lastActiveSubject.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${accent}ee, ${accent}bb)`,
                    boxShadow: `0 2px 14px ${accent}40`,
                  }}>
                  {t("continueBtn")}
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
            </FadeUp>
          );
        })()}

        {/* ── Subject library ───────────────────────────────── */}
        <FadeUp delay={0.06}>
        <div data-tour="subjects">
          <SubjectLibrarySection
            userSubjects={userSubjects}
            existingSubjectIds={userSubjectIds}
            userId={user.id}
            progressEntries={progressData ?? []}
          />
        </div>
        </FadeUp>

        {/* ── Referral ─────────────────────────────────────── */}
        <FadeUp delay={0.1} className="mt-8 mb-2">
        <div data-tour="referral">
          <ReferralWidget />
        </div>
        </FadeUp>

        {/* ── Support ──────────────────────────────────────── */}
        <FadeUp delay={0.15} fade>
        <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("needHelp")}</p>
          <div className="flex gap-2 flex-wrap justify-center items-start">
            <TelegramSupportButton size="sm" label={t("support")} />
          </div>
        </div>
        </FadeUp>
        {/* White end-cap: mirrors the gap above the support block so it sits
            visually centred between Referral and the page edge. Combined with
            overscroll-behavior:none on the dashboard wrapper, this is the
            page's terminator — no extra scroll past this. */}
        <div aria-hidden style={{ height: "clamp(56px, 12vw, 96px)" }} />
      </div>
        </main>
      <AppFooter />
    </>
  );
}
