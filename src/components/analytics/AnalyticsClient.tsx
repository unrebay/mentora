"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";
import MeLogo from "@/components/MeLogo";
import { LEVEL_REWARDS_BY_KEY } from "@/lib/plan";
import Leaderboard from "@/components/analytics/Leaderboard";

// ── Types ────────────────────────────────────────────────────────────────────
export interface SubjectStat {
  id: string;
  title: string;
  xp: number;
  streak: number;
  messages: number;
  lastActive: string | null;
  level: { key: string; name: string; progress: number; idx: number; nextXP: number | null };
}
export interface RecentMsg {
  subject: string; subjectTitle: string; content: string; created_at: string;
}
export interface ActivityDay { date: string; count: number }
export interface BadgeItem {
  id: string; group: "volume" | "consistency" | "experience" | "mastery";
  earned: boolean; progress: number; name: string; desc: string; threshold: number; current: number;
}
export interface CareerLevel {
  key: "beginner" | "explorer" | "scholar" | "historian" | "expert" | "master" | "doctor" | "academic";
  minXP: number; name: string; desc: string;
}
interface Props {
  mySerialId?: number | null;
  totalXP: number;
  totalMessages: number;
  currentStreak: number;
  bestStreak: number;
  activeSubjectsCount: number;
  globalRank: number | null;
  totalUsers: number | null;
  weeklyDelta: { xp: number; msgs: number } | null;
  activity14d: ActivityDay[];
  subjectStats: SubjectStat[];
  recentMsgs: RecentMsg[];
  badges: BadgeItem[];
  careerLevels: CareerLevel[];
  currentLevelKey: string;
}

// ── Helper: relative time ────────────────────────────────────────────────────
function useRelTime() {
  const t = useTranslations("analytics.recent");
  const locale = useLocale();
  return (iso: string | null) => {
    if (!iso) return "";
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return t("today");
    if (days === 1) return t("yesterday");
    if (days < 7) return t("daysAgo", { count: days });
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "short" });
  };
}

