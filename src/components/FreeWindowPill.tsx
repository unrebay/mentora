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

const glass = {
  backdropFilter: "blur(20px) saturate(1.8)",
  WebkitBackdropFilter: "blur(20px) saturate(1.8)",
  boxShadow: "0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
} as const;

export default function FreeWindowPill({ remaining, limit, windowResetAt }: Props) {
  const [msLeft, setMsLeft] = useState<number | null>(
    windowResetAt ? Math.max(0, new Date(windowResetAt).getTime() - Date.now()) : null
  );

  useEffect(() => {
    if (!windowResetAt) return;
    const tick = () => {
      const ms = Math.max(0, new Date(windowResetAt).getTime() - Date.now());
      setMsLeft(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowResetAt]);

  const isLow = remaining <= 3;
  const showTimer = windowResetAt !== null && msLeft !== null && msLeft > 0;

  return (
    <span
      className="inline-flex items-center gap-2 select-none"
      style={{
        ...glass,
        background: isLow ? "rgba(245,158,11,0.07)" : "var(--bg-nav)",
        border: `1px solid ${isLow ? "rgba(245,158,11,0.30)" : "var(--border-light)"}`,
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 600,
        color: isLow ? "#f59e0b" : "var(--text-secondary)",
      }}
    >
      <span className="tabular-nums" style={{ color: isLow ? "#f59e0b" : "var(--text)", fontWeight: 700 }}>
        {remaining}/{limit}
      </span>
      {showTimer && (
        <>
          <span style={{ opacity: 0.25, fontWeight: 300 }}>·</span>
          <span
            className="inline-flex items-center gap-1 tabular-nums font-mono"
            style={{ fontSize: 12, color: isLow ? "#f59e0b" : "#7c9cff" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {formatCountdown(msLeft!)}
          </span>
        </>
      )}
    </span>
  );
}
