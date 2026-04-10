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

const XP_LEVELS = [
  { name: "Новичок", minXP: 0, maxXP: 100, color: "bg-gray-400" },
  { name: "Исследователь", minXP: 100, maxXP: 300, color: "bg-blue-500" },
  { name: "Знаток", minXP: 300, maxXP: 600, color: "bg-brand-500" },
  { name: "Историк", minXP: 600, maxXP: 1000, color: "bg-purple-500" },
  { name: "Эксперт", minXP: 1000, maxXP: Infinity, color: "bg-amber-500" },
];

const DAILY_LIMIT = 20;

function getLevel(xp: number) {
  const level = XP_LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? XP_LEVELS[0];
  const idx = XP_LEVELS.indexOf(level);
  const next = XP_LEVELS[idx + 1];
  const progress = next
    ? Math.min(100, Math.round(((xp - level.minXP) / (next.minXP - level.minXP)) * 100))
    : 100;
  return { ...level, idx, next, progress };
}

function pluralDays(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "дней";
  if (m10 === 1) return "день";
  if (m10 >= 2 && m10 <= 4) return "дня";
  return "дней";
}

// Russian pluralization: 1 мента, 2-4 менты, 5+ мент
function pluralMenty(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "мент";
  if (m10 === 1) return "мента";
  if (m10 >= 2 && m10 <= 4) return "менты";
  return "мент";
}