// ── Sparkline (SVG, tiny trend line for KPI cards) ───────────────────────────
function Sparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const W = 100, H = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1 || 1)) * W},${H - (v / max) * H * 0.85 - H * 0.075}`).join(" ");
  const lastPt = pts.split(" ").pop()!.split(",");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, opacity: 0.85 }}>
      <defs>
        <linearGradient id={`spk-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill={`url(#spk-${color.replace("#", "")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="1.8" fill={color} />
    </svg>
  );
}

// ── KPI card with sparkline ──────────────────────────────────────────────────
function StatCard({ label, value, color, icon, iconNode, sparkData, deltaPct }: {
  label: string; value: string | number; color: string; icon?: string; iconNode?: React.ReactNode;
  sparkData?: number[]; deltaPct?: number | null;
}) {
  return (
    <div className="rounded-2xl p-4 border flex flex-col gap-2 relative overflow-hidden group transition-all hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(160deg, ${color}14, ${color}05 60%, transparent), var(--bg-card)`,
        borderColor: `${color}30`,
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px ${color}18, 0 8px 28px rgba(0,0,0,0.05)`,
      }}>
      {/* Color stripe accent on top */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.7 }} />
      {/* Spotlight in top-right */}
      <div className="absolute pointer-events-none transition-opacity duration-500" aria-hidden
        style={{ top: -30, right: -30, width: 120, height: 120, opacity: 0.5,
          background: `radial-gradient(circle at center, ${color}38, transparent 65%)`, filter: "blur(8px)" }} />
      <div className="flex items-center justify-between relative">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}10)`,
            border: `1px solid ${color}30`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 12px ${color}22`,
          }}>
          {iconNode ?? (icon && <svg viewBox="0 0 24 24" width="18" height="18" fill={color}><path d={icon} /></svg>)}
        </div>
        {deltaPct !== undefined && deltaPct !== null && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: deltaPct >= 0 ? "#10B981" : "#ef4444",
              background: deltaPct >= 0 ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
            }}>
            {deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="font-black text-2xl leading-tight relative" style={{ color: "var(--text)" }}>{value}</div>
      <div className="text-[11px] font-medium relative" style={{ color: "var(--text-muted)" }}>{label}</div>
      {sparkData && sparkData.length > 1 && (
        <div className="mt-1 -mb-1 relative">
          <Sparkline data={sparkData} color={color} height={24} />
        </div>
      )}
    </div>
  );
}

// ── Career ladder (5 levels horizontal timeline) ─────────────────────────────
function CareerLadder({ levels, totalXP, currentKey }: { levels: CareerLevel[]; totalXP: number; currentKey: string }) {
  const t = useTranslations("analytics");
  const currentIdx = levels.findIndex(l => l.key === currentKey);
  const nextIdx = currentIdx < levels.length - 1 ? currentIdx + 1 : null;
  const next = nextIdx ? levels[nextIdx] : null;
  const cur = levels[currentIdx];
  const segProgress = next
    ? Math.min(100, ((totalXP - cur.minXP) / (next.minXP - cur.minXP)) * 100)
    : 100;

  return (
    <div className="rounded-2xl p-5 border relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01) 60%, transparent), var(--bg-card)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(16px) saturate(1.3)", WebkitBackdropFilter: "blur(16px) saturate(1.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-4 relative">
        <span className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "var(--text-muted)" }}>
          {t("level.career")}
        </span>
        <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
          {totalXP.toLocaleString()}
          <MeLogo height={14} />
        </span>
      </div>
      <div className="relative" style={{ paddingTop: 4, paddingBottom: 56 }}>
        {/* Background line */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] rounded-full"
          style={{ background: "var(--border)" }} />
        {/* Progress fill */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-all duration-700"
          style={{
            width: `calc(${(currentIdx + segProgress / 100) / (levels.length - 1) * 100}% - 16px)`,
            background: "linear-gradient(90deg, #4561E8, #7C3AED, #FF7A00)",
            boxShadow: "0 0 8px rgba(124,58,237,0.6)",
          }} />
        {/* Nodes */}
        <div className="relative flex justify-between items-center">
          {levels.map((lvl, i) => {
            const passed = i < currentIdx;
            const current = i === currentIdx;
            const isPeak = i === levels.length - 1;
            return (
              <div key={lvl.key} className="flex flex-col items-center" style={{ flexShrink: 0, position: "relative" }}>
                <div className={`relative rounded-full flex items-center justify-center transition-all duration-500 ${current ? "scale-110" : ""}`}
                  style={{
                    width: current ? 26 : 18, height: current ? 26 : 18,
                    background: current
                      ? "radial-gradient(circle at 30% 30%, #8B6CF7, #4561E8 60%, #2D40A8)"
                      : passed
                      ? "linear-gradient(135deg, #4561E8, #2D40A8)"
                      : isPeak
                      ? "radial-gradient(circle at 30% 30%, rgba(255,215,80,0.55), rgba(245,158,11,0.18) 70%)"
                      : `radial-gradient(circle at 30% 30%, ${["rgba(69,97,232,0.20)","rgba(124,58,237,0.20)","rgba(159,122,255,0.20)","rgba(255,122,0,0.20)","rgba(245,158,11,0.20)","rgba(192,132,252,0.20)","rgba(6,182,212,0.20)"][i % 7]}, rgba(255,255,255,0.03) 70%)`,
                    border: current
                      ? "1.5px solid rgba(255,255,255,0.5)"
                      : passed
                      ? "1px solid rgba(124,58,237,0.4)"
                      : isPeak
                      ? "1px solid rgba(245,158,11,0.55)"
                      : `1px solid ${["rgba(69,97,232,0.30)","rgba(124,58,237,0.30)","rgba(159,122,255,0.30)","rgba(255,122,0,0.30)","rgba(245,158,11,0.30)","rgba(192,132,252,0.30)","rgba(6,182,212,0.30)"][i % 7]}`,
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    boxShadow: current
                      ? "0 0 18px rgba(124,58,237,0.85), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)"
                      : passed
                      ? "0 3px 9px rgba(69,97,232,0.4), inset 0 1px 0 rgba(255,255,255,0.25)"
                      : "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.10)",
                  }}>
                  {passed ? (
                    <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                  ) : current ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ) : null}
                </div>
                <div className="absolute top-full mt-2 text-center flex flex-col items-center" style={{ width: 72, marginLeft: -27 }}>
                  <div className="text-[9px] font-bold leading-tight" style={{
                    color: current ? "var(--text)" : passed ? "var(--text-muted)" : "var(--text-muted)",
                    opacity: current ? 1 : passed ? 0.85 : 0.55,
                  }}>
                    {lvl.name}
                  </div>
                  <div className="text-[8px] flex items-center justify-center gap-0.5 mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                    {lvl.minXP >= 1000 ? `${lvl.minXP / 1000}k` : lvl.minXP}
                    <MeLogo height={7} />
                  </div>
                  {/* Reward chip — shows what plan/days the user gets at this level */}
                  {LEVEL_REWARDS_BY_KEY[lvl.key] && (() => {
                    const r = LEVEL_REWARDS_BY_KEY[lvl.key]!;
                    const isUltima = r.plan === "ultima";
                    const c = isUltima ? "#F5B400" : "#4561E8";
                    return (
                      <div className="text-[8px] font-bold mt-1 px-1.5 py-0.5 rounded inline-block" style={{
                        color: c,
                        background: isUltima ? "rgba(245,158,11,0.10)" : "rgba(69,97,232,0.10)",
                        border: `1px solid ${isUltima ? "rgba(245,158,11,0.30)" : "rgba(69,97,232,0.25)"}`,
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                        opacity: passed ? 0.55 : current ? 1 : 0.85,
                      }}>
                        +{r.days}д {isUltima ? "Ultima" : "Pro"}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {next && (
        <div className="mt-4 rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(69,97,232,0.06) 50%, rgba(159,122,255,0.04) 100%), rgba(255,255,255,0.02)",
            border: "1px solid rgba(124,58,237,0.25)",
            backdropFilter: "blur(14px) saturate(1.4)",
            WebkitBackdropFilter: "blur(14px) saturate(1.4)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 28px rgba(124,58,237,0.10)",
          }}>
          {/* Soft halo */}
          <div className="absolute pointer-events-none" aria-hidden
            style={{ top: -40, right: -20, width: 180, height: 100, opacity: 0.5,
              background: "radial-gradient(ellipse, rgba(159,122,255,0.40), transparent 65%)", filter: "blur(20px)" }} />

          <div className="relative flex items-start justify-between mb-2.5 gap-3">
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)" }}>
              {t("level.toNextLabel")}
            </div>
            <div className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(69,97,232,0.15))",
              color: "#9F7AFF",
              border: "1px solid rgba(159,122,255,0.30)",
            }}>
              {Math.round(segProgress)}%
            </div>
          </div>

          {/* Number row: equal-size XP + Me-logo + arrow-replacement (dot) + next level */}
          <div className="relative flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-black leading-none" style={{
                fontSize: 36,
                background: "linear-gradient(135deg, #6B8FFF, #9F7AFF, #C4B5FD)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}>
                {(next.minXP - totalXP).toLocaleString()}
              </span>
              <MeLogo height={26} />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full" style={{
                background: "#9F7AFF",
                boxShadow: "0 0 8px #9F7AFF",
              }} />
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                {next.name}
              </span>
            </div>
          </div>

          {/* Reward chip — shows what gift the user gets when reaching next level */}
          {LEVEL_REWARDS_BY_KEY[next.key] && (() => {
            const reward = LEVEL_REWARDS_BY_KEY[next.key]!;
            const isUltima = reward.plan === "ultima";
            const planLabel = isUltima ? "Ultima" : "Pro";
            const accentColor = isUltima ? "#F5B400" : "#4561E8";
            const tintBg = isUltima
              ? "linear-gradient(135deg, rgba(255,215,80,0.18), rgba(245,158,11,0.10))"
              : "linear-gradient(135deg, rgba(69,97,232,0.18), rgba(124,58,237,0.10))";
            const tintBorder = isUltima ? "rgba(245,158,11,0.40)" : "rgba(124,58,237,0.30)";
            const dayWord = reward.days === 1 ? "день" : (reward.days >= 2 && reward.days <= 4 ? "дня" : "дней");
            return (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{
                background: tintBg,
                border: `1px solid ${tintBorder}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 12px ${accentColor}1A`,
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill={accentColor} style={{ flexShrink: 0 }}>
                  <path d="M20 12v9H4v-9M22 7H2v5h20zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"
                    stroke={accentColor} strokeWidth="1.6" strokeLinejoin="round" fill="none" />
                </svg>
                <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  Награда:
                </span>
                <span className="text-[12px] font-bold" style={{ color: accentColor }}>
                  {reward.days} {dayWord} {planLabel}
                </span>
                <span className="text-[11px] ml-auto" style={{ color: "var(--text-muted)" }}>
                  бесплатно
                </span>
              </div>
            );
          })()}

          {/* Sleek progress bar */}
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${segProgress}%`,
              background: "linear-gradient(90deg, #4561E8 0%, #7C3AED 50%, #9F7AFF 100%)",
              boxShadow: "0 0 10px rgba(124,58,237,0.7)",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Global rank capsule (ornate) ─────────────────────────────────────────────
function GlobalRankCapsule({ rank, total, mySerialId }: { rank: number | null; total: number | null; mySerialId?: number | null }) {
  const t = useTranslations("analytics");
  if (!rank || !total) return null;
  const pct = (rank / total) * 100;
  const isTop10 = pct <= 10;
  return (
    <div className="rounded-2xl p-4 border flex items-center gap-3 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(124,58,237,0.18) 0%, rgba(69,97,232,0.10) 50%, rgba(0,0,0,0.04) 100%)",
        borderColor: "rgba(124,58,237,0.40)",
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(124,58,237,0.18), 0 8px 32px rgba(124,58,237,0.20)",
      }}>
      {/* Spotlight */}
      <div className="absolute pointer-events-none" aria-hidden
        style={{ top: -40, right: -40, width: 140, height: 140, opacity: 0.7,
          background: "radial-gradient(circle, rgba(159,122,255,0.55), transparent 60%)", filter: "blur(6px)" }} />
      {isTop10 && (
        <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-bl-xl rounded-tr-xl text-[9px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
          TOP {pct < 1 ? "1%" : `${Math.ceil(pct)}%`}
        </div>
      )}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
        style={{
          background: "linear-gradient(135deg, #4561E8, #7C3AED)",
          boxShadow: "0 8px 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
        }}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
          <path d="M12 2l2.5 7h7.5l-6 4.5 2.5 7.5L12 16.5 5.5 21l2.5-7.5L2 9h7.5z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        {/* Top row: section label + ID badge above */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "var(--text-muted)" }}>
            {t("globalRankLabel")}
          </span>
          {mySerialId !== null && mySerialId !== undefined && (
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "rgba(124,58,237,0.18)", color: "#9F7AFF", border: "1px solid rgba(159,122,255,0.30)" }}>
              ID #{mySerialId}
            </span>
          )}
        </div>
        {/* Single-line: #296 (big) + 'из 747 пользователей' (smaller) */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-black leading-none" style={{
            fontSize: 30,
            background: "linear-gradient(135deg, #6B8FFF, #9F7AFF, #C4B5FD)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>
            #{rank}
          </span>
          <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
            {t("globalRankOf", { n: total.toLocaleString() })}
          </span>
        </div>
      </div>
      {/* Right-side encouragement chip */}
      <div className="flex-shrink-0 relative">
        <div className="text-xs font-bold px-3 py-2 rounded-xl text-center" style={{
          background: "linear-gradient(135deg, rgba(255,215,80,0.18), rgba(245,158,11,0.10))",
          border: "1px solid rgba(245,158,11,0.40)",
          color: "#F5B400",
          boxShadow: "0 0 14px rgba(245,158,11,0.20), inset 0 1px 0 rgba(255,255,255,0.10)",
          letterSpacing: "0.01em",
          minWidth: 110,
          whiteSpace: "nowrap",
        }}>
          ✨ Так держать!
        </div>
      </div>
    </div>
  );
}

