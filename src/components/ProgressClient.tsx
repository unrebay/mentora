"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubjectStatClient {
  id: string;
  title: string;
  xp: number;
  streak: number;
  messages: number;
  lastActive: string | null; // ISO
  lvl: { name: string; progress: number; idx: number; nextXP: number | null };
}

export interface RecentMsgClient {
  subject: string;
  subjectTitle: string;
  content: string;
  created_at: string;
}

export interface ActivityDayClient {
  date: string;   // YYYY-MM-DD
  count: number;
}

interface Props {
  subjectStats: SubjectStatClient[];
  recentMsgs: RecentMsgClient[];
  activityDays: ActivityDayClient[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function FlameIcon({ size = 13, color = "#FF7A00" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle" }}>
      <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill={color} />
      <path d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z" fill="rgba(255,200,80,0.8)" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s ease", flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

type TFn = ReturnType<typeof useTranslations<"progress">>;

function relTime(iso: string | null, locale: string, t: TFn): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return t("today");
  if (days === 1) return t("yesterday");
  if (days < 7) return t("daysAgo", { count: days });
  const dtLocale = locale === "en" ? "en-US" : "ru-RU";
  return new Date(iso).toLocaleDateString(dtLocale, { day: "numeric", month: "short" });
}

// ── Weekly activity strip ─────────────────────────────────────────────────────

function WeeklyActivity({ days }: { days: ActivityDayClient[] }) {
  const t = useTranslations("progress");
  const today = new Date().toISOString().slice(0, 10);
  const DAY_NAMES = [
    t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"),
    t("dayFri"), t("daySat"), t("daySun"),
  ];
  const totalThisWeek = days.reduce((s, d) => s + d.count, 0);
  const activeDays = days.filter(d => d.count > 0).length;

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "var(--text-muted)" }}>
          {t("weeklyActivity")}
        </p>
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {activeDays}/7 {activeDays === 7 ? t("qualityPerfect") : activeDays >= 5 ? t("qualityGreat") : ""}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
        {days.map(day => {
          const d = new Date(day.date + "T12:00:00");
          const dow = (d.getDay() + 6) % 7;
          const isToday = day.date === today;
          const active = day.count > 0;
          const alpha = active ? Math.min(0.85, 0.35 + (day.count / 12) * 0.5) : 0;

          return (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 10,
                background: active
                  ? `rgba(69,97,232,${alpha})`
                  : "var(--bg-secondary)",
                border: isToday
                  ? "2px solid rgba(69,97,232,0.75)"
                  : active
                  ? "1px solid rgba(69,97,232,0.35)"
                  : "1px solid var(--border)",
                boxShadow: active ? `0 2px 12px rgba(69,97,232,${alpha * 0.45}), inset 0 1px 0 rgba(255,255,255,0.15)` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}>
                {active && <FlameIcon size={Math.min(18, 10 + day.count)} color="rgba(255,190,60,0.95)" />}
              </div>
              <span style={{
                fontSize: 10,
                color: isToday ? "rgba(69,97,232,0.9)" : "var(--text-muted)",
                fontWeight: isToday ? 700 : 400,
              }}>
                {DAY_NAMES[dow]}
              </span>
              {active && (
                <span style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1 }}>{day.count}</span>
              )}
            </div>
          );
        })}
      </div>
      {totalThisWeek > 0 && (
        <p className="mt-3 text-xs text-center" style={{ color: "var(--text-muted)" }}>
          {t("questionsThisWeek", { count: totalThisWeek })}
        </p>
      )}
    </div>
  );
}

// ── Glass 3D bar chart ────────────────────────────────────────────────────────

