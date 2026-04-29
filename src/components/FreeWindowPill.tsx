"use client";
import { useState, useEffect } from "react";

interface Props {
  remaining: number;
  limit: number;
  windowResetAt: string | null;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function FreeWindowPill({ remaining, limit, windowResetAt }: Props) {
  const [msLeft, setMsLeft] = useState<number | null>(
    windowResetAt ? Math.max(0, new Date(windowResetAt).getTime() - Date.now()) : null
  );

  useEffect(() => {
    if (!windowResetAt) return;
    const tick = () => {
      const ms = Math.max(0, new Date(windowResetAt).getTime() - Date.now());
      setMsLeft(ms);
      if (ms === 0) clearInterval(id);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowResetAt]);

  const isLow = remaining <= 3;
  const isExhausted = remaining === 0;
  const showTimer = windowResetAt !== null && msLeft !== null && msLeft > 0;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* FREE counter pill */}
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-[3px] rounded-full transition-colors"
        style={{
          background: "rgba(100,116,139,0.10)",
          color: "var(--text-muted)",
          border: "1px solid rgba(100,116,139,0.18)",
        }}
      >
        FREE
        <span
          className="font-bold tabular-nums"
          style={{ color: isLow ? "#f59e0b" : "var(--text-secondary)" }}
        >
          · {remaining}/{limit}
        </span>
      </span>

      {/* Timer pill — iOS 26 liquid glass */}
      {showTimer && (
        <span
          className="inline-flex items-center gap-[5px] text-xs font-mono font-semibold px-2.5 py-[3px] rounded-full select-none"
          style={{
            background: isExhausted
              ? "rgba(245,158,11,0.07)"
              : "rgba(69,97,232,0.05)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: isExhausted
              ? "1px solid rgba(245,158,11,0.28)"
              : "1px solid rgba(120,140,255,0.22)",
            color: isExhausted ? "#f59e0b" : "#7c9cff",
            boxShadow: isExhausted
              ? "0 2px 16px rgba(245,158,11,0.10), inset 0 1px 0 rgba(255,255,255,0.10)"
              : "0 2px 16px rgba(69,97,232,0.08), inset 0 1px 0 rgba(255,255,255,0.10)",
            letterSpacing: "0.02em",
          }}
        >
          {/* Clock SVG */}
          <svg
            width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: 0.85, flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="tabular-nums">{formatCountdown(msLeft!)}</span>
        </span>
      )}
    </div>
  );
}
