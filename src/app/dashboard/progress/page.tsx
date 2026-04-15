import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SUBJECTS } from "@/lib/types";

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

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Fetch all subject progress
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("subject, xp_total, streak_days, last_active_at")
    .eq("user_id", user.id)
    .order("xp_total", { ascending: false });

  // Fetch message counts per subject
  const { data: msgRows } = await supabase
    .from("chat_messages")
    .select("subject")
    .eq("user_id", user.id)
    .eq("role", "user");

  // Fetch last 8 messages for recent activity
  const { data: recentMsgs } = await supabase
    .from("chat_messages")
    .select("subject, content, created_at, role")
    .eq("user_id", user.id)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(8);

  // Build message count map
  const msgCountBySubject: Record<string, number> = {};
  for (const m of msgRows ?? []) {
    msgCountBySubject[m.subject] = (msgCountBySubject[m.subject] ?? 0) + 1;
  }

  const totalXP = progressRows?.reduce((s, p) => s + (p.xp_total ?? 0), 0) ?? 0;
  const maxStreak = progressRows?.reduce((m, p) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const totalMessages = msgRows?.length ?? 0;
  const activeSubjects = progressRows?.filter(p => (p.xp_total ?? 0) > 0) ?? [];

  // Merge progress with subject metadata
  const subjectStats = activeSubjects.map(p => {
    const meta = SUBJECTS.find(s => s.id === p.subject);
    const lastActive = p.last_active_at ? new Date(p.last_active_at) : null;
    const daysSince = lastActive
      ? Math.floor((Date.now() - lastActive.getTime()) / 86400000)
      : null;
    return {
      id: p.subject,
      title: meta?.title ?? p.subject,
      emoji: meta?.emoji ?? "📚",
      xp: p.xp_total ?? 0,
      streak: p.streak_days ?? 0,
      messages: msgCountBySubject[p.subject] ?? 0,
      daysSince,
      lastActive,
    };
  });

  // Format relative time
  function relTime(d: Date | null): string {
    if (!d) return "";
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days === 0) return "сегодня";
    if (days === 1) return "вчера";
    if (days < 7) return `${days} ${pluralDays(days)} назад`;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-4" style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
        <Link href="/dashboard" className="text-sm t-muted hover:t-primary transition-colors">← Библиотека</Link>
        <h1 className="font-bold text-lg flex-1">Мой прогресс</h1>
        <Link href="/profile" className="text-sm t-muted hover:t-primary transition-colors">Профиль →</Link>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* Overall stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Всего ментов", value: totalXP.toLocaleString("ru-RU"), icon: "✦" },
            { label: "Макс. стрик", value: `${maxStreak} ${pluralDays(maxStreak)}`, icon: "🔥" },
            { label: "Вопросов задано", value: totalMessages.toLocaleString("ru-RU"), icon: "💬" },
          ].map(stat => (
            <div key={stat.label} className="s-raised rounded-2xl p-4 text-center border" style={{ borderColor: "var(--border-light)" }}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold t-primary">{stat.value}</div>
              <div className="text-xs t-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Per-subject breakdown */}
        {subjectStats.length > 0 ? (
          <div>
            <h2 className="text-sm font-semibold t-muted uppercase tracking-wide mb-3">По предметам</h2>
            <div className="space-y-3">
              {subjectStats.map(s => (
                <div key={s.id} className="s-raised rounded-2xl border p-4" style={{ borderColor: "var(--border-light)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold t-primary text-sm">{s.title}</span>
                        {s.daysSince !== null && (
                          <span className="text-xs t-muted shrink-0">{relTime(s.lastActive)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs t-secondary">
                        <span>✦ {s.xp} мент</span>
                        <span>💬 {s.messages} {pluralMsg(s.messages)}</span>
                        {s.streak > 0 && <span>🔥 {s.streak} {pluralDays(s.streak)}</span>}
                      </div>
                    </div>
                    <Link
                      href={`/learn/${s.id}`}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl text-white transition-colors"
                      style={{ background: "var(--brand)" }}
                    >
                      Продолжить
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 t-muted">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm">Ещё нет данных о прогрессе.<br />Начни учиться — здесь появится твоя история.</p>
            <Link href="/dashboard" className="inline-block mt-4 px-4 py-2 text-sm font-semibold rounded-xl text-white" style={{ background: "var(--brand)" }}>
              К предметам
            </Link>
          </div>
        )}

        {/* Recent activity */}
        {recentMsgs && recentMsgs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold t-muted uppercase tracking-wide mb-3">Недавние вопросы</h2>
            <div className="space-y-2">
              {recentMsgs.map((msg, i) => {
                const meta = SUBJECTS.find(s => s.id === msg.subject);
                const preview = msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content;
                const when = new Date(msg.created_at);
                return (
                  <div key={i} className="flex items-start gap-3 s-raised rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-light)" }}>
                    <span className="text-base shrink-0 mt-0.5">{meta?.emoji ?? "📚"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm t-primary leading-snug">{preview}</p>
                      <p className="text-xs t-muted mt-0.5">{meta?.title ?? msg.subject} · {relTime(when)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
