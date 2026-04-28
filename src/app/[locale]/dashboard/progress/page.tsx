import React from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import StatCard, { MentIcon, FlameIcon, MessageIcon, StarIcon } from "@/components/StatCard";
import ProgressClient from "@/components/ProgressClient";

export async function generateMetadata() {
  const t = await getTranslations("progress");
  return { title: t("pageTitle") };
}

const XP_THRESHOLDS = [
  { key: "levelBeginner",  minXP: 0,    maxXP: 100 },
  { key: "levelExplorer",  minXP: 100,  maxXP: 300 },
  { key: "levelScholar",   minXP: 300,  maxXP: 600 },
  { key: "levelHistorian", minXP: 600,  maxXP: 1000 },
  { key: "levelExpert",    minXP: 1000, maxXP: Infinity },
];

function getLevelData(xp: number) {
  const level = XP_THRESHOLDS.slice().reverse().find((l) => xp >= l.minXP) ?? XP_THRESHOLDS[0];
  const idx = XP_THRESHOLDS.indexOf(level);
  const next = XP_THRESHOLDS[idx + 1];
  const progress = next
    ? Math.min(100, Math.round(((xp - level.minXP) / (next.minXP - level.minXP)) * 100))
    : 100;
  return { key: level.key, idx, nextXP: next?.minXP ?? null, progress };
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const t = await getTranslations("progress");
  const tSubjects = await getTranslations("subjects");

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

  // Build current ISO week Mon–Sun
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

  // Badge count
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
    const lvlData = getLevelData(p.xp_total ?? 0);
    // Use translated subject title if available, fallback to SUBJECTS title, then id
    const subjectTitle: string = tSubjects(`${p.subject}.title` as never) ?? meta?.title ?? p.subject;
    return {
      id:         p.subject,
      title:      subjectTitle,
      xp:         p.xp_total ?? 0,
      streak:     p.streak_days ?? 0,
      messages:   msgCountBySubject[p.subject] ?? 0,
      lastActive: p.last_active_at ?? null,
      lvl: {
        name:     t(lvlData.key as never),
        progress: lvlData.progress,
        idx:      lvlData.idx,
        nextXP:   lvlData.nextXP,
      },
    };
  });

  // ── Recent messages for client component ───────────────────────────────────
  const recentMsgsMapped = (recentMsgs ?? []).map(m => {
    const meta = SUBJECTS.find(s => s.id === m.subject);
    const subjectTitle: string = tSubjects(`${m.subject}.title` as never) ?? meta?.title ?? m.subject;
    return {
      subject:      m.subject,
      subjectTitle,
      content:      m.content,
      created_at:   m.created_at,
    };
  });

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* ── Summary stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t("statXP")}       value={totalXP}       icon={<MentIcon />}    accent="var(--brand)" isBrand />
          <StatCard label={t("statStreak")}   value={currentStreak} icon={<FlameIcon />}   accent="#FF7A00" />
          <StatCard label={t("statMessages")} value={totalMessages} icon={<MessageIcon />} accent="#10B981" />
          <StatCard label={t("statBadges")}   value={earnedBadges}  icon={<StarIcon />}    accent="#f59e0b" />
        </div>

        {/* ── Interactive sections ──────────────────────────────────────── */}
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
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>{t("emptyTitle")}</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              {t("emptyDesc")}
            </p>
            <a href="/dashboard" className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white">
              {t("emptyBtn")}
            </a>
          </div>
        )}

      </div>
    </main>
  );
}
