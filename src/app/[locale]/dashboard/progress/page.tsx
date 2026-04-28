import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import StatCard, { MentIcon, FlameIcon, MessageIcon, StarIcon } from "@/components/StatCard";
import ProgressClient from "@/components/ProgressClient";

export const metadata = { title: "Мой прогресс — Mentora" };

function pluralMenty(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "мент";
  if (m10 === 1) return "мента";
  if (m10 >= 2 && m10 <= 4) return "менты";
  return "мент";
}

const XP_LEVELS = [
  { name: "Новичок",    minXP: 0,    maxXP: 100 },
  { name: "Исследователь", minXP: 100,  maxXP: 300 },
  { name: "Знаток",    minXP: 300,  maxXP: 600 },
  { name: "Историк",   minXP: 600,  maxXP: 1000 },
  { name: "Эксперт",   minXP: 1000, maxXP: Infinity },
];

function getLevel(xp: number) {
  const level = XP_LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? XP_LEVELS[0];
  const idx = XP_LEVELS.indexOf(level);
  const next = XP_LEVELS[idx + 1];
  const progress = next
    ? Math.min(100, Math.round(((xp - level.minXP) / (next.minXP - level.minXP)) * 100))
    : 100;
  return { ...level, idx, next: next ?? null, progress };
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // ── User progress per subject ──────────────────────────────────────────────
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("subject, xp_total, streak_days, best_streak, last_active_at")
    .eq("user_id", user.id)
    .order("last_active_at", { ascending: false, nullsFirst: false });

  // ── All user messages (for counts per subject + recent list) ───────────────
  const { data: msgRows } = await supabase
    .from("chat_messages")
    .select("subject")
    .eq("user_id", user.id)
    .eq("role", "user");

  const { data: recentMsgs } = await supabase
    .from("chat_messages")
    .select("subject, content, created_at")
    .eq("user_id", user.id)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(20);

  // ── 7-day activity (last 7 calendar days) ─────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: activityData } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", sevenDaysAgo);

  // Build current ISO week Mon–Sun (Russian format starts Monday)
  const countByDate: Record<string, number> = {};
  for (const row of activityData ?? []) {
    const d = row.created_at.slice(0, 10);
    countByDate[d] = (countByDate[d] ?? 0) + 1;
  }
  const nowDate = new Date();
  const dowToday = (nowDate.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(nowDate);
  monday.setDate(monday.getDate() - dowToday);
  const activityDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: countByDate[key] ?? 0 };
  });

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const msgCountBySubject: Record<string, number> = {};
  for (const m of msgRows ?? []) {
    msgCountBySubject[m.subject] = (msgCountBySubject[m.subject] ?? 0) + 1;
  }

  const totalXP       = progressRows?.reduce((s, p) => s + (p.xp_total ?? 0), 0) ?? 0;
  const currentStreak = progressRows?.reduce((m, p) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const bestStreak    = progressRows?.reduce((m, p) => Math.max(m, p.best_streak ?? p.streak_days ?? 0), 0) ?? 0;
  const totalMessages = msgRows?.length ?? 0;

  // Badge count — mirror profile logic
  const BADGE_CHECKS = [
    (m: number, _b: number, _x: number) => m >= 1,
    (m: number, _b: number, _x: number) => m >= 50,
    (m: number, _b: number, _x: number) => m >= 200,
    (m: number, _b: number, _x: number) => m >= 500,
    (_m: number, b: number, _x: number) => b >= 3,
    (_m: number, b: number, _x: number) => b >= 7,
    (_m: number, b: number, _x: number) => b >= 30,
    (_m: number, _b: number, x: number) => x >= 100,
    (_m: number, _b: number, x: number) => x >= 500,
    (_m: number, _b: number, x: number) => x >= 1000,
  ];
  const earnedBadges = BADGE_CHECKS.filter(fn => fn(totalMessages, bestStreak, totalXP)).length;

  // ── Subject stats for client component ────────────────────────────────────
  const activeSubjects = (progressRows ?? []).filter(p => (p.xp_total ?? 0) > 0);

  const subjectStats = activeSubjects.map(p => {
    const meta = SUBJECTS.find(s => s.id === p.subject);
    const lvl  = getLevel(p.xp_total ?? 0);
    return {
      id:         p.subject,
      title:      meta?.title ?? p.subject,
      xp:         p.xp_total ?? 0,
      streak:     p.streak_days ?? 0,
      messages:   msgCountBySubject[p.subject] ?? 0,
      lastActive: p.last_active_at ?? null,
      lvl: {
        name:    lvl.name,
        progress: lvl.progress,
        idx:     lvl.idx,
        nextXP:  lvl.next?.minXP ?? null,
      },
    };
  });

  // ── Recent messages for client component ───────────────────────────────────
  const recentMsgsMapped = (recentMsgs ?? []).map(m => ({
    subject:      m.subject,
    subjectTitle: SUBJECTS.find(s => s.id === m.subject)?.title ?? m.subject,
    content:      m.content,
    created_at:   m.created_at,
  }));

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* ── Summary stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Мент"         value={totalXP}       icon={<MentIcon />}    accent="var(--brand)" isBrand />
          <StatCard label="Стрик сейчас" value={currentStreak} icon={<FlameIcon />}   accent="#FF7A00" />
          <StatCard label="Сообщений"    value={totalMessages} icon={<MessageIcon />} accent="#10B981" />
          <StatCard label="Достижений"   value={earnedBadges}  icon={<StarIcon />}    accent="#f59e0b" />
        </div>

        {/* ── Interactive sections (activity, charts, subject list, questions) */}
        {subjectStats.length > 0 ? (
          <ProgressClient
            subjectStats={subjectStats}
            recentMsgs={recentMsgsMapped}
            activityDays={activityDays}
          />
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
              style={{ background: "rgba(69,97,232,0.08)", border: "1px solid rgba(69,97,232,0.15)" }}>
              <span style={{ fontSize: 40 }}>📚</span>
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Пока нет данных</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Начни учиться — здесь появится твой прогресс
            </p>
            <a href="/dashboard" className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white">
              К предметам →
            </a>
          </div>
        )}

      </div>
    </main>
  );
}
