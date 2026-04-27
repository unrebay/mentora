import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import { getEffectivePlan } from "@/lib/plan";

export const dynamic = "force-dynamic";

const XP_LEVELS = [
  { name: "Новичок",       minXP: 0    },
  { name: "Исследователь", minXP: 100  },
  { name: "Знаток",        minXP: 300  },
  { name: "Историк",       minXP: 600  },
  { name: "Эксперт",       minXP: 1000 },
];
function getLevelName(xp: number) {
  return [...XP_LEVELS].reverse().find(l => xp >= l.minXP)?.name ?? "Новичок";
}
const LEVEL_COLOR: Record<string, string> = {
  "Новичок":       "#94a3b8",
  "Исследователь": "#4561E8",
  "Знаток":        "#7C3AED",
  "Историк":       "#f59e0b",
  "Эксперт":       "#d97706",
};

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // ── Fetch user progress ─────────────────────────────────────────
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("subject, xp_total, streak_days, best_streak")
    .eq("user_id", user.id);

  const totalXP     = progressRows?.reduce((s, r) => s + (r.xp_total ?? 0), 0) ?? 0;
  const maxStreak   = progressRows?.reduce((m, r) => Math.max(m, r.streak_days ?? 0), 0) ?? 0;
  const bestStreak  = progressRows?.reduce((m, r) => Math.max(m, r.best_streak ?? 0), 0) ?? 0;
  const activeSubjects = progressRows?.filter(r => r.xp_total > 0).length ?? 0;

  // ── Total messages ──────────────────────────────────────────────
  const { count: totalMessages } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user");

  // ── Global rank (by total XP) ───────────────────────────────────
  const { data: rankData } = await supabase.rpc("get_user_global_rank", {
    p_user_id: user.id,
  }).maybeSingle() as { data: { rank: number; total: number } | null };

  const globalRank  = rankData?.rank  ?? null;
  const totalUsers  = rankData?.total ?? null;

  // ── Top subjects for this user ──────────────────────────────────
  const topSubjects = [...(progressRows ?? [])]
    .filter(r => r.xp_total > 0)
    .sort((a, b) => b.xp_total - a.xp_total)
    .slice(0, 5)
    .map(r => ({
      ...r,
      label: SUBJECTS.find(s => s.id === r.subject)?.title ?? r.subject,
      level: getLevelName(r.xp_total),
      color: LEVEL_COLOR[getLevelName(r.xp_total)],
    }));

  const overallLevel = getLevelName(totalXP);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Твоя аналитика</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Личная статистика по всей платформе
        </p>
      </div>

      {/* Global rank card */}
      {globalRank && (
        <div className="relative overflow-hidden rounded-2xl p-6 border"
          style={{
            background: "linear-gradient(135deg, rgba(69,97,232,0.10), rgba(159,122,255,0.07))",
            borderColor: "rgba(69,97,232,0.25)",
          }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "rgba(69,97,232,0.10)", filter: "blur(32px)" }} />
          <div className="relative z-10 flex items-center gap-5">
            <div className="flex-shrink-0 text-center">
              <div className="text-5xl font-black" style={{ color: "var(--brand)", lineHeight: 1 }}>
                #{globalRank}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                из {totalUsers ?? "?"}
              </div>
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(69,97,232,0.2)" }} />
            <div>
              <div className="font-bold text-base mb-0.5" style={{ color: "var(--text)" }}>
                Место в глобальном топе
              </div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Рейтинг по суммарному XP среди всех пользователей платформы.
                {globalRank <= 3 && " Ты в тройке лучших!"}
                {globalRank <= 10 && globalRank > 3 && " Ты в топ-10!"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Суммарный XP",    value: totalXP.toLocaleString("ru-RU"),   color: "#4561E8", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
          { label: "Текущий стрик",   value: `${maxStreak} дн.`,                color: "#FF7A00", icon: "M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" },
          { label: "Сообщений",       value: (totalMessages ?? 0).toLocaleString("ru-RU"), color: "#10B981", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
          { label: "Предметов",       value: `${activeSubjects} из 14`,          color: "#9F7AFF", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
        ].map(stat => (
          <div key={stat.label}
            className="rounded-2xl p-4 border flex flex-col gap-2"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${stat.color}18` }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill={stat.color}>
                <path d={stat.icon} />
              </svg>
            </div>
            <div className="font-black text-xl" style={{ color: "var(--text)" }}>{stat.value}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Level & best streak */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5 border flex items-center gap-4"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${LEVEL_COLOR[overallLevel]}18`, border: `1px solid ${LEVEL_COLOR[overallLevel]}30` }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={LEVEL_COLOR[overallLevel]} strokeWidth="1.8">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Общий уровень</div>
            <div className="font-black text-lg" style={{ color: LEVEL_COLOR[overallLevel] }}>{overallLevel}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{totalXP} XP суммарно</div>
          </div>
        </div>

        <div className="rounded-2xl p-5 border flex items-center gap-4"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,122,0,0.12)", border: "1px solid rgba(255,122,0,0.25)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF7A00">
              <path d="M13 2C13 2 8.5 7 8.5 11.5c0 1.5.5 2.8 1.3 3.8C9.3 14.5 9 13.5 9 12.5c0-2 1.5-4 3-5 0 1.5.5 3 1.5 4 .5-1 .5-2 .5-3 1 1.5 1.5 3 1.5 4.5 0 2.5-2 4.5-4.5 4.5S6.5 15.5 6.5 13C6.5 7.5 13 2 13 2z" />
            </svg>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Лучший стрик</div>
            <div className="font-black text-lg" style={{ color: "#FF7A00" }}>{bestStreak} дней</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {bestStreak >= 7 ? "Получил награду за стрик" : `До награды: ${7 - bestStreak} дней`}
            </div>
          </div>
        </div>
      </div>

      {/* Top subjects */}
      {topSubjects.length > 0 && (
        <div>
          <h2 className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            Твои предметы
          </h2>
          <div className="space-y-2">
            {topSubjects.map((s, i) => (
              <div key={s.subject}
                className="flex items-center gap-4 rounded-2xl p-4 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="text-sm font-bold w-5 text-center flex-shrink-0"
                  style={{ color: i === 0 ? "#f59e0b" : "var(--text-muted)" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{s.label}</span>
                    <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: s.color }}>{s.level}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (s.xp_total / 1000) * 100)}%`,
                        background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`,
                      }} />
                  </div>
                </div>
                <div className="text-xs font-bold flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {s.xp_total} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {topSubjects.length === 0 && (
        <div className="text-center py-16 rounded-2xl border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="font-bold mb-2" style={{ color: "var(--text)" }}>Начни учиться — появится статистика</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Задай первый вопрос в любом предмете, чтобы начать копить XP
          </p>
        </div>
      )}

    </main>
  );
}
