import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import Link from "next/link";
import Logo from "@/components/Logo";
import { RUSSIAN_HISTORY_TOPICS, TOTAL_TOPICS } from "@/lib/topics";
import TopicsMap from "@/components/TopicsMap";

const XP_LEVELS = [
  { name: "Новичок",     minXP: 0,    maxXP: 100,  color: "bg-gray-400" },
  { name: "Исследователь", minXP: 100,  maxXP: 300,  color: "bg-blue-500" },
  { name: "Знаток",      minXP: 300,  maxXP: 600,  color: "bg-brand-500" },
  { name: "Историк",     minXP: 600,  maxXP: 1000, color: "bg-purple-500" },
  { name: "Эксперт",     minXP: 1000, maxXP: Infinity, color: "bg-amber-500" },
];

const DAILY_LIMIT = 30;

function getLevel(xp: number) {
  const level = XP_LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? XP_LEVELS[0];
  const idx = XP_LEVELS.indexOf(level);
  const next = XP_LEVELS[idx + 1];
  const progress = next
    ? Math.min(100, Math.round(((xp - level.minXP) / (next.minXP - level.minXP)) * 100))
    : 100;
  return { ...level, idx, next, progress };
}

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
  const isPro = profile?.plan === "pro" || isTrialActive;
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
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <a href="/dashboard/analytics" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Аналитика</a>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            {totalXP > 0 && (
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <span className="text-brand-600 font-semibold">⚡ {totalXP} XP</span>
                {maxStreak > 0 && <span className="text-orange-500 font-semibold">🔥 {maxStreak} дней</span>}
              </div>
            )}
            {!isPro && (
              <Link href="/pricing" className="hidden sm:inline-flex text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                Тарифы
              </Link>
            )}
            <form action={handleLogout}>
              <button type="submit" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
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
              <p className="font-semibold text-brand-800 text-sm">Pro активен до {trialExpiresDate}!</p>
              <p className="text-xs text-brand-600 mt-0.5">Ты собрал 7-дневный стрик — и получил 3 дня Pro. Безлимитные сообщения уже работают.</p>
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
                Учись {7 - maxStreak} {7 - maxStreak === 1 ? "день" : 7 - maxStreak < 5 ? "дня" : "дней"} подряд и получи 3 дня Pro без карты.
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-orange-100 overflow-hidden w-full max-w-xs">
                <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.round((maxStreak / 7) * 100)}%` }} />
              </div>
            </div>
            <div className="text-right text-sm font-bold text-orange-500 shrink-0">{maxStreak}/7</div>
          </div>
        )}

        {!isPro && profile?.streak_reward_claimed && !isTrialActive && (
          <div className="mb-6 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-semibold text-gray-700 text-sm">Pro trial использован</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Понравилось? Оформи полную подписку и учись без лимитов.{" "}
                <a href="/pricing" className="text-brand-600 font-medium hover:underline">Посмотреть тарифы →</a>
              </p>
            </div>
          </div>
        )}

        <div className="mb-10">
          <div className="mb-1 text-xs font-semibold text-gray-400 tracking-widest uppercase">Библиотека знаний</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            Привет, {firstName}! 👋
          </h1>
          <p className="text-gray-400 mb-6">Начни учиться в диалоге с AI-ментором</p>

          {!isPro && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-base">💬</span>
                <span className="text-gray-600">
                  Сообщений сегодня:{" "}
                  <span className={`font-semibold ${messagesRemaining === 0 ? "text-red-500" : messagesRemaining !== null && messagesRemaining <= 5 ? "text-orange-500" : "text-gray-900"}`}>
                    {messagesRemaining} / {DAILY_LIMIT}
                  </span>
                </span>
              </div>
              {totalXP > 0 && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                  <span>⚡</span>
                  <span className="text-gray-600">XP: <span className="font-semibold text-gray-900">{totalXP}</span></span>
                </div>
              )}
              {maxStreak > 0 && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                  <span>🔥</span>
                  <span className="text-gray-600">Стрик: <span className="font-semibold text-orange-500">{maxStreak} дней</span></span>
                </div>
              )}
              <Link href="/pricing" className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm text-brand-700 font-medium hover:bg-brand-100 transition-colors">
                ✨ Убрать лимит
              </Link>
            </div>
          )}

          {isPro && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm">
                <span>♾️</span>
                <span className="text-brand-700 font-medium">Безлимитные сообщения</span>
              </div>
              {totalXP > 0 && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                  <span>⚡</span>
                  <span className="text-gray-600">XP: <span className="font-semibold text-gray-900">{totalXP}</span></span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Предметы</h2>
          <a
            href="mailto:hi@mentora.su?subject=Предложить предмет"
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors px-3 py-1.5 rounded-lg"
          >
            <span className="text-base leading-none">+</span> Предложить предмет
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map((subject) => {
            const progress = progressMap.get(subject.id);
            return (
              <div key={subject.id} className={`relative rounded-2xl border transition-all overflow-hidden ${subject.available ? "bg-white border-gray-200 hover:border-brand-300 hover:shadow-md cursor-pointer" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                {subject.available ? (
                  <Link href={`/learn/${subject.id}`} className="block p-5">
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">LIVE</span>
                    <div className="text-3xl mb-3">{subject.emoji}</div>
                    <div className="font-semibold text-sm text-gray-900 mb-0.5">{subject.title}</div>
                    <div className="text-xs text-gray-400">{subject.description}</div>
                    {progress ? (() => {
                      const lvl = getLevel(progress.xp_total ?? 0);
                      return (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-gray-500">{lvl.name}</span>
                            <span className="text-[10px] text-brand-600 font-medium">⚡ {progress.xp_total} XP</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${lvl.color}`} style={{ width: `${lvl.progress}%` }} />
                          </div>
                          {progress.streak_days > 0 && (
                            <div className="mt-1.5 text-[10px] text-orange-500 font-medium">🔥 {progress.streak_days} дней подряд</div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="mt-3"><span className="text-xs font-medium text-brand-600">Начать →</span></div>
                    )}
                  </Link>
                ) : (
                  <div className="block p-5">
                    <span className="absolute top-3 right-3 text-[10px] font-medium bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">СКОРО</span>
                    <div className="text-3xl mb-3">{subject.emoji}</div>
                    <div className="font-semibold text-sm text-gray-500 mb-0.5">{subject.title}</div>
                    <div className="text-xs text-gray-400">{subject.description}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="mb-1 text-xs font-semibold text-gray-400 tracking-widest uppercase">Карта знаний</div>
              <h2 className="text-2xl font-bold text-gray-900">История России · {TOTAL_TOPICS} тем</h2>
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
