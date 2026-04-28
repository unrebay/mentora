import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import AnalyticsShareCard from "@/components/AnalyticsShareCard";

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

const SUBJECT_COLORS: Record<string, string> = {
  "russian-history": "#e05252", "world-history": "#c0724a",
  mathematics: "#4561E8", physics: "#3b82f6", chemistry: "#0EA5E9",
  biology: "#10B981", literature: "#8B5CF6", geography: "#22c55e",
  english: "#6366f1", "russian-language": "#f59e0b",
  "social-studies": "#ec4899", "computer-science": "#06b6d4",
  astronomy: "#9F7AFF",
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

  // ── Fetch user progress ──────────────────────────────────────────────────────
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("subject, xp_total, streak_days, best_streak")
    .eq("user_id", user.id);

  const totalXP        = progressRows?.reduce((s, r) => s + (r.xp_total ?? 0), 0) ?? 0;
  const maxStreak      = progressRows?.reduce((m, r) => Math.max(m, r.streak_days ?? 0), 0) ?? 0;
  const bestStreak     = progressRows?.reduce((m, r) => Math.max(m, r.best_streak ?? 0), 0) ?? 0;
  const activeSubjects = progressRows?.filter(r => r.xp_total > 0).length ?? 0;

  // ── Total messages ───────────────────────────────────────────────────────────
  const { count: totalMessages } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user");

  // ── Activity last 8 days ─────────────────────────────────────────────────────
  const eightDaysAgo = new Date(Date.now() - 8 * 86400_000).toISOString();
  const { data: recentMsgs } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", eightDaysAgo);

  const activityByDay: Record<string, number> = {};
  for (let i = 7; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    activityByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const m of recentMsgs ?? []) {
    const day = m.created_at.slice(0, 10);
    if (day in activityByDay) activityByDay[day]++;
  }

  // ── Global rank ──────────────────────────────────────────────────────────────
  const { data: rankData } = await supabase.rpc("get_user_global_rank", {
    p_user_id: user.id,
  }).maybeSingle() as { data: { rank: number; total: number } | null };

  const globalRank = rankData?.rank  ?? null;
  const totalUsers = rankData?.total ?? null;

  // ── Top subjects ─────────────────────────────────────────────────────────────
  const topSubjects = [...(progressRows ?? [])]
    .filter(r => r.xp_total > 0)
    .sort((a, b) => b.xp_total - a.xp_total)
    .map(r => ({
      ...r,
      label: SUBJECTS.find(s => s.id === r.subject)?.title ?? r.subject,
      level: getLevelName(r.xp_total),
      color: SUBJECT_COLORS[r.subject] ?? "#4561E8",
    }));

  const overallLevel = getLevelName(totalXP);
  const nextLevel    = XP_LEVELS.find(l => l.minXP > totalXP);
  const prevLevel    = [...XP_LEVELS].reverse().find(l => totalXP >= l.minXP)!;
  const xpProgress   = nextLevel
    ? Math.round(((totalXP - prevLevel.minXP) / (nextLevel.minXP - prevLevel.minXP)) * 100)
    : 100;

  // ── Invite links ─────────────────────────────────────────────────────────────
  const sbClient = await createClient();
  const { data: invites } = await sbClient
    .from("analytics_invites")
    .select("*")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  const days = Object.entries(activityByDay);
  const maxDay = Math.max(...days.map(d => d[1]), 1);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Моя аналитика</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Личная статистика · обновляется в реальном времени
          </p>
        </div>
        {globalRank && (
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-black" style={{ color: "var(--brand)", lineHeight: 1 }}>#{globalRank}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>из {totalUsers}</div>
          </div>
        )}
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Суммарный XP", value: totalXP.toLocaleString("ru-RU"),          color: "#4561E8",  icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
          { label: "Стрик",        value: `${maxStreak} дн.`,                        color: "#FF7A00",  icon: "M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" },
          { label: "Сообщений",    value: (totalMessages ?? 0).toLocaleString("ru-RU"), color: "#10B981", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
          { label: "Предметов",    value: `${activeSubjects} из 14`,                 color: "#9F7AFF",  icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
        ].map(stat => (
          <div key={stat.label}
            className="rounded-2xl p-4 border flex flex-col gap-2"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18` }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill={stat.color}><path d={stat.icon}/></svg>
            </div>
            <div className="font-black text-xl" style={{ color: "var(--text)" }}>{stat.value}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Level progress bar ───────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${LEVEL_COLOR[overallLevel]}18`, border: `1px solid ${LEVEL_COLOR[overallLevel]}30` }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={LEVEL_COLOR[overallLevel]} strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: "var(--text)" }}>{overallLevel}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{totalXP} XP</div>
            </div>
          </div>
          {nextLevel && (
            <div className="text-right">
              <div className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Следующий</div>
              <div className="text-xs font-bold" style={{ color: LEVEL_COLOR[nextLevel.name] ?? "var(--text)" }}>{nextLevel.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>через {nextLevel.minXP - totalXP} XP</div>
            </div>
          )}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpProgress}%`, background: `linear-gradient(90deg, ${LEVEL_COLOR[overallLevel]}, ${LEVEL_COLOR[overallLevel]}aa)` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{prevLevel.minXP} XP</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{nextLevel?.minXP ?? "MAX"} XP</span>
        </div>
      </div>

      {/* ── Activity chart ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Активность</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>последние 8 дней</span>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {days.map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${new Date(day + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}: ${count} сообщ.`}>
              <div className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${Math.max((count / maxDay) * 100, count > 0 ? 12 : 4)}%`,
                  background: count > 0 ? `linear-gradient(180deg, #6B8FFF, #4561E8)` : "var(--bg-secondary)",
                  opacity: count > 0 ? 0.55 + (count / maxDay) * 0.45 : 0.4,
                  minHeight: 4,
                }} />
              <span className="text-[9px] leading-none" style={{ color: "var(--text-muted)" }}>
                {new Date(day + "T12:00:00").getDate()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top subjects ────────────────────────────────────────────────────── */}
      {topSubjects.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="px-5 pt-5 pb-1 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wide" style={{ color: "var(--text)" }}>По предметам</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{topSubjects.length} активных</span>
          </div>
          <div className="px-5 pb-4 mt-3 space-y-3">
            {topSubjects.map((s, i) => {
              const maxXP = topSubjects[0].xp_total;
              return (
                <div key={s.subject} className="flex items-center gap-3">
                  <div className="w-5 text-center flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color: i === 0 ? "#f59e0b" : "var(--text-muted)" }}>{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{s.label}</span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${s.color}18`, color: s.color }}>{s.level}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{s.xp_total} XP</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (s.xp_total / maxXP) * 100)}%`, background: `linear-gradient(90deg, ${s.color}cc, ${s.color})` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Best streak badge ────────────────────────────────────────────────── */}
      {bestStreak > 0 && (
        <div className="rounded-2xl p-4 border flex items-center gap-4"
          style={{ background: "rgba(255,122,0,0.06)", borderColor: "rgba(255,122,0,0.2)" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,122,0,0.12)", border: "1px solid rgba(255,122,0,0.25)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF7A00">
              <path d="M13 2C13 2 8.5 7 8.5 11.5c0 1.5.5 2.8 1.3 3.8C9.3 14.5 9 13.5 9 12.5c0-2 1.5-4 3-5 0 1.5.5 3 1.5 4 .5-1 .5-2 .5-3 1 1.5 1.5 3 1.5 4.5 0 2.5-2 4.5-4.5 4.5S6.5 15.5 6.5 13C6.5 7.5 13 2 13 2z"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "#FF7A00" }}>Лучший стрик: {bestStreak} дней</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {bestStreak >= 30 ? "Легендарное достижение" : bestStreak >= 14 ? "Потрясающая настойчивость" : bestStreak >= 7 ? "Отличная привычка" : `До недели: ещё ${7 - bestStreak} дн.`}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {topSubjects.length === 0 && (
        <div className="text-center py-14 rounded-2xl border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="font-bold mb-2" style={{ color: "var(--text)" }}>Начни учиться — появится статистика</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Задай первый вопрос в любом предмете, чтобы начать копить XP
          </p>
        </div>
      )}

      {/* ── Share card ──────────────────────────────────────────────────────── */}
      <AnalyticsShareCard initialInvites={invites ?? []} />

    </main>
  );
}
