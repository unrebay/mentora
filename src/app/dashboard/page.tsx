import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import Link from "next/link";
import Logo from "@/components/Logo";
import { RUSSIAN_HISTORY_TOPICS, TOTAL_TOPICS } from "@/lib/topics";
import TopicsMap from "@/components/TopicsMap";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { PaymentSuccessTracker } from "@/components/PaymentSuccessTracker";
import ThemeToggle from "@/components/ThemeToggle";
import SubjectLibrarySection from "@/components/SubjectLibrarySection";

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
  <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#4561E8", fontStyle: "italic", fontWeight: 700, fontSize: "1.2em", lineHeight: 1, display: "inline-block", verticalAlign: "-0.08em", marginRight: "0.1em" }}>е</span>
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

  const isTrialActive = profile?.trial_expires_at
    ? new Date(profile.trial_expires_at) > new Date()
    : false;
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

  const totalXP  = progressData?.reduce((sum, p) => sum + (p.xp_total   ?? 0), 0) ?? 0;
  const maxStreak = progressData?.reduce((max, p) => Math.max(max, p.streak_days ?? 0), 0) ?? 0;

  // Personal subject library
  const { data: userSubjectRows } = await supabase
    .from("user_subjects")
    .select("subject_id")
    .eq("user_id", user.id);

  let userSubjectIds: string[] =
    userSubjectRows?.map((r: { subject_id: string }) => r.subject_id) ?? [];

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
      {/* Subtle animated gradient background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 15% 10%, rgba(69,97,232,0.06) 0%, transparent 55%), " +
            "radial-gradient(ellipse 80% 60% at 85% 90%, rgba(91,119,255,0.04) 0%, transparent 55%)",
          animation: "gradientDrift 10s ease-in-out infinite alternate",
        }}
      />

      <PostHogIdentify userId={user.id} email={user.email ?? ""} />
      <PaymentSuccessTracker />

      <nav
        className="sticky top-0 z-10 border-b border-[var(--border)]"
        style={{ background: "var(--bg-nav)", backdropFilter: "blur(12px)" }}
      >
        {/* Row 1: Logo + desktop links + actions */}
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="hidden md:flex items-center gap-5 ml-2">
              <a href="/dashboard/analytics" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Аналитика</a>
              <a href="/knowledge" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Галактика знаний</a>
              <a href="/profile" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Профиль</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {totalXP > 0 && (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <span className="font-semibold text-[var(--text)]"><MentoraE />{totalXP} {pluralMenty(totalXP)}</span>
                {maxStreak > 0 && <span className="text-orange-500 font-semibold">🔥 {maxStreak} {pluralDays(maxStreak)}</span>}
              </div>
            )}
            {!isPro && <Link href="/pricing" className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">Тарифы</Link>}
            <form action={handleLogout}>
              <button type="submit" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">Выйти</button>
            </form>
          </div>
        </div>
        {/* Row 2: Mobile-only tabs */}
        <div className="md:hidden border-t border-[var(--border-light)] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex min-w-max px-2">
            {[
              { href: "/dashboard/analytics", label: "Аналитика" },
              { href: "/knowledge", label: "🌌 Галактика" },
              { href: "/profile", label: "Профиль" },
              ...(!isPro ? [{ href: "/pricing", label: "✨ Тарифы" }] : []),
            ].map(({ href, label }) => (
              <a key={href} href={href}
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors whitespace-nowrap px-3 py-2 border-b-2 border-transparent hover:border-brand-500">
                {label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {isTrialActive && (
          <div className="mb-6 flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="font-semibold text-brand-800 text-sm">
                Pro активен до {trialExpiresDate}!
              </p>
              <p className="text-xs text-brand-600 mt-0.5">
                Ты собрал 7-дневный стрик — и получил 3 дня Pro. Безлимитные сообщения уже работают.
              </p>
            </div>
          </div>
        )}

        {!isPro && !profile?.streak_reward_claimed && maxStreak < 7 && (
          <div className="mb-6 flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
            <span className="text-2xl">🔥</span>
            <div className="flex-1">
              <p className="font-semibold text-orange-800 text-sm">
                {maxStreak === 0
                  ? "Начни стрик — и получи Pro бесплатно"
                  : `${maxStreak} из 7 дней → 3 дня Pro`}
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Учись {7 - maxStreak}{" "}
                {7 - maxStreak === 1 ? "день" : 7 - maxStreak < 5 ? "дня" : "дней"} подряд и получи 3 дня Pro без карты.
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-orange-100 overflow-hidden w-full max-w-xs">
                <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.round((maxStreak / 7) * 100)}%` }} />
              </div>
            </div>
            <div className="text-right text-sm font-bold text-orange-500 shrink-0">{maxStreak}/7</div>
          </div>
        )}

        {!isPro && profile?.streak_reward_claimed && !isTrialActive && (
          <div className="mb-6 flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-semibold text-[var(--text)] text-sm">Pro trial использован</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Понравилось? Оформи полную подписку и учись без лимитов.{" "}
                <a href="/pricing" className="text-brand-600 font-medium hover:underline">Посмотреть тарифы →</a>
              </p>
            </div>
          </div>
        )}

        <div className="mb-10">
          <div className="mb-1 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">
            Библиотека знаний
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            Привет, {firstName}! 👋
          </h1>
          <p className="text-[var(--text-muted)] mb-6">Начни учиться в диалоге с AI-ментором</p>

          {!isPro && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm">
                <span className="text-base">💬</span>
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
                  <span>🔥</span>
                  <span className="text-[var(--text-secondary)]">
                    Стрик:{" "}
                    <span className="font-semibold text-orange-500">{maxStreak} {pluralDays(maxStreak)}</span>
                  </span>
                </div>
              )}
              <Link href="/pricing" className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm text-brand-700 font-medium hover:bg-brand-100 transition-colors">
                ✨ Убрать лимит
              </Link>
            </div>
          )}

          {isPro && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: isUltima ? "#0f0f1e" : "#4561E8", color: "#fff", border: isUltima ? "1px solid #28284a" : "none" }}>
                <span className="font-bold tracking-wide text-xs">{isUltima ? "✦ ULTIMA" : "PRO"}</span>
              </div>
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm">
                <span>♾️</span>
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

        <SubjectLibrarySection
          userSubjects={userSubjects}
          existingSubjectIds={userSubjectIds}
          userId={user.id}
          progressEntries={progressData ?? []}
        />

        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="mb-1 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">
                Карта знаний
              </div>
              <h2 className="text-2xl font-bold text-[var(--text)]">
                История России · {TOTAL_TOPICS} тем
              </h2>
            </div>
            <Link href="/learn/russian-history" className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors">
              Начать учиться →
            </Link>
          </div>
          <TopicsMap periods={RUSSIAN_HISTORY_TOPICS} />
        </div>

        <div className="mt-8 md:hidden">
          <Link href="/learn/russian-history" className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-brand-600 text-white text-sm font-semibold rounded-2xl hover:bg-brand-700 transition-colors">
            Начать учиться →
          </Link>
        </div>
      </div>
    </main>
  );
}
