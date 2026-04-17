import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SUBJECTS } from "@/lib/types";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";

export const metadata = { title: "Мой прогресс — Mentora" };

function pluralDays(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "дней";
  if (m10 === 1) return "день";
  if (m10 >= 2 && m10 <= 4) return "дня";
  return "дней";
}
function pluralMsg(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "сообщений";
  if (m10 === 1) return "сообщение";
  if (m10 >= 2 && m10 <= 4) return "сообщения";
  return "сообщений";
}

const XP_LEVELS = [
  { name: "Новичок", minXP: 0, maxXP: 100 },
  { name: "Исследователь", minXP: 100, maxXP: 300 },
  { name: "Знаток", minXP: 300, maxXP: 600 },
  { name: "Историк", minXP: 600, maxXP: 1000 },
  { name: "Эксперт", minXP: 1000, maxXP: Infinity },
];

function getLevel(xp: number) {
  const level = XP_LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? XP_LEVELS[0];
  const idx = XP_LEVELS.indexOf(level);
  const next = XP_LEVELS[idx + 1];
  const progress = next ? Math.min(100, Math.round(((xp - level.minXP) / (next.minXP - level.minXP)) * 100)) : 100;
  return { ...level, idx, next, progress };
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("subject, xp_total, streak_days, last_active_at")
    .eq("user_id", user.id)
    .order("xp_total", { ascending: false });

  const { data: msgRows } = await supabase
    .from("chat_messages")
    .select("subject")
    .eq("user_id", user.id)
    .eq("role", "user");

  const { data: recentMsgs } = await supabase
    .from("chat_messages")
    .select("subject, content, created_at, role")
    .eq("user_id", user.id)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(8);

  const msgCountBySubject: Record<string, number> = {};
  for (const m of msgRows ?? []) {
    msgCountBySubject[m.subject] = (msgCountBySubject[m.subject] ?? 0) + 1;
  }

  const totalXP = progressRows?.reduce((s, p) => s + (p.xp_total ?? 0), 0) ?? 0;
  const maxStreak = progressRows?.reduce((m, p) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const totalMessages = msgRows?.length ?? 0;
  const activeSubjects = progressRows?.filter(p => (p.xp_total ?? 0) > 0) ?? [];

  const subjectStats = activeSubjects.map(p => {
    const meta = SUBJECTS.find(s => s.id === p.subject);
    const lastActive = p.last_active_at ? new Date(p.last_active_at) : null;
    const daysSince = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86400000) : null;
    const lvl = getLevel(p.xp_total ?? 0);
    return {
      id: p.subject,
      title: meta?.title ?? p.subject,
      xp: p.xp_total ?? 0,
      streak: p.streak_days ?? 0,
      messages: msgCountBySubject[p.subject] ?? 0,
      daysSince,
      lastActive,
      lvl,
    };
  });

  function relTime(d: Date | null): string {
    if (!d) return "";
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days === 0) return "сегодня";
    if (days === 1) return "вчера";
    if (days < 7) return `${days} ${pluralDays(days)} назад`;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }

  const topSubject = subjectStats[0];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-3 backdrop-blur-md sticky top-0 z-10"
        style={{ borderColor: "var(--border-light)", background: "var(--bg-nav)" }}>
        <Link href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors rounded-lg px-2.5 py-1.5"
          style={{ color: "var(--text-muted)", background: "var(--bg-secondary)" }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          Библиотека
        </Link>
        <h1 className="font-bold flex-1" style={{
          background: "linear-gradient(120deg, var(--text) 0%, var(--text-secondary) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Мой прогресс
        </h1>
        <Link href="/profile"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--brand)" }}>
          Профиль →
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* ── Summary stats ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Всего ментов",
              value: totalXP.toLocaleString("ru-RU"),
              icon: (
                <span style={{ fontFamily: "Georgia,serif", color: "#6B8FFF", fontStyle: "italic", fontWeight: 700, fontSize: "1.2rem", lineHeight: 1 }}>е</span>
              ),
              accent: "#6B8FFF",
            },
            {
              label: "Макс. стрик",
              value: `${maxStreak}д`,
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#FF7A00" />
                </svg>
              ),
              accent: "#FF7A00",
            },
            {
              label: "Вопросов",
              value: totalMessages.toLocaleString("ru-RU"),
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M7.5 8h9M7.5 12h6M3 10.5a7.5 7.5 0 1 0 13.3 4.7L19.5 18l-2.7-2.8A7.5 7.5 0 1 0 3 10.5z" />
                </svg>
              ),
              accent: "#10B981",
            },
          ].map(stat => (
            <div key={stat.label}
              className="rounded-2xl p-4 border flex flex-col items-center text-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                style={{ background: `${stat.accent}18` }}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Top subject highlight ──────────────────────────── */}
        {topSubject && (
          <div className="rounded-2xl overflow-hidden border"
            style={{
              background: `linear-gradient(135deg, ${subjectColor(topSubject.id)}22, ${subjectColor(topSubject.id)}08)`,
              borderColor: `${subjectColor(topSubject.id)}30`,
            }}
          >
            <div className="p-5 flex items-center gap-4">
              <SubjectIcon id={topSubject.id} size={52} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: subjectColor(topSubject.id) }}>
                  Главный предмет
                </p>
                <p className="font-bold text-base" style={{ color: "var(--text)" }}>{topSubject.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {topSubject.xp} ментов · {topSubject.lvl.name}
                </p>
                {/* XP bar */}
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${topSubject.lvl.progress}%`, background: `linear-gradient(90deg, ${subjectColor(topSubject.id)}cc, ${subjectColor(topSubject.id)})` }} />
                </div>
              </div>
              <Link href={`/learn/${topSubject.id}`}
                className="btn-glow shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white">
                Учиться →
              </Link>
            </div>
          </div>
        )}

        {/* ── Per-subject breakdown ──────────────────────────── */}
        {subjectStats.length > 0 ? (
          <div>
            <h2 className="text-xs font-bold tracking-[0.18em] uppercase mb-4" style={{ color: "var(--text-muted)" }}>
              По предметам
            </h2>
            <div className="space-y-2.5">
              {subjectStats.map(s => (
                <div key={s.id}
                  className="rounded-2xl border overflow-hidden transition-all duration-200 group"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Colored left accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl hidden"
                      style={{ background: subjectColor(s.id) }} />
                    <SubjectIcon id={s.id} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{s.title}</span>
                        {s.daysSince !== null && (
                          <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{relTime(s.lastActive)}</span>
                        )}
                      </div>
                      {/* Mini XP bar */}
                      <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: "var(--bg-secondary)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${s.lvl.progress}%`, background: `linear-gradient(90deg, ${subjectColor(s.id)}aa, ${subjectColor(s.id)})` }} />
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span style={{ color: subjectColor(s.id) }} className="font-semibold">{s.xp} ментов</span>
                        <span>·</span>
                        <span>{s.messages} {pluralMsg(s.messages)}</span>
                        {s.streak > 0 && (
                          <><span>·</span>
                          <span style={{ color: "#FF7A00" }}>🔥 {s.streak} {pluralDays(s.streak)}</span></>
                        )}
                      </div>
                    </div>
                    <Link href={`/learn/${s.id}`}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all text-white"
                      style={{ background: subjectColor(s.id) }}>
                      →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
              style={{ background: "rgba(69,97,232,0.08)", border: "1px solid rgba(69,97,232,0.15)" }}>
              <SubjectIcon id="discovery" size={48} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Пока нет данных</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Начни учиться — здесь появится твой прогресс
            </p>
            <Link href="/dashboard" className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white">
              К предметам →
            </Link>
          </div>
        )}

        {/* ── Recent activity ────────────────────────────────── */}
        {recentMsgs && recentMsgs.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-[0.18em] uppercase mb-4" style={{ color: "var(--text-muted)" }}>
              Недавние вопросы
            </h2>
            <div className="space-y-2">
              {recentMsgs.map((msg, i) => {
                const meta = SUBJECTS.find(s => s.id === msg.subject);
                const preview = msg.content.length > 85 ? msg.content.slice(0, 85) + "…" : msg.content;
                const when = new Date(msg.created_at);
                const color = subjectColor(msg.subject);
                return (
                  <Link key={i} href={`/learn/${msg.subject}`}
                    className="flex items-start gap-3 rounded-xl border px-4 py-3 transition-all hover:scale-[1.005] block"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)", borderLeft: `3px solid ${color}` }}
                  >
                    <SubjectIcon id={msg.subject} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug" style={{ color: "var(--text)" }}>{preview}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {meta?.title ?? msg.subject} · {relTime(when)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