// ── Big YouTube-style area chart (14 days) ───────────────────────────────────
function ActivityAreaChart({ days }: { days: ActivityDay[] }) {
  const t = useTranslations("analytics.activity");
  const locale = useLocale();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...days.map(d => d.count), 1);
  const total = days.reduce((s, d) => s + d.count, 0);
  const avg = total / days.length;

  const W = 600, H = 140, PAD = 4;
  const stepX = (W - PAD * 2) / (days.length - 1);
  const yFor = (v: number) => H - PAD - (v / max) * (H - PAD * 2 - 12);
  const points = days.map((d, i) => `${PAD + i * stepX},${yFor(d.count)}`).join(" ");
  const fillPath = `M ${PAD},${H - PAD} L ${points.split(" ").join(" L ")} L ${W - PAD},${H - PAD} Z`;

  return (
    <div className="rounded-2xl p-5 border relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01) 60%, transparent), var(--bg-card)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(16px) saturate(1.3)", WebkitBackdropFilter: "blur(16px) saturate(1.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{t("title")}</div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("subtitle")}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{total}</div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("avgPerDay", { n: avg.toFixed(1) })}</div>
        </div>
      </div>
      <div className="relative mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H, display: "block" }}>
          <defs>
            <linearGradient id="actfill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4561E8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#4561E8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="actstroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#4561E8" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          {/* Grid */}
          {[0.25, 0.5, 0.75].map(t => (
            <line key={t} x1={PAD} x2={W - PAD} y1={PAD + (H - PAD * 2) * t} y2={PAD + (H - PAD * 2) * t}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.6" />
          ))}
          {/* Filled area */}
          <path d={fillPath} fill="url(#actfill)" />
          {/* Line */}
          <polyline points={points} fill="none" stroke="url(#actstroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Peak marker */}
          {(() => {
            const peakIdx = days.reduce((mi, d, i, a) => d.count > a[mi].count ? i : mi, 0);
            if (days[peakIdx].count === 0) return null;
            const cx = PAD + peakIdx * stepX, cy = yFor(days[peakIdx].count);
            return (
              <g>
                <circle cx={cx} cy={cy} r="6" fill="rgba(255,122,0,0.18)" />
                <circle cx={cx} cy={cy} r="3.5" fill="#FF7A00" stroke="#fff" strokeWidth="1.5" />
              </g>
            );
          })()}
          {/* Points */}
          {days.map((d, i) => (
            <g key={d.date}>
              <circle cx={PAD + i * stepX} cy={yFor(d.count)} r={hoverIdx === i ? 4 : 2.5}
                fill={hoverIdx === i ? "#fff" : "#4561E8"} stroke="#7C3AED" strokeWidth={hoverIdx === i ? 2 : 0.5}
                style={{ transition: "r 0.15s" }} />
              {/* Hover hitbox */}
              <rect x={PAD + i * stepX - stepX / 2} y={0} width={stepX} height={H}
                fill="transparent" onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} />
            </g>
          ))}
        </svg>
        {hoverIdx !== null && (
          <div className="absolute pointer-events-none rounded-lg px-2.5 py-1.5 text-xs font-medium"
            style={{
              left: `${((PAD + hoverIdx * stepX) / W) * 100}%`,
              top: -8, transform: "translate(-50%, -100%)",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              color: "var(--text)", whiteSpace: "nowrap",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
            {t("tooltip", {
              date: new Date(days[hoverIdx].date + "T12:00:00").toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "short" }),
              count: days[hoverIdx].count,
            })}
          </div>
        )}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1 px-1">
        {days.filter((_, i) => i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2)).map(d => (
          <span key={d.date} className="text-[9px]" style={{ color: "var(--text-muted)" }}>
            {new Date(d.date + "T12:00:00").toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "short" })}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Galaxy of knowledge (3D glass bars) ──────────────────────────────────────
