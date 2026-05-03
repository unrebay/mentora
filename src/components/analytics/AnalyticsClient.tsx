"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";
import MeLogo from "@/components/MeLogo";
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
  key: "beginner" | "explorer" | "scholar" | "historian" | "expert";
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
    <div className="rounded-2xl p-4 border flex flex-col gap-2 relative overflow-hidden group transition-all"
      style={{
        background: `linear-gradient(160deg, ${color}10, ${color}04 60%, transparent), var(--bg-card)`,
        borderColor: `${color}28`,
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px ${color}14, 0 4px 20px rgba(0,0,0,0.04)`,
      }}>
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
          <MeLogo height={14} colorM="#7C3AED" colorE="#7C3AED" />
        </span>
      </div>
      <div className="relative" style={{ paddingTop: 6, paddingBottom: 26 }}>
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full"
          style={{ background: "var(--border)" }} />
        {/* Progress fill */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-all duration-700"
          style={{
            width: `${(currentIdx + segProgress / 100) / (levels.length - 1) * 100}%`,
            background: "linear-gradient(90deg, #4561E8, #7C3AED)",
            boxShadow: "0 0 8px rgba(124,58,237,0.6)",
          }} />
        {/* Nodes */}
        <div className="relative flex justify-between items-center">
          {levels.map((lvl, i) => {
            const passed = i < currentIdx;
            const current = i === currentIdx;
            return (
              <div key={lvl.key} className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                <div className={`relative rounded-full flex items-center justify-center transition-all duration-500 ${current ? "scale-125" : ""}`}
                  style={{
                    width: current ? 36 : 28, height: current ? 36 : 28,
                    background: current
                      ? "radial-gradient(circle at 30% 30%, #8B6CF7, #4561E8 60%, #2D40A8)"
                      : passed
                      ? "linear-gradient(135deg, #4561E8, #2D40A8)"
                      : "rgba(255,255,255,0.04)",
                    border: current
                      ? "1.5px solid rgba(255,255,255,0.5)"
                      : passed
                      ? "1px solid rgba(124,58,237,0.4)"
                      : "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    boxShadow: current
                      ? "0 0 24px rgba(124,58,237,0.85), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)"
                      : passed
                      ? "0 4px 12px rgba(69,97,232,0.4), inset 0 1px 0 rgba(255,255,255,0.25)"
                      : "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.10)",
                  }}>
                  {passed ? (
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                  ) : current ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : null}
                </div>
                <div className="absolute top-full mt-1.5 text-center" style={{ width: 70, marginLeft: -21 }}>
                  <div className="text-[10px] font-bold" style={{ color: current ? "var(--text)" : "var(--text-muted)" }}>
                    {lvl.name}
                  </div>
                  <div className="text-[9px] flex items-center justify-center gap-0.5" style={{ color: "var(--text-muted)", opacity: 0.85 }}>
                    {lvl.minXP}
                    <MeLogo height={8} colorM="currentColor" colorE="currentColor" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {next && (
        <div className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          {t("level.toNextXP", { n: next.minXP - totalXP })} → {next.name}
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
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4561E8, #7C3AED)" }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
          <path d="M12 2l2.5 7h7.5l-6 4.5 2.5 7.5L12 16.5 5.5 21l2.5-7.5L2 9h7.5z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          {t("globalRankLabel")}
        </div>
        <div className="font-black text-2xl leading-none mt-1"
          style={{ background: "linear-gradient(135deg, #6B8FFF, #9F7AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          #{rank}
        </div>
        {mySerialId !== null && mySerialId !== undefined && (
          <div className="text-[10px] font-bold tracking-wider mt-1 inline-block px-2 py-0.5 rounded-full"
            style={{ background: "rgba(124,58,237,0.18)", color: "#9F7AFF", border: "1px solid rgba(159,122,255,0.30)" }}>
            ID #{mySerialId}
          </div>
        )}
        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {t("globalRankOf", { n: total.toLocaleString() })}
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
                {s.xp}<MeLogo height={8} colorM="currentColor" colorE="currentColor" />
              </span>
              <div style={{
                width: "100%", height: barH, position: "relative",
                background: `linear-gradient(180deg, ${color}60 0%, ${color}28 80%, ${color}15 100%)`,
                border: `1px solid ${color}50`, borderBottom: `3px solid ${color}75`,
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                boxShadow: `0 6px 20px ${color}30, inset 0 1px 0 rgba(255,255,255,0.25), 4px 6px 0 rgba(0,0,0,0.07)`,
                borderRadius: "7px 7px 3px 3px",
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
              <div className="grid grid-cols-5 gap-2">
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
    <div className="rounded-2xl p-4 border flex items-center gap-4"
      style={{ background: "rgba(255,122,0,0.06)", borderColor: "rgba(255,122,0,0.2)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,122,0,0.12)", border: "1px solid rgba(255,122,0,0.25)" }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF7A00">
          <path d="M13 2C13 2 8.5 7 8.5 11.5c0 1.5.5 2.8 1.3 3.8C9.3 14.5 9 13.5 9 12.5c0-2 1.5-4 3-5 0 1.5.5 3 1.5 4 .5-1 .5-2 .5-3 1 1.5 1.5 3 1.5 4.5 0 2.5-2 4.5-4.5 4.5S6.5 15.5 6.5 13C6.5 7.5 13 2 13 2z" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-bold" style={{ color: "#FF7A00" }}>{t("title", { n: best })}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
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
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{t("title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{t("subtitle")}</p>
      </div>

      {/* Hero: career ladder + global rank */}
      <div className="grid md:grid-cols-[2fr_1fr] gap-4">
        <CareerLadder levels={p.careerLevels} totalXP={p.totalXP} currentKey={p.currentLevelKey} />
        <GlobalRankCapsule rank={p.globalRank} total={p.totalUsers} mySerialId={p.mySerialId} />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("stats.totalXP")} value={p.totalXP.toLocaleString()} color="#4561E8"
          iconNode={<MeLogo height={20} colorM="#4561E8" colorE="#4561E8" />}
          sparkData={trendCum} deltaPct={dlt} />
        <StatCard label={t("stats.streak")} value={t("stats.streakValue", { n: p.currentStreak })} color="#FF7A00"
          icon="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" />
        <StatCard label={t("stats.messages")} value={p.totalMessages.toLocaleString()} color="#10B981"
          icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          sparkData={p.activity14d.map(d => d.count)} deltaPct={dlt} />
        <StatCard label={t("stats.badges")} value={t("stats.badgesValue", { earned: earnedBadges, total: p.badges.length })} color="#9F7AFF"
          icon="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
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
