"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function daysLabel(n: number, locale: string): string {
  if (locale === "en") return n === 1 ? "day" : "days";
  const m10 = n % 10,
    m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "дней";
  if (m10 === 1) return "день";
  if (m10 >= 2 && m10 <= 4) return "дня";
  return "дней";
}

/**
 * Account-level daily VISIT streak pill (orange). On mount it "touches" the
 * streak for the user's local calendar day via the `touch_login_streak` RPC
 * (idempotent once per day) and renders the current streak. When a real streak
 * (>1) just lapsed, it surfaces a "rebuild your streak / get gifts" hint.
 *
 * Calls the RPC directly through the authenticated browser Supabase client.
 * Renders nothing for guests (RPC errors) or until the value is known, so it
 * can safely sit in the nav on every page.
 */
export default function StreakPill({ locale = "ru" }: { locale?: string }) {
  const [streak, setStreak] = useState<number | null>(null);
  const [wasReset, setWasReset] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // YYYY-MM-DD in the user's local timezone (so the day boundary is their midnight).
    const tzDate = new Date().toLocaleDateString("en-CA");
    const supabase = createClient();
    supabase
      .rpc("touch_login_streak", { p_today: tzDate })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const row = (Array.isArray(data) ? data[0] : data) as
          | { streak?: number; was_reset?: boolean }
          | undefined;
        if (!row) return;
        setStreak(typeof row.streak === "number" ? row.streak : null);
        setWasReset(!!row.was_reset);
        if (row.was_reset) setShowHint(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (streak === null || streak < 1) return null;

  const hintText =
    locale === "en"
      ? "Streak reset — come back every day to rebuild it and earn gifts."
      : "Стрик сброшен — заходи каждый день, копи стрик и получай подарки.";

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        onMouseEnter={() => wasReset && setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 30,
          padding: "0 11px",
          borderRadius: 9999,
          fontWeight: 700,
          fontSize: "0.8125rem",
          lineHeight: 1,
          background: "linear-gradient(155deg, rgba(255,107,53,0.9) 0%, rgba(198,40,40,0.9) 100%)",
          color: "#fff",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 14px rgba(255,80,0,0.4)",
          cursor: wasReset ? "help" : "default",
          userSelect: "none",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14, flexShrink: 0 }}>
          <path
            d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"
            fill="rgba(255,255,255,0.95)"
          />
        </svg>
        <span style={{ lineHeight: 1 }}>
          {streak} {daysLabel(streak, locale)}
        </span>
      </div>

      {wasReset && showHint && (
        <div
          role="status"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 50,
            width: 240,
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(20,20,30,0.97)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {hintText}
        </div>
      )}
    </div>
  );
}
