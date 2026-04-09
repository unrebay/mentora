import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileNameEditor } from "@/components/ProfileNameEditor";
import Logo from "@/components/Logo";

export const metadata = { title: "Профиль — Mentora" };

const XP_LEVELS = [
  { name: "Новичок", minXP: 0, maxXP: 100, color: "#9ca3af", bg: "#f3f4f6" },
  { name: "Исследователь", minXP: 100, maxXP: 300, color: "#3b82f6", bg: "#eff6ff" },
  { name: "Знаток", minXP: 300, maxXP: 600, color: "#6366f1", bg: "#eef2ff" },
  { name: "Историк", minXP: 600, maxXP: 1000, color: "#8b5cf6", bg: "#f5f3ff" },
  { name: "Эксперт", minXP: 1000, maxXP: 99999, color: "#f59e0b", bg: "#fffbeb" },
];

function getLevel(xp: number) {
  const lvl = XP_LEVELS.slice().reverse().find(l => xp >= l.minXP) ?? XP_LEVELS[0];
  const idx = XP_LEVELS.indexOf(lvl);
  const next = XP_LEVELS[idx + 1];
  const progress = next ? Math.min(100, Math.round(((xp - lvl.minXP) / (next.minXP - lvl.minXP)) * 100)) : 100;
  return { ...lvl, idx, next, progress };
}

// Styled brand "е" — matches the italic blue "e" in the Mentora logo
function BrandE() {
  return <span style={{ color: "#4561E8", fontStyle: "italic" }}>е</span>;
}

type BadgeDef = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  tier: "bronze" | "silver" | "gold" | "special";
  check: (s: Stats) => boolean;
};
type Stats = { totalXP: number; maxStreak: number; totalMessages: number; isPro: boolean; joinedDaysAgo: number };

const BADGES: BadgeDef[] = [
  { id: "first_message", icon: "💬", name: "Первый вопрос", desc: "Отправил первое сообщение", tier: "bronze", check: s => s.totalMessages >= 1 },
  { id: "student", icon: "📚", name: "Студент", desc: "50 сообщений ментору", tier: "bronze", check: s => s.totalMessages >= 50 },
  { id: "scholar", icon: "🎓", name: "Учёный", desc: "200 сообщений ментору", tier: "silver", check: s => s.totalMessages >= 200 },
  { id: "professor", icon: "📖", name: "Профессор", desc: "500 сообщений ментору", tier: "gold", check: s => s.totalMessages >= 500 },
  { id: "streak3", icon: "🔥", name: "На разогреве", desc: "3 дня учёбы подряд", tier: "bronze", check: s => s.maxStreak >= 3 },
  { id: "streak7", icon: "🔥", name: "Неделя знаний", desc: "7 дней учёбы подряд", tier: "silver", check: s => s.maxStreak >= 7 },
  { id: "streak30", icon: "🏆", name: "Месяц упорства", desc: "30 дней учёбы подряд", tier: "gold", check: s => s.maxStreak >= 30 },
  { id: "xp100", icon: "✦", name: "Первые шаги", desc: "Набрал 100 ментов", tier: "bronze", check: s => s.totalXP >= 100 },
  { id: "xp500", icon: "✦", name: "Знаток", desc: "Набрал 500 ментов", tier: "silver", check: s => s.totalXP >= 500 },
  { id: "xp1000", icon: "💎", name: "Мастер", desc: "Набрал 1000 ментов", tier: "gold", check: s => s.totalXP >= 1000 },
  { id: "early_bird", icon: "🦅", name: "Первопроходец", desc: "Присоединился в первые 30 дней", tier: "special", check: s => s.joinedDaysAgo <= 90 },
  { id: "pro", icon: "👑", name: "Pro подписчик", desc: "Поддержал развитие Mentora", tier: "special", check: s => s.isPro },
];

const TIER_STYLE: Record<string, { border: string; bg: string; label: string }> = {
  bronze: { border: "#d97706", bg: "#fffbeb", label: "Бронза" },
  silver: { border: "#6b7280", bg: "#f9fafb", label: "Серебро" },
  gold: { border: "#f59e0b", bg: "#fef3c7", label: "Золото" },
  special: { border: "#8b5cf6", bg: "#f5f3ff", label: "Особый" },
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
  const isPro = profile?.plan === "pro";
  const joinedDaysAgo = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
    : 999;

  const stats: Stats = { totalXP, maxStreak, totalMessages, isPro, joinedDaysAgo };
  const lvl = getLevel(totalXP);
  const changesLeft = Math.max(0, 2 - (profile?.name_changes_count ?? 0));
  const name = profile?.full_name ?? profile?.display_name ?? user.email?.split("@")[0] ?? "Пользователь";
  const initial = name[0].toUpperCase();

  const earned = BADGES.filter(b => b.check(stats));
  const locked = BADGES.filter(b => !b.check(stats));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Назад</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Шапка профиля */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${lvl.color}, ${lvl.color}99)` }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-gray-900 truncate">{name}</p>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
            <ProfileNameEditor
              currentNickname={profile?.display_name ?? null}
              changesLeft={changesLeft}
              currentFullName={profile?.full_name ?? null}
              currentAge={profile?.age ?? null}
              currentPhone={profile?.phone ?? null}
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>{lvl.name}</span>
              {isPro && <span className="text-xs font-bold px-2.5 py-1 rounded-full tracking-wide" style={{ background: "#111", color: "#fff" }}>PRO</span>}
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: <span>Мои м<BrandE />нты</span>,
              value: totalXP,
              icon: "✦",
              iconStyle: { color: "#4561E8", fontSize: "1.5rem", fontStyle: "italic", fontWeight: 700 },
            },
            { label: "Макс. стрик", value: `${maxStreak}д`, icon: "🔥", iconStyle: {} },
            { label: "Сообщений", value: totalMessages, icon: "💬", iconStyle: {} },
            { label: "Достижений", value: earned.length, icon: "🏅", iconStyle: {} },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <div className="text-2xl mb-1" style={s.iconStyle}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Прогресс уровня */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900">{lvl.name}</span>
            {lvl.next && (
              <span className="text-sm text-gray-400">
                {lvl.next.name} через {(lvl.next.minXP - totalXP)} м<BrandE />нтов
              </span>
            )}
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${lvl.progress}%`, background: lvl.color }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {totalXP} / {lvl.next?.minXP ?? totalXP} м<BrandE />нтов
          </p>
        </div>

        {/* Бейджи — заработанные */}
        {earned.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏅 Достижения ({earned.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {earned.map(b => {
                const ts = TIER_STYLE[b.tier];
                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl p-5 border-2 shadow-sm flex flex-col items-center text-center gap-2"
                    style={{ borderColor: ts.border, background: ts.bg }}
                  >
                    <span className="text-4xl">{b.icon}</span>
                    <span className="font-bold text-sm text-gray-900">{b.name}</span>
                    <span className="text-xs text-gray-500">{b.desc}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                      style={{ background: ts.border + "22", color: ts.border }}
                    >
                      {ts.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Бейджи — заблокированные */}
        {locked.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-400 mb-4">🔒 Ещё не разблокировано</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {locked.map(b => (
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col items-center text-center gap-2 opacity-50">
                  <span className="text-4xl grayscale">{b.icon}</span>
                  <span className="font-bold text-sm text-gray-500">{b.name}</span>
                  <span className="text-xs text-gray-400">{b.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
