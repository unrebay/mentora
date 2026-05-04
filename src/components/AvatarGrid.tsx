"use client";

import { useState } from "react";
import LevelAvatar, { LEVEL_TIER_NAMES, LEVEL_THRESHOLDS, LEVEL_NAMES, unlockedLevel } from "@/components/LevelAvatar";

interface Props {
  totalXP: number;
  initialSelected: number | null; // NULL means auto = unlockedLevel
}

export default function AvatarGrid({ totalXP, initialSelected }: Props) {
  const max = unlockedLevel(totalXP);
  const [selected, setSelected] = useState<number>(initialSelected ?? max);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (level: number) => {
    if (level > max) return;
    setPending(level);
    setError(null);
    try {
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setSelected(level);
      // Reload so navbar avatar updates from server-side props
      window.location.reload();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl p-5 sm:p-6 border relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(124,58,237,0.06), rgba(255,255,255,0.02) 60%, transparent), var(--bg-card)", borderColor: "rgba(124,58,237,0.20)", backdropFilter: "blur(16px) saturate(1.3)", WebkitBackdropFilter: "blur(16px) saturate(1.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(124,58,237,0.10)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>Аватарка</div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Открывается с уровнями · {max + 1} из 8 доступно
          </div>
        </div>
        {error && (
          <span className="text-[11px] font-medium" style={{ color: "#ef4444" }}>{error}</span>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
        {LEVEL_NAMES.map((_, level) => {
          const unlocked = level <= max;
          const isSelected = level === selected;
          const isPending = pending === level;
          const remaining = unlocked ? 0 : LEVEL_THRESHOLDS[level] - totalXP;
          return (
            <button
              key={level}
              type="button"
              onClick={() => unlocked && choose(level)}
              disabled={!unlocked || isPending}
              title={unlocked ? `${LEVEL_TIER_NAMES[level]} · ${LEVEL_THRESHOLDS[level]} мент` : `Ещё ${remaining.toLocaleString("ru-RU")} мент(ов)`}
              className="relative rounded-xl p-2 pt-3 transition-all overflow-hidden flex flex-col items-center"
              style={{
                background: isSelected
                  ? "linear-gradient(160deg, rgba(124,58,237,0.20), rgba(69,97,232,0.10) 60%, rgba(0,0,0,0.04))"
                  : "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01) 60%, transparent)",
                border: isSelected ? "1.5px solid rgba(124,58,237,0.55)" : "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px) saturate(1.2)", WebkitBackdropFilter: "blur(12px) saturate(1.2)",
                boxShadow: isSelected
                  ? "0 0 26px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.10)"
                  : "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 6px rgba(0,0,0,0.06)",
                cursor: unlocked ? "pointer" : "not-allowed",
                opacity: unlocked ? 1 : 0.55,
                transform: isPending ? "scale(0.96)" : "scale(1)",
              }}
            >
              {/* Subtle spotlight in upper-right when selected/unlocked */}
              {isSelected && (
                <div className="absolute pointer-events-none" aria-hidden
                  style={{ top: -20, right: -20, width: 80, height: 80, opacity: 0.6,
                    background: "radial-gradient(circle, rgba(159,122,255,0.55), transparent 65%)", filter: "blur(6px)" }} />
              )}
              <div className="relative flex items-center justify-center" style={{ width: 60, height: 60 }}>
                <LevelAvatar level={level} size={60} />
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(8,10,18,0.55)", backdropFilter: "blur(2px)" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Tier label */}
              <div className="text-[11px] mt-2 font-bold leading-tight text-center" style={{ color: unlocked ? "var(--text)" : "var(--text-muted)", overflowWrap: "anywhere", lineHeight: 1.15, maxWidth: "100%" }}>
                {LEVEL_TIER_NAMES[level]}
              </div>
              {/* Planet name + ment count */}
              <div className="text-[10px] mt-0.5 leading-tight text-center" style={{ color: "var(--text-muted)" }}>
                {LEVEL_NAMES[level]} · {LEVEL_THRESHOLDS[level] >= 1000 ? `${LEVEL_THRESHOLDS[level] / 1000}k` : LEVEL_THRESHOLDS[level]} мент
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
