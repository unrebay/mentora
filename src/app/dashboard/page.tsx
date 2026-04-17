import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import Link from "next/link";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { PaymentSuccessTracker } from "@/components/PaymentSuccessTracker";
import SubjectLibrarySection from "@/components/SubjectLibrarySection";
import DashboardNav from "@/components/DashboardNav";

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
  <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#4561E8", fontStyle: "italic", fontWeight: 700, fontSize: "1.2em", lineHeight: 1, marginRight: "0.1em" }}>е</span>
);

function getFirstName(fullName?: string | null, email?: string | null): string {
  if (fullName) return fullName.split(" ")[0];
  if (email) return email.split("@")[0];
  return "Студент";
}

// Inline SVG icons
function StarIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-5 h-5 shrink-0"} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 18C6.69 18 4 15.31 4 12c0-2.46 1.4-5.04 2.8-6.6.47-.54 1.38-.19 1.38.52v.17c0 .68.46 1.26 1.13 1.37.46.07.88-.12 1.12-.47C11.2 6.09 11.58 5.3 11.58 5.3c.34-.57 1.15-.47 1.36.13.47 1.14.68 2.39.35 3.41 1.03-.9 1.15-2.41 1.15-2.41 0-.7.8-1.14 1.38-.79C16.88 6.77 18 8.82 18 11.13 18 14.96 15.26 18 10 18z"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-[var(--text-muted)]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8h5M7.5 11h3M3 10a7 7 0 1012.48 4.35L18 17l-2.65-2.52A7 7 0 103 10z"/>
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" d="M4.5 10c0-1.93 1.57-3.5 3.5-3.5S11.5 8.07 11.5 10s-1.57 3.5-3.5 3.5S4.5 11.93 4.5 10zm7 0c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5"/>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l1.5 4.5H14l-3.75 2.72 1.43 4.38L8 10l-3.68 2.6 1.43-4.38L2 5.5h4.5L8 1z"/>
    </svg>
  );
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

  const { data: progressData } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

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

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Ambient background: two soft glowing orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 700, height: 700,
            top: "-200px", left: "-100px",
            background: "radial-gradient(circle, rgba(69,97,232,0.07) 0%, transparent 65%)",
            animation: "orb1 14s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            top: "20%", right: "-80px",
            background: "radial-gradient(circle, rgba(255,122,0,0.05) 0%, transparent 65%)",
            animation: "orb2 18s ease-in-out infinite alternate",
          }}
        />
      </div>

      <PostHogIdentify userId={user.id} email={user.email ?? ""} />
      <PaymentSuccessTracker />
      <DashboardNav isPro={isPro} isUltima={isUltima} totalXP={totalXP} maxStreak={maxStreak} logoutAction={handleLogout} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Trial active banner */}
        {isTrialActive && (
          <div className="mb-6 flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
            <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <StarIcon />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-brand-800 text-sm">Pro активен до {trialExpiresDate}</p>
              <p className="text-xs text-brand-600 mt-0.5">Ты собрал 7-дневный стрик — и получил 3 дня Pro. Безлимитные сообщения уже работают.</p>
            </div>
          </div>
        )}

        {/* Streak progress banner */}
        {!isPro && !profile?.streak_reward_claimed && maxStreak < 7 && (
          <div className="mb-6 flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
              <FlameIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-800 text-sm">
                {maxStreak === 0 ? "Начни стрик — и получи Pro бесплатно" : `${maxStreak} из 7 дней → 3 дня Pro`}
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Учись {7 - maxStreak}{" "}{7 - maxStreak === 1 ? "день" : 7 - maxStreak < 5 ? "дня" : "дней"} подряд и получи 3 дня Pro без карты.
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-orange-100 overflow-hidden w-full max-w-xs">
                <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.round((maxStreak / 7) * 100)}%` }} />
              </div>
            </div>
            <div className="text-right text-sm font-bold text-orange-500 shrink-0">{maxStreak}/7</div>
          </div>
        )}

        {/* Trial used banner */}
        {!isPro && profile?.streak_reward_claimed && !isTrialActive && (
          <div className="mb-6 flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
              <StarIcon />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)] text-sm">Pro trial использован</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Понравилось? Оформи полную подписку и учись без лимитов.{" "}
                <a href="/pricing" className="text-brand-600 font-medium hover:underline">Посмотреть тарифы →</a>
              </p>
            </div>
          </div>
        )}

        {/* Greeting + stats */}
        <div className="mb-10">
          <div className="mb-1 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">Библиотека знаний</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">Привет, {firstName}</h1>
          <p className="text-[var(--text-muted)] mb-6">Начни учиться в диалоге с AI-ментором</p>

          {!isPro && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm">
                <ChatIcon />
                <span className="text-[var(--text-secondary)]">
                  Сообщений сегодня:{" "}
                  <span className={`font-semibold ${messagesRemaining === 0 ? "text-red-500" : messagesRemaining !== null && messagesRemaining <= 5 ? "text-orange-500" : "text-[var(--text)]"}`}>
                    {messagesRemaining} / {DAILY_LIMIT}
                  </span>
                </span>
              </div>
              {totalXP > 0 && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text)]">
                  <MentoraE /> {totalXP} {pluralMenty(totalXP)}
                </div>
              )}
              {maxStreak > 0 && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm">
                  <FlameIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-[var(--text-secondary)]">Стрик:{" "}<span className="font-semibold text-orange-500">{maxStreak} {pluralDays(maxStreak)}</span></span>
                </div>
              )}
              <Link href="/pricing" className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm text-brand-700 font-medium hover:bg-brand-100 transition-colors">
                <SparkleIcon /> Убрать лимит
              </Link>
            </div>
          )}

          {isPro && (
            <div className="flex flex-wrap gap-3">
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                style={isUltima
                  ? { background: "#000000", color: "#fff" }
                  : { background: "#4561E8", color: "#fff" }}>
                <span className="font-bold tracking-wide text-xs">{isUltima ? "✦ ULTRA" : "PRO"}</span>
              </div>
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm">
                <InfinityIcon />
                <span className="text-brand-700 font-medium">Безлимитные сообщения</span>
              </div>
              {totalXP > 0 && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text)]">
                  <MentoraE /> {totalXP} {pluralMenty(totalXP)}
                </div>
              )}
            </div>
          )}
        </div>

        <SubjectLibrarySection userSubjects={userSubjects} existingSubjectIds={userSubjectIds} userId={user.id} progressEntries={progressData ?? []} />
      </div>
    </main>
  );
}