function GalaxyOfKnowledge({ subjects }: { subjects: SubjectStat[] }) {
  const t = useTranslations("analytics.subjects");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const tm = setTimeout(() => setMounted(true), 120); return () => clearTimeout(tm); }, []);
  if (!subjects.length) return null;

  const maxXP = Math.max(...subjects.map(s => s.xp), 1);
  const MAX_H = 140;

  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01) 60%, transparent), var(--bg-card)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(16px) saturate(1.3)", WebkitBackdropFilter: "blur(16px) saturate(1.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{t("title")}</div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("subtitle")}</div>
        </div>
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
          {t("active", { n: subjects.length })}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, minHeight: MAX_H + 64 }}>
        {subjects.map(s => {
          const color = subjectColor(s.id);
          const barH = mounted ? Math.max(14, Math.round((s.xp / maxXP) * MAX_H)) : 0;
          return (
            <Link key={s.id} href={`/learn/${s.id}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color,
                opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease 0.4s",
                minHeight: 14, display: "flex", alignItems: "center", gap: 2,
              }}>
                {s.xp}<MeLogo height={8} />
              </span>
              <div style={{
                width: "100%", height: barH, position: "relative",
                background: `linear-gradient(180deg, ${color}60 0%, ${color}28 80%, ${color}15 100%)`,
                border: `1px solid ${color}50`,
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                boxShadow: `0 6px 20px ${color}30, inset 0 1px 0 rgba(255,255,255,0.25), 4px 6px 0 rgba(0,0,0,0.07)`,
                borderRadius: "10px 10px 6px 6px",
                transition: "height 1s cubic-bezier(0.34,1.15,0.64,1)",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 3, left: 5, right: 5, height: 4,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
                  borderRadius: "4px 4px 0 0",
                }} />
                {barH > 40 && (
                  <div style={{
                    position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
                    fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.85)",
                    background: "rgba(0,0,0,0.18)", borderRadius: 4, padding: "1px 4px", whiteSpace: "nowrap",
                  }}>
                    {s.level.name}
                  </div>
                )}
              </div>
              <SubjectIcon id={s.id} size={22} />
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

// ── Badge grid (4 groups × 5 = 20) ───────────────────────────────────────────
const GROUP_META: Record<string, { color: string; icon: string }> = {
  volume:      { color: "#4561E8", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  consistency: { color: "#FF7A00", icon: "M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" },
  experience:  { color: "#9F7AFF", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  mastery:     { color: "#10B981", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
};

function BadgeGrid({ badges }: { badges: BadgeItem[] }) {
  const t = useTranslations("analytics.badges");
  const earned = badges.filter(b => b.earned).length;
  const groups: BadgeItem["group"][] = ["volume", "consistency", "experience", "mastery"];

  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01) 60%, transparent), var(--bg-card)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(16px) saturate(1.3)", WebkitBackdropFilter: "blur(16px) saturate(1.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{t("title")}</div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {t("subtitle", { earned, total: badges.length })}
          </div>
        </div>
      </div>
      <div className="space-y-5">
        {groups.map(grp => {
          const items = badges.filter(b => b.group === grp);
          const meta = GROUP_META[grp];
          return (
            <div key={grp}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                  {t(`groups.${grp}` as never)}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {items.map(b => (
                  <div key={b.id} title={`${b.name} — ${b.desc}`}
                    className="rounded-xl p-2.5 border flex flex-col items-center gap-1.5 transition-all relative overflow-hidden"
                    style={{
                      background: b.earned
                        ? `linear-gradient(160deg, ${meta.color}30, ${meta.color}10 60%, transparent)`
                        : "rgba(255,255,255,0.02)",
                      borderColor: b.earned ? `${meta.color}55` : "rgba(255,255,255,0.07)",
                      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                      boxShadow: b.earned
                        ? `0 6px 18px ${meta.color}35, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px ${meta.color}28`
                        : "inset 0 1px 0 rgba(255,255,255,0.04)",
                      opacity: b.earned ? 1 : 0.55,
                    }}>
                    {b.earned && (
                      <div className="absolute pointer-events-none" aria-hidden
                        style={{ top: -10, right: -10, width: 50, height: 50, opacity: 0.6,
                          background: `radial-gradient(circle, ${meta.color}55, transparent 65%)`, filter: "blur(4px)" }} />
                    )}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center relative"
                      style={{
                        background: b.earned
                          ? `radial-gradient(circle at 30% 30%, ${meta.color}, ${meta.color}cc 70%)`
                          : "rgba(255,255,255,0.06)",
                        border: b.earned ? `1px solid rgba(255,255,255,0.30)` : "1px solid rgba(255,255,255,0.05)",
                        boxShadow: b.earned
                          ? `0 0 20px ${meta.color}aa, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 3px rgba(0,0,0,0.35)`
                          : "none",
                      }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d={meta.icon} /></svg>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold leading-tight" style={{ color: b.earned ? "var(--text)" : "var(--text-muted)" }}>
                        {b.name}
                      </div>
                      <div className="text-[9px] leading-tight mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                        {b.earned ? t("unlocked") : t("locked", { n: Math.max(0, b.threshold - b.current) })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Best streak callout ──────────────────────────────────────────────────────
function BestStreakCallout({ best }: { best: number }) {
  const t = useTranslations("analytics.bestStreak");
  if (best < 3) return null;
  const label = best >= 30 ? t("legendary") : best >= 14 ? t("impressive") : best >= 7 ? t("good") : t("toWeek", { n: 7 - best });
  return (
    <div className="rounded-2xl p-5 border flex items-center gap-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,122,0,0.14), rgba(255,160,0,0.06) 50%, rgba(0,0,0,0.02) 100%)",
        borderColor: "rgba(255,122,0,0.32)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(255,122,0,0.10)",
      }}>
      {/* Ember radial spotlights */}
      <div className="absolute pointer-events-none" aria-hidden style={{
        top: -40, left: -30, width: 180, height: 180, opacity: 0.45,
        background: "radial-gradient(circle, rgba(255,160,40,0.55), transparent 60%)", filter: "blur(12px)",
      }} />
      <div className="absolute pointer-events-none" aria-hidden style={{
        bottom: -50, right: -20, width: 200, height: 200, opacity: 0.35,
        background: "radial-gradient(circle, rgba(255,90,0,0.6), transparent 65%)", filter: "blur(14px)",
      }} />
      {/* Big animated flame icon */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,200,80,0.55), rgba(255,90,0,0.30) 70%)",
          border: "1px solid rgba(255,160,0,0.45)",
          boxShadow: "0 0 24px rgba(255,122,0,0.45), inset 0 1px 0 rgba(255,255,255,0.30)",
        }}>
        <svg viewBox="0 0 24 24" width="34" height="34" fill="#FF7A00" style={{ filter: "drop-shadow(0 0 8px rgba(255,160,0,0.8))", transform: "translateY(0.5px)" }}>
          <path d="M12 2C12 2 6 8 6 13.5c0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.5-.5-2.8-1.3-3.8C16.7 9 16 9 15.5 9.5c0 0 0.2 1.5-1.5 2 0.5-2-1-3.5-2-4.5 0.3 1.5-0.5 2.5-1.5 3-1-1-1-2-1-3 0.5-1.5 1.5-3 2.5-5z" />
        </svg>
      </div>
      <div className="relative">
        <div className="font-black text-xl leading-tight" style={{
          background: "linear-gradient(135deg, #FFB347, #FF7A00, #E63900)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>{t("title", { n: best })}</div>
        <div className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>{label}</div>
      </div>
    </div>
  );
}

// ── Recent activity (last 10 messages, expand/collapse) ──────────────────────
function RecentActivity({ msgs }: { msgs: RecentMsg[] }) {
  const t = useTranslations("analytics.recent");
  const [expanded, setExpanded] = useState(false);
  const rel = useRelTime();
  const visible = expanded ? msgs : msgs.slice(0, 5);
  if (!msgs.length) return null;

  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01) 60%, transparent), var(--bg-card)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(16px) saturate(1.3)", WebkitBackdropFilter: "blur(16px) saturate(1.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.06)" }}>
      <div className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>{t("title")}</div>
      <div className="space-y-2">
        {visible.map((m, i) => {
          const color = subjectColor(m.subject);
          return (
            <div key={i} className="rounded-xl p-3 flex gap-3 items-start relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color}10, transparent 80%), rgba(255,255,255,0.02)`,
                borderLeft: `2px solid ${color}`,
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}>
              <SubjectIcon id={m.subject} size={20} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold mb-0.5" style={{ color }}>
                  {m.subjectTitle}
                </div>
                <div className="text-xs leading-snug" style={{ color: "var(--text)" }}>
                  {m.content.length > 140 ? m.content.slice(0, 140) + "…" : m.content}
                </div>
                <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {rel(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {msgs.length > 5 && (
        <button onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
          {expanded ? t("collapse") : t("showMore", { count: msgs.length - 5 })}
        </button>
      )}
    </div>
  );
}

// ── Build sparkline data: last 14 days for XP and msgs (cumulative trend) ────
function buildTrend(activity: ActivityDay[]): number[] {
  // Use cumulative msgs as a proxy trend
  let cum = 0;
  return activity.map(d => { cum += d.count; return cum; });
}
function deltaPct(activity: ActivityDay[]): number | null {
  if (activity.length < 14) return null;
  const recent = activity.slice(-7).reduce((s, d) => s + d.count, 0);
  const prev = activity.slice(0, 7).reduce((s, d) => s + d.count, 0);
  if (prev === 0) return recent > 0 ? 100 : null;
  return ((recent - prev) / prev) * 100;
}

// ── Main client page ────────────────────────────────────────────────────────
export default function AnalyticsClient(p: Props) {
  const t = useTranslations("analytics");
  const trendCum = useMemo(() => buildTrend(p.activity14d), [p.activity14d]);
  const dlt = useMemo(() => deltaPct(p.activity14d), [p.activity14d]);
  const earnedBadges = p.badges.filter(b => b.earned).length;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-5">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-[28px] font-black tracking-tight" style={{
            background: "linear-gradient(135deg, var(--text), var(--text-secondary))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{t("title")}</h1>
          {p.totalXP > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(69,97,232,0.10))",
                border: "1px solid rgba(124,58,237,0.30)",
                color: "#9F7AFF",
                boxShadow: "0 4px 12px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}>
              <span style={{ fontSize: 13 }}>{p.totalXP.toLocaleString()}</span>
              <MeLogo height={11} />
            </span>
          )}
        </div>
        <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>{t("subtitle")}</p>
        {/* Decorative bottom accent */}
        <div className="mt-3 h-[2px] w-24 rounded-full" style={{
          background: "linear-gradient(90deg, #4561E8, #7C3AED, transparent)",
          boxShadow: "0 0 8px rgba(124,58,237,0.5)",
        }} />
      </div>

      {/* Hero: career ladder full-width + global rank below */}
      <div className="space-y-4">
        <CareerLadder levels={p.careerLevels} totalXP={p.totalXP} currentKey={p.currentLevelKey} />
        <GlobalRankCapsule rank={p.globalRank} total={p.totalUsers} mySerialId={p.mySerialId} />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("stats.totalXP")} value={p.totalXP.toLocaleString()} color="#4561E8"
          iconNode={
            /* Centered Me wordmark — wrapper enforces vertical centering, MeLogo's
               SVG content (text baseline at y=13 of 16-unit viewBox) appears bottom-anchored
               by default, so we lift it ~2px up via flex+padding. */
            <div className="w-full h-full flex items-center justify-center" style={{ paddingBottom: 1 }}>
              <MeLogo height={18} />
            </div>
          }
          sparkData={trendCum} deltaPct={dlt} />
        <StatCard label={t("stats.streak")} value={t("stats.streakValue", { n: p.currentStreak })} color="#FF7A00"
          iconNode={
            /* Classic flame — clean teardrop silhouette, properly centered */
            <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: "block" }}>
              <defs>
                <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFB347" />
                  <stop offset="60%" stopColor="#FF7A00" />
                  <stop offset="100%" stopColor="#E63900" />
                </linearGradient>
              </defs>
              <path
                d="M12 2.5c0 3-2 4.5-3.5 6.5C7 11 6 13 6 15c0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.5-.5-2.7-1.3-3.6.2.7.3 1.4.3 2.1 0 1.5-.5 2.5-1.5 2.5-.6 0-1-.4-1-1 0-1.5.5-3-.5-4.5-1-1.5-2-3-2-6z"
                fill="url(#flameGrad)"
              />
            </svg>
          } />
        <StatCard label={t("stats.messages")} value={p.totalMessages.toLocaleString()} color="#10B981"
          icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          sparkData={p.activity14d.map(d => d.count)} deltaPct={dlt} />
        <StatCard label={t("stats.badges")} value={t("stats.badgesValue", { earned: earnedBadges, total: p.badges.length })} color="#F5B400"
          iconNode={
            /* Golden trophy cup — classic shape: bowl + handles + stem + base */
            <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: "block" }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFE17A" />
                  <stop offset="50%" stopColor="#F5B400" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>
              {/* Trophy bowl */}
              <path
                d="M7 4h10v3.5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z"
                fill="url(#goldGrad)" stroke="#8C5500" strokeWidth="0.5" strokeLinejoin="round"
              />
              {/* Left handle */}
              <path
                d="M7 5.5C5.3 5.5 4 6.5 4 8s1.3 2.5 3 2.5"
                fill="none" stroke="url(#goldGrad)" strokeWidth="1.4" strokeLinecap="round"
              />
              {/* Right handle */}
              <path
                d="M17 5.5c1.7 0 3 1 3 2.5s-1.3 2.5-3 2.5"
                fill="none" stroke="url(#goldGrad)" strokeWidth="1.4" strokeLinecap="round"
              />
              {/* Stem */}
              <rect x="11" y="13" width="2" height="3" fill="url(#goldGrad)" />
              {/* Base */}
              <path d="M8.5 16h7l-.5 3h-6z" fill="url(#goldGrad)" stroke="#8C5500" strokeWidth="0.4" strokeLinejoin="round" />
              {/* Star sparkle on bowl */}
              <circle cx="12" cy="7.5" r="0.9" fill="rgba(255,255,255,0.85)" />
            </svg>
          } />
      </div>

      {/* Activity area chart */}
      <ActivityAreaChart days={p.activity14d} />

      {/* Galaxy of Knowledge */}
      <GalaxyOfKnowledge subjects={p.subjectStats} />

      {/* Leaderboard — top by ments */}
      <Leaderboard mySerialId={p.mySerialId} />

      {/* Best streak callout */}
      <BestStreakCallout best={p.bestStreak} />

      {/* Badges */}
      <BadgeGrid badges={p.badges} />

      {/* Recent activity */}
      <RecentActivity msgs={p.recentMsgs} />

      {/* Empty state */}
      {p.subjectStats.length === 0 && (
        <div className="text-center py-14 rounded-2xl border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="font-bold mb-2" style={{ color: "var(--text)" }}>{t("empty.title")}</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("empty.desc")}</p>
        </div>
      )}
    </main>
  );
}