function XPBarChart({ subjects }: { subjects: SubjectStatClient[] }) {
  const t = useTranslations("progress");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  const maxXP = Math.max(...subjects.map(s => s.xp), 1);
  const MAX_H = 130;

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <p className="text-xs font-bold tracking-[0.18em] uppercase mb-5" style={{ color: "var(--text-muted)" }}>
        {t("mentBySubject")}
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, minHeight: MAX_H + 64 }}>
        {subjects.map(s => {
          const color = subjectColor(s.id);
          const barH = mounted ? Math.max(14, Math.round((s.xp / maxXP) * MAX_H)) : 0;

          return (
            <Link
              key={s.id}
              href={`/learn/${s.id}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}
            >
              {/* XP label above bar */}
              <span style={{
                fontSize: 10, fontWeight: 700, color,
                opacity: mounted ? 1 : 0,
                transition: "opacity 0.5s ease 0.4s",
                minHeight: 14,
                display: "flex", alignItems: "flex-end",
              }}>
                {s.xp}
              </span>

              {/* 3D glass bar */}
              <div style={{
                width: "100%",
                height: barH,
                position: "relative",
                background: `linear-gradient(180deg, ${color}60 0%, ${color}28 80%, ${color}15 100%)`,
                border: `1px solid ${color}50`,
                borderBottom: `3px solid ${color}75`,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: [
                  `0 6px 20px ${color}30`,
                  `inset 0 1px 0 rgba(255,255,255,0.25)`,
                  `4px 6px 0 rgba(0,0,0,0.07)`,
                ].join(", "),
                borderRadius: "7px 7px 3px 3px",
                transition: "height 1s cubic-bezier(0.34,1.15,0.64,1)",
                overflow: "hidden",
              }}>
                {/* Top shine */}
                <div style={{
                  position: "absolute", top: 3, left: 5, right: 5, height: 4,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
                  borderRadius: "4px 4px 0 0",
                }} />
                {/* Level pill inside bar (only if bar is tall enough) */}
                {barH > 40 && (
                  <div style={{
                    position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
                    fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.8)",
                    background: "rgba(0,0,0,0.15)", borderRadius: 4, padding: "1px 4px",
                    whiteSpace: "nowrap",
                  }}>
                    {s.lvl.name}
                  </div>
                )}
              </div>

              {/* Subject icon */}
              <SubjectIcon id={s.id} size={22} />

              {/* Short subject name */}
              <span style={{
                fontSize: 9, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2,
                maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {s.title.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Subject detail list ───────────────────────────────────────────────────────

function SubjectCards({ subjects }: { subjects: SubjectStatClient[] }) {
  const t = useTranslations("progress");
  const locale = useLocale();

  return (
    <div>
      <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: "var(--text-muted)" }}>
        {t("bySubject")}
      </p>
      <div className="space-y-2">
        {subjects.map(s => {
          const color = subjectColor(s.id);
          const xpToNext = s.lvl.nextXP !== null ? s.lvl.nextXP - s.xp : null;

          return (
            <div
              key={s.id}
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div className="flex items-center gap-3 p-3.5">
                <SubjectIcon id={s.id} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{s.title}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                      >
                        {s.lvl.name}
                      </span>
                    </div>
                    <span className="text-xs shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                      {relTime(s.lastActive, locale, t)}
                    </span>
                  </div>

                  {/* XP progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: "var(--bg-secondary)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.lvl.progress}%`, background: `linear-gradient(90deg, ${color}bb, ${color})` }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span style={{ color, fontWeight: 600 }}>{s.xp} {t("xpUnit")}</span>
                    <span>·</span>
                    <span>{s.messages} {t("questUnit")}</span>
                    {s.streak > 0 && (
                      <>
                        <span>·</span>
                        <span style={{ color: "#FF7A00", display: "flex", alignItems: "center", gap: 3 }}>
                          <FlameIcon size={11} />
                          {s.streak} {t("dayUnit")}
                        </span>
                      </>
                    )}
                    {xpToNext !== null && xpToNext > 0 && (
                      <>
                        <span>·</span>
                        <span>{xpToNext} {t("toLevelUnit")}</span>
                      </>
                    )}
                  </div>
                </div>

                <Link
                  href={`/learn/${s.id}`}
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: color }}
                >
                  →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent questions (collapsible) ────────────────────────────────────────────

function RecentQuestions({ msgs }: { msgs: RecentMsgClient[] }) {
  const t = useTranslations("progress");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  if (msgs.length === 0) return null;

  const INITIAL = 3;
  const visible = open ? msgs : msgs.slice(0, INITIAL);
  const hidden = msgs.length - INITIAL;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ color: "var(--text-muted)", cursor: "pointer" }}
      >
        <span className="text-xs font-bold tracking-[0.18em] uppercase">
          {t("recentQuestions")}
          <span className="ml-2 font-normal normal-case" style={{ fontSize: 11 }}>
            ({msgs.length})
          </span>
        </span>
        <ChevronIcon open={open} />
      </button>

      {/* Messages */}
      <div>
        {visible.map((msg, i) => {
          const color = subjectColor(msg.subject);
          const preview = msg.content.length > 90 ? msg.content.slice(0, 90) + "…" : msg.content;

          return (
            <Link
              key={i}
              href={`/learn/${msg.subject}`}
              className="flex items-start gap-3 px-4 py-3 border-t transition-opacity hover:opacity-75"
              style={{ borderColor: "var(--border)", textDecoration: "none", display: "flex" }}
            >
              <div style={{ width: 3, borderRadius: 2, background: color, alignSelf: "stretch", flexShrink: 0 }} />
              <SubjectIcon id={msg.subject} size={26} />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" style={{ color: "var(--text)" }}>{preview}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {msg.subjectTitle} · {relTime(msg.created_at, locale, t)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Expand / collapse button */}
      {msgs.length > INITIAL && (
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full py-3 text-xs font-semibold border-t transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--border)", color: "var(--brand)" }}
        >
          {open ? t("collapse") : t("showMore", { count: hidden })}
        </button>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ProgressClient({ subjectStats, recentMsgs, activityDays }: Props) {
  return (
    <div className="space-y-5">
      {activityDays.length > 0 && <WeeklyActivity days={activityDays} />}
      {subjectStats.length > 0 && <XPBarChart subjects={subjectStats} />}
      {subjectStats.length > 0 && <SubjectCards subjects={subjectStats} />}
      <RecentQuestions msgs={recentMsgs} />
    </div>
  );
}
