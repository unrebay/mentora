import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import Link from "next/link";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { PaymentSuccessTracker } from "@/components/PaymentSuccessTracker";
import SubjectLibrarySection from "@/components/SubjectLibrarySection";
import BadgesSection from "@/components/BadgesSection";
import SphereBlobScene, { SUBTLE_SPHERES } from "@/components/SphereBlobScene";

const DAILY_LIMIT = 20;

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

const MentoraE = () => (
  <span style={{ fontWeight: 700, letterSpacing: "-0.01em", marginRight: "0.12em" }}>
    <span style={{ color: "var(--text)" }}>M</span>
    <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#4561E8", fontStyle: "italic" }}>е</span>
  </span>
);

function getFirstName(fullName?: string | null, email?: string | null): string {
  if (fullName) return fullName.split(" ")[0];
  if (email) return email.split("@")[0];
  return "Студент";
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed, plan, trial_expires_at, streak_reward_claimed, messages_today, messages_date")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const isTrialActive = profile?.trial_expires_at ? new Date(profile.trial_expires_at) > new Date() : false;
  const isUltima = profile?.plan === "ultima";
  const isPro = isUltima || profile?.plan === "pro" || isTrialActive;

  const trialExpiresDate = profile?.trial_expires_at
    ? new Date(profile.trial_expires_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : null;

  const today = new Date().toISOString().slice(0, 10);
  const isNewDay = profile?.messages_date !== today;
  const usedToday = isNewDay ? 0 : (profile?.messages_today ?? 0);
  const messagesRemaining = isPro ? null : Math.max(0, DAILY_LIMIT - usedToday);

  const [{ data: progressData }, { data: badgesData }] = await Promise.all([
    supabase.from("user_progress").select("*").eq("user_id", user.id),
    supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
  ]);

  const earnedBadgeIds = badgesData?.map((b: { badge_id: string }) => b.badge_id) ?? [];

  const totalXP = progressData?.reduce((sum, p) => sum + (p.xp_total ?? 0), 0) ?? 0;
  const maxStreak = progressData?.reduce((max, p) => Math.max(max, p.streak_days ?? 0), 0) ?? 0;

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

  const firstName = getFirstName(
    user.user_metadata?.full_name ?? user.user_metadata?.name,
    user.email
  );

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  const streakPct = Math.round((maxStreak / 7) * 100);
  const daysLeft = 7 - maxStreak;

  return (
    <main className="min-h-screen text-[var(--text)]" style={{ background: "var(--bg)" }}>
      {/* Ambient sphere background — subtle, theme-aware */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden dark:block hidden">
        <SphereBlobScene spheres={SUBTLE_SPHERES} intensity={0.5} />
      </div>
      {/* Light theme: soft gradient orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden dark:hidden">
        <div className="absolute rounded-full" style={{
          width: 700, height: 700, top: "-200px", left: "-150px",
          background: "radial-gradient(circle, rgba(69,97,232,0.05) 0%, transparent 65%)",
        }} />
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, top: "30%", right: "-80px",
          background: "radial-gradient(circle, rgba(255,122,0,0.04) 0%, transparent 65%)",
        }} />
      </div>

      <PostHogIdentify userId={user.id} email={user.email ?? ""} />
      <PaymentSuccessTracker />
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Trial active banner ───────────────────────────── */}
        {isTrialActive && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 border"
            style={{
              background: "rgba(69,97,232,0.07)",
              borderColor: "rgba(69,97,232,0.25)",
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(69,97,232,0.15)" }}>
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="var(--brand)" stroke="none"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: "var(--brand)" }}>Pro активен до {trialExpiresDate}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Ты собрал 7-дневный стрик — и получил 3 дня Pro. Безлимитные сообщения уже работают.</p>
            </div>
          </div>
        )}

        {/* ── Streak progress banner ───────────────────────── */}
        {!isPro && !profile?.streak_reward_claimed && maxStreak < 7 && (
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
                    {maxStreak === 0 ? "Начни стрик — получи 3 дня Pro" : `${maxStreak} из 7 дней → 3 дня Pro бесплатно`}
                  </p>
                  <span className="text-sm font-bold shrink-0 ml-3" style={{ color: "#FF7A00" }}>{maxStreak}/7</span>
                </div>
                <p className="text-xs mb-2" style={{ color: "rgba(200,100,20,0.8)" }}>
                  Учись {daysLeft} {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"} подряд и получи 3 дня Pro без карты.
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
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Pro trial использован</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Понравилось?{" "}
                <Link href="/pricing" style={{ color: "var(--brand)" }} className="font-medium hover:underline">
                  Оформи подписку →
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ── Greeting ─────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[0.18em] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            Библиотека знаний
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            Привет,{" "}
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
            Продолжай учиться — прогресс накапливается каждый день
          </p>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2 items-center">
            {!isPro && (
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M7.5 8h4M7.5 11h3M2.5 9a5.5 5.5 0 1 0 9.8 3.4L14 14l-1.7-1.6" />
                </svg>
                <span style={{ color: "var(--text-secondary)" }}>
                  Сообщений:{" "}
                  <span className="font-semibold" style={{
                    color: messagesRemaining === 0 ? "#ef4444" : messagesRemaining !== null && messagesRemaining <= 5 ? "#f97316" : "var(--text)",
                  }}>
                    {messagesRemaining} / {DAILY_LIMIT}
                  </span>
                </span>
              </div>
            )}

            {isPro && (
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold text-white"
                style={isUltima
                  ? { background: "linear-gradient(135deg, #FF7A00, #7C3AED)", boxShadow: "0 2px 12px rgba(124,58,237,0.3)" }
                  : { background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 2px 12px rgba(69,97,232,0.3)" }
                }>
                {isUltima ? "ULTRA" : "PRO"}
              </div>
            )}

            {isPro && (
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4.5 10c0-1.93 1.57-3.5 3.5-3.5S11.5 8.07 11.5 10s-1.57 3.5-3.5 3.5S4.5 11.93 4.5 10zm7 0c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5" />
                </svg>
                <span style={{ color: "var(--brand)" }} className="font-medium">Безлимитные сообщения</span>
              </div>
            )}

            {totalXP > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}>
                <MentoraE />{totalXP}
              </div>
            )}

            {maxStreak > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#FF7A00" />
                </svg>
                <span style={{ color: "var(--text-secondary)" }}>
                  Стрик: <span className="font-semibold" style={{ color: "#FF7A00" }}>{maxStreak} {pluralDays(maxStreak)}</span>
                </span>
              </div>
            )}

            {!isPro && (
              <Link href="/pricing"
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(69,97,232,0.08)",
                  border: "1px solid rgba(69,97,232,0.2)",
                  color: "var(--brand)",
                }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1l1.5 4.5H14l-3.75 2.72 1.43 4.38L8 10l-3.68 2.6 1.43-4.38L2 5.5h4.5L8 1z" />
                </svg>
                Убрать лимит
              </Link>
            )}
          </div>
        </div>

        {/* ── Badges ──────────────────────────────────────── */}
        <BadgesSection earnedBadgeIds={earnedBadgeIds} />

        {/* ── Subject library ───────────────────────────────── */}
        <SubjectLibrarySection
          userSubjects={userSubjects}
          existingSubjectIds={userSubjectIds}
          userId={user.id}
          progressEntries={progressData ?? []}
        />
      </div>
    </main>
  );
}
