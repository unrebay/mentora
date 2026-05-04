"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MeLogo from "@/components/MeLogo";
import { subjectColor } from "@/components/SubjectIcon";

interface Row {
  serial_id: number;
  xp: number;
  messages: number;
  streak: number;
  is_bot: boolean;
  primary_subject: string | null;
}
interface NeighborRow extends Row {
  rank: number;
}
interface Props { mySerialId?: number | null }

const TIER_COLORS = ["#94a3b8", "#4561E8", "#7C3AED", "#FF7A00", "#f59e0b", "#c084fc", "#06B6D4", "#FF8B3D"]; // beginner..academic
const TIER_KEYS = ["beginner", "explorer", "scholar", "historian", "expert", "master", "doctor", "academic"] as const;
function tierIdxByXP(xp: number) {
  if (xp >= 10000) return 7;
  if (xp >= 5000)  return 6;
  if (xp >= 2500)  return 5;
  if (xp >= 1000)  return 4;
  if (xp >= 600)   return 3;
  if (xp >= 300)   return 2;
  if (xp >= 100)   return 1;
  return 0;
}
const MEDAL_GRADIENTS: Record<number, string> = {
  0: "linear-gradient(135deg, #FFE17A 10%, #F59E0B 50%, #B45309 95%)",
  1: "linear-gradient(135deg, #E5E7EB 10%, #94A3B8 50%, #64748B 95%)",
  2: "linear-gradient(135deg, #FED7AA 10%, #C2410C 50%, #7C2D12 95%)",
};
const MEDAL_GLOW: Record<number, string> = {
  0: "0 0 24px rgba(245,158,11,0.85)",
  1: "0 0 18px rgba(148,163,184,0.75)",
  2: "0 0 18px rgba(194,65,12,0.65)",
};

