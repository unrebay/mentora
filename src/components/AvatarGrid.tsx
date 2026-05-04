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
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl p-5 sm:p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
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
              title={unlocked ? LEVEL_TIER_NAMES[level] : `Ещё ${remaining.toLocaleString("ru-RU")} мент(ов)`}
              className="relative rounded-xl p-2 transition-all"
              style={{
                background: isSelected ? "rgba(124,58,237,0.10)" : "transparent",
                border: isSelected ? "1.5px solid rgba(124,58,237,0.55)" : "1px solid var(--border)",
                boxShadow: isSelected ? "0 0 22px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                cursor: unlocked ? "pointer" : "not-allowed",
                opacity: unlocked ? 1 : 0.45,
                transform: isPending ? "scale(0.96)" : "scale(1)",
              }}
            >
              <LevelAvatar level={level} size={56} />
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                  style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
              )}
              <div className="text-[9px] mt-1 font-medium leading-tight" style={{ color: unlocked ? "var(--text)" : "var(--text-muted)" }}>
                {LEVEL_TIER_NAMES[level]}
              </div>
              <div className="text-[8px]" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                {LEVEL_THRESHOLDS[level] >= 1000
                  ? `${LEVEL_THRESHOLDS[level] / 1000}k`
                  : LEVEL_THRESHOLDS[level]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