// Mentora logo "е" — italic, Playfair, brand blue
const MentoraE = () => (
  <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#4561E8", fontStyle: "italic", fontWeight: 700 }}>е</span>
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "onboarding_completed, plan, trial_expires_at, streak_reward_claimed, messages_today, messages_date"
    )
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const isTrialActive = profile?.trial_expires_at
    ? new Date(profile.trial_expires_at) > new Date()
    : false;
  const isPro = profile?.plan === "pro" || isTrialActive;
  const trialExpiresDate = profile?.trial_expires_at
    ? new Date(profile.trial_expires_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      })
    : null;

  const today = new Date().toISOString().slice(0, 10);
  const isNewDay = profile?.messages_date !== today;
  const usedToday = isNewDay ? 0 : (profile?.messages_today ?? 0);
  const messagesRemaining = isPro ? null : Math.max(0, DAILY_LIMIT - usedToday);

  const { data: progressData } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  const progressMap = new Map(progressData?.map((p) => [p.subject, p]) ?? []);
  const totalXP = progressData?.reduce((sum, p) => sum + (p.xp_total ?? 0), 0) ?? 0;
  const maxStreak = progressData?.reduce((max, p) => Math.max(max, p.streak_days ?? 0), 0) ?? 0;

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
      <nav className="sticky top-0 z-10 border-b border-[var(--border)] px-6 py-4" style={{ background: "var(--bg-nav)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <a href="/dashboard/analytics" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
              Аналитика
            </a>
            <a href="/knowledge" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
              База знаний
            </a>
            <a href="/profile" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
              Профиль
            </a>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            {totalXP > 0 && (
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <span className="font-semibold text-gray-700">
                  <MentoraE /> {totalXP} {pluralMenty(totalXP)}
                </span>
                {maxStreak > 0 && (
                  <span className="text-orange-500 font-semibold">
                    🔥 {maxStreak} {pluralDays(maxStreak)}
                  </span>
                )}
              </div>
            )}
            {!isPro && (
              <Link
                href="/pricing"
                className="hidden sm:inline-flex text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Тарифы
              </Link>
            )}
            <form action={handleLogout}>
              <button
                type="submit"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Выйти
              </button>
            </form>
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
                <div
                  className="h-full rounded-full bg-orange-400 transition-all"
                  style={{ width: `${Math.round((maxStreak / 7) * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right text-sm font-bold text-orange-500 shrink-0">
              {maxStreak}/7
            </div>
          </div>
        )}

        {!isPro && profile?.streak_reward_claimed && !isTrialActive && (
          <div className="mb-6 flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-semibold text-[var(--text)] text-sm">Pro trial использован</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Понравилось? Оформи полную подписку и учись без лимитов.{" "}
                <a href="/pricing" className="text-brand-600 font-medium hover:underline">
                  Посмотреть тарифы →
                </a>
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
                <span className="text-gray-600">
                  Сообщений сегодня:{" "}
                  <span
                    className={`font-semibold ${
                      messagesRemaining === 0
                        ? "text-red-500"
                        : messagesRemaining !== null && messagesRemaining <= 5
                        ? "text-orange-500"
                        : "text-[var(--text)]"
                    }`}
                  >
                    {messagesRemaining} / {DAILY_LIMIT}
                  </span>
                </span>
              </div>
              {totalXP > 0 && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700">
                  <MentoraE /> {totalXP} {pluralMenty(totalXP)}
                </div>
              )}
              {maxStreak > 0 && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm">
                  <span>🔥</span>
                  <span className="text-gray-600">
                    Стрик:{" "}
                    <span className="font-semibold text-orange-500">
                      {maxStreak} {pluralDays(maxStreak)}
                    </span>
                  </span>
                </div>
              )}
              <Link
                href="/pricing"
                className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm text-brand-700 font-medium hover:bg-brand-100 transition-colors"
              >
                ✨ Убрать лимит
              </Link>
            </div>
          )}

          {isPro && (
            <div className="flex flex-wrap gap-3">
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                style={{ background: "#111", color: "#fff" }}
              >
                <span className="font-bold tracking-wide">PRO</span>
              </div>
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm">
                <span>♾️</span>
                <span className="text-brand-700 font-medium">Безлимитные сообщения</span>
              </div>
              {totalXP > 0 && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700">
                  <MentoraE /> {totalXP} {pluralMenty(totalXP)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Предметы
          </h2>
          <a
            href="mailto:hi@mentora.su?subject=Предложить предмет"
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors px-3 py-1.5 rounded-lg"
          >
            <span className="text-base leading-none">+</span>
            Предложить предмет
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map((subject) => {
            const progress = progressMap.get(subject.id);
            const isVerified = subject.verified;
            const isBeta = subject.beta && !isVerified;
            const isActive = subject.available && (isBeta || isVerified);

            return (
              <div
                key={subject.id}
                className={`relative rounded-2xl border transition-all overflow-hidden ${
                  isVerified
                    ? "border-[#4561E8] hover:shadow-lg cursor-pointer"
                    : isActive
                    ? "bg-white border-[var(--border)] hover:border-brand-300 hover:shadow-md cursor-pointer"
                    : "bg-[var(--bg-secondary)] border-[var(--border)] opacity-60"
                }`}
                style={isVerified ? { background: "#4561E8" } : undefined}
              >
                {isActive ? (
                  <Link href={`/learn/${subject.id}`} className="block p-5">
                    {isVerified ? (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/25 text-white px-1.5 py-0.5 rounded-md">
                        ✦ verified
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md">
                        ✦ beta
                      </span>
                    )}
                    <div className="text-3xl mb-3">{subject.emoji}</div>
                    <div
                      className={`font-semibold text-sm mb-0.5 ${
                        isVerified ? "text-white" : "text-[var(--text)]"
                      }`}
                    >
                      {subject.title}
                    </div>
                    <div className={`text-xs ${isVerified ? "text-white/70" : "text-gray-400"}`}>
                      {subject.description}
                    </div>
                    {progress ? (
                      (() => {
                        const lvl = getLevel(progress.xp_total ?? 0);
                        const xp = progress.xp_total ?? 0;
                        return (
                          <div
                            className={`mt-3 pt-3 border-t ${
                              isVerified ? "border-white/20" : "border-[var(--border)]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-semibold ${
                                  isVerified ? "text-white/70" : "text-gray-500"
                                }`}
                              >
                                {lvl.name}
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  isVerified ? "text-white" : "text-brand-600"
                                }`}
                              >
                                {xp} {pluralMenty(xp)}
                              </span>
                            </div>
                            <div
                              className={`h-1.5 rounded-full overflow-hidden ${
                                isVerified ? "bg-white/20" : "bg-[var(--bg-secondary)]"
                              }`}
                            >
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isVerified ? "bg-[var(--bg-card)]" : lvl.color
                                }`}
                                style={{ width: `${lvl.progress}%` }}
                              />
                            </div>
                            {progress.streak_days > 0 && (
                              <div
                                className={`mt-1.5 text-[10px] font-medium ${
                                  isVerified ? "text-white/80" : "text-orange-500"
                                }`}
                              >
                                🔥 {progress.streak_days}{" "}
                                {pluralDays(progress.streak_days ?? 0)} подряд
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="mt-3">
                        <span
                          className={`text-xs font-medium ${
                            isVerified ? "text-white" : "text-brand-600"
                          }`}
                        >
                          Начать →
                        </span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="block p-5">
                    <span className="absolute top-3 right-3 text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md">
                      СКОРО
                    </span>
                    <div className="text-3xl mb-3">{subject.emoji}</div>
                    <div className="font-semibold text-sm text-[var(--text-secondary)] mb-0.5">
                      {subject.title}
                    </div>
                    <div className="text-xs text-gray-400">{subject.description}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Добавить предмет */}
          <a
            href="mailto:hi@mentora.su?subject=Хочу предмет"
            className="relative rounded-2xl border-2 border-dashed border-[var(--border)] bg-white hover:border-brand-300 hover:bg-brand-50 transition-all cursor-pointer flex flex-col items-center justify-center p-5 min-h-[140px] gap-2 group"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] group-hover:bg-brand-100 flex items-center justify-center transition-colors">
              <span className="text-2xl text-[var(--text-muted)] group-hover:text-brand-500 leading-none">
                +
              </span>
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-brand-600 text-center transition-colors">
              Добавить предмет
            </span>
          </a>
        </div>

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
            <Link
              href="/learn/russian-history"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
            >
              Начать учиться →
            </Link>
          </div>
          <TopicsMap periods={RUSSIAN_HISTORY_TOPICS} />
        </div>

        <div className="mt-8 md:hidden">
          <Link
            href="/learn/russian-history"
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-brand-600 text-white text-sm font-semibold rounded-2xl hover:bg-brand-700 transition-colors"
          >
            Начать учиться →
          </Link>
        </div>
      </div>
    </main>
  );
}