export default function Leaderboard({ mySerialId }: Props) {
  const t = useTranslations("analytics.leaderboard");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [neighbors, setNeighbors] = useState<NeighborRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard?limit=100")
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => {
        if (cancelled) return;
        setRows(d.top);
        setNeighbors(Array.isArray(d.neighbors) ? d.neighbors : []);
      })
      .catch(e => { if (!cancelled) setError(String(e.message ?? e)); });
    return () => { cancelled = true; };
  }, []);

  if (error) return null;
  // Top 10 always visible
  const top10 = !rows ? [] : rows.slice(0, 10);
  const myInTop10 = !!(rows && mySerialId && top10.some(r => r.serial_id === mySerialId && !r.is_bot));
  // Show neighbors block ALWAYS when user is below top-10 — relies on server-side ±1 radius
  const showNeighbours = !myInTop10 && neighbors.length > 0;

  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(124,58,237,0.10) 0%, rgba(69,97,232,0.06) 50%, rgba(0,0,0,0.04) 100%), var(--bg-card)",
        borderColor: "rgba(124,58,237,0.30)",
        backdropFilter: "blur(20px) saturate(1.5)",
        WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(124,58,237,0.15), 0 8px 40px rgba(124,58,237,0.16)",
      }}>
      {/* Neon spotlights */}
      <div className="absolute pointer-events-none" aria-hidden
        style={{ top: -60, left: -60, width: 200, height: 200, opacity: 0.65,
          background: "radial-gradient(circle, rgba(124,58,237,0.55), transparent 65%)", filter: "blur(20px)" }} />
      <div className="absolute pointer-events-none" aria-hidden
        style={{ bottom: -60, right: -60, width: 180, height: 180, opacity: 0.45,
          background: "radial-gradient(circle, rgba(69,97,232,0.5), transparent 65%)", filter: "blur(20px)" }} />

      <div className="flex items-center justify-between mb-4 relative">
        <div>
          <div className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
            <span style={{ background: "linear-gradient(135deg, #FFE17A, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("title")}
            </span>
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("subtitle")}</div>
        </div>
      </div>

      <div className="space-y-2 relative">
        {!rows && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        )}
        {top10.map((r, idx) => {
          const isMine = mySerialId === r.serial_id && !r.is_bot;
          const tier = tierIdxByXP(r.xp);
          const tierColor = TIER_COLORS[tier];
          const subjColor = r.primary_subject ? subjectColor(r.primary_subject) : tierColor;
          const isMedal = idx < 3;
          const medalGrad = isMedal ? MEDAL_GRADIENTS[idx] : null;
          const medalGlow = isMedal ? MEDAL_GLOW[idx] : null;
          return (
            <div key={`${r.serial_id}-${idx}`}
              className="rounded-xl p-3 flex items-center gap-3 relative overflow-hidden transition-all"
              style={{
                background: isMine
                  ? `linear-gradient(135deg, rgba(124,58,237,0.18), rgba(69,97,232,0.10) 60%, rgba(0,0,0,0.04))`
                  : `linear-gradient(135deg, ${subjColor}10, transparent 80%), rgba(255,255,255,0.03)`,
                borderLeft: `3px solid ${tierColor}`,
                border: isMine ? "1.5px solid rgba(124,58,237,0.55)" : "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                boxShadow: isMine
                  ? "0 0 28px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.10)"
                  : `inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.10)`,
                transform: isMine ? "scale(1.015)" : "scale(1)",
              }}>
              {/* Medal/place number */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative font-black"
                style={{
                  background: medalGrad ?? `linear-gradient(135deg, ${tierColor}30, ${tierColor}10)`,
                  border: medalGrad ? "1px solid rgba(255,255,255,0.45)" : `1px solid ${tierColor}40`,
                  boxShadow: medalGlow
                    ? `${medalGlow}, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.30)`
                    : `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.10)`,
                  color: medalGrad ? "#1a0a00" : tierColor,
                  fontSize: idx < 3 ? 18 : 14,
                  textShadow: medalGrad ? "0 1px 0 rgba(255,255,255,0.40)" : "none",
                }}>
                {idx + 1}
              </div>

              {/* Identity (#serial + tier strip) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base"
                    style={{ color: isMine ? "var(--text)" : "var(--text)", letterSpacing: "-0.01em" }}>
                    #{r.serial_id}
                  </span>
                  {isMine && (
                    <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(124,58,237,0.25)", color: "#9F7AFF", border: "1px solid rgba(159,122,255,0.40)" }}>
                      {t("you")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: tierColor }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: tierColor, boxShadow: `0 0 6px ${tierColor}` }} />
                    {t(`tiers.${TIER_KEYS[tier]}` as never)}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {t("streakOf", { n: r.streak })}
                  </span>
                </div>
              </div>

              {/* XP */}
              <div className="text-right flex-shrink-0">
                <div className="font-black text-lg flex items-center gap-1 justify-end" style={{ color: "var(--text)" }}>
                  {r.xp.toLocaleString()}
                  <MeLogo height={14} colorM={tierColor} colorE={tierColor} />
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {t("messagesShort", { n: r.messages.toLocaleString() })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Neighbours block (only if user below top-10) */}
        {showNeighbours && (
          <>
            <div className="text-center py-2" style={{ color: "var(--text-muted)" }}>
              <span className="text-[10px] tracking-[0.2em]">· · ·</span>
            </div>
            {neighbors.map((r) => {
              const isMine = mySerialId === r.serial_id && !r.is_bot;
              const tier = tierIdxByXP(r.xp);
              const tierColor = TIER_COLORS[tier];
              const subjColor = r.primary_subject ? subjectColor(r.primary_subject) : tierColor;
              return (
                <div key={`nb-${r.serial_id}-${r.rank}`}
                  className="rounded-xl p-3 flex items-center gap-3 relative overflow-hidden transition-all"
                  style={{
                    background: isMine
                      ? "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(69,97,232,0.12) 60%, rgba(0,0,0,0.04))"
                      : `linear-gradient(135deg, ${subjColor}10, transparent 80%), rgba(255,255,255,0.03)`,
                    borderLeft: `3px solid ${tierColor}`,
                    border: isMine ? "1.5px solid rgba(124,58,237,0.60)" : "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                    boxShadow: isMine
                      ? "0 0 32px rgba(124,58,237,0.60), inset 0 1px 0 rgba(255,255,255,0.10)"
                      : "inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.10)",
                    transform: isMine ? "scale(1.02)" : "scale(1)",
                    marginBottom: 8,
                  }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative font-black"
                    style={{
                      background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}10)`,
                      border: `1px solid ${tierColor}40`,
                      color: tierColor, fontSize: 14,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                    }}>
                    {r.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base" style={{ color: "var(--text)", letterSpacing: "-0.01em" }}>
                        #{r.serial_id}
                      </span>
                      {isMine && (
                        <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(124,58,237,0.25)", color: "#9F7AFF", border: "1px solid rgba(159,122,255,0.40)" }}>
                          {t("you")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: tierColor }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: tierColor, boxShadow: `0 0 6px ${tierColor}` }} />
                        {t(`tiers.${TIER_KEYS[tier]}` as never)}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {t("streakOf", { n: r.streak })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-lg flex items-center gap-1 justify-end" style={{ color: "var(--text)" }}>
                      {r.xp.toLocaleString()}
                      <MeLogo height={14} colorM={tierColor} colorE={tierColor} />
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {t("messagesShort", { n: r.messages.toLocaleString() })}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
