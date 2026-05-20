import type { ReactNode } from "react";
import MeLogo from "@/components/MeLogo";

/* ── Icon presets (refreshed 2026-05-20 to match /analytics polish) ─────── */

export function MentIcon() {
  return <MeLogo height={26} colorM="var(--brand)" colorE="var(--brand)" />;
}

export function FlameIcon() {
  // Layered flame: outer warm body + inner core highlight + tiny spark.
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <defs>
        <linearGradient id="flameOuter" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB347" />
          <stop offset="0.55" stopColor="#FF7A00" />
          <stop offset="1" stopColor="#E54B00" />
        </linearGradient>
        <linearGradient id="flameInner" x1="12" y1="9" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE39A" />
          <stop offset="1" stopColor="#FFB347" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5c0 4 4 5 4 9.5 0 3.5-1.8 6.5-4 7-2.2-.5-4-3.5-4-7 0-1.5.5-2.6 1.1-3.6.6-1 .9-2 .9-3.4 0-1 .4-1.9 1-2.5h1z"
        fill="url(#flameOuter)"
      />
      <path
        d="M12 9c1.4 2.2 2.5 3.6 2.5 5.8 0 2.1-1.2 3.6-2.5 4-1.3-.4-2.5-1.9-2.5-4 0-2 .8-3.5 2.5-5.8z"
        fill="url(#flameInner)"
      />
      <circle cx="14.5" cy="6.5" r="0.9" fill="#FFE39A" opacity="0.8" />
    </svg>
  );
}

export function MessageIcon() {
  // Speech bubble with 3 dots inside — softer, modern, with tail.
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <defs>
        <linearGradient id="msgBubble" x1="4" y1="3" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path
        d="M4.5 4h15c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H9l-3.6 3.4c-.5.5-1.4.1-1.4-.6V5.5C4 4.7 4.2 4 4.5 4z"
        fill="url(#msgBubble)"
      />
      <circle cx="9" cy="10.5" r="1.1" fill="#ffffff" opacity="0.95" />
      <circle cx="12" cy="10.5" r="1.1" fill="#ffffff" opacity="0.95" />
      <circle cx="15" cy="10.5" r="1.1" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

export function StarIcon({ color = "#f59e0b" }: { color?: string }) {
  // 5-point star with inner highlight for depth.
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <defs>
        <linearGradient id="starOuter" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FCD34D" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="url(#starOuter)"
      />
      <path
        d="M12 4.8l2.1 4.27 4.7.68-3.4 3.31 0.8 4.7L12 15.5V4.8z"
        fill="#FFFFFF"
        opacity="0.18"
      />
    </svg>
  );
}

export function TrophyIcon() {
  // Golden trophy — для rank-карточки на /profile (раньше был inline path).
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <defs>
        <linearGradient id="trophyGold" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path
        d="M7 4h10v3a5 5 0 0 1-10 0V4zm-3 0h2v3a3 3 0 0 1-2 2.83V4zm14 0h2v5.83A3 3 0 0 1 18 7V4zM9 13h6l-.5 3h-5l-.5-3zM8 18h8v2H8v-2z"
        fill="url(#trophyGold)"
      />
      <path d="M11 9.5c0-1.2.5-2 1-2.5.5.5 1 1.3 1 2.5h-2z" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}

/* ── StatCard component (refreshed) ──────────────────────────────────────
 * Glass card with accent gradient tint + colored stripe on top + spotlight.
 * Matches the StatCard visual style on /analytics so /profile no longer
 * looks dated next to it.
 */

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
  /** Use brand styling (Мент card) — subtle blue tint wrapper */
  isBrand?: boolean;
}

export default function StatCard({ label, value, icon, accent, isBrand }: StatCardProps) {
  // Brand card uses CSS var --brand; for gradient/spotlight we substitute a hex.
  const a = isBrand ? "#4561E8" : accent;
  return (
    <div
      data-tilt
      data-tilt-strength="5"
      className="rounded-2xl p-4 border text-center relative overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(160deg, ${a}14, ${a}05 60%, transparent), var(--bg-card)`,
        borderColor: `${a}30`,
        backdropFilter: "blur(14px) saturate(1.3)",
        WebkitBackdropFilter: "blur(14px) saturate(1.3)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px ${a}12, 0 6px 20px rgba(0,0,0,0.04)`,
      }}
    >
      {/* Color stripe on top */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${a}, transparent)`, opacity: 0.7 }}
        aria-hidden
      />
      {/* Spotlight in top-right */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          top: -30, right: -30, width: 100, height: 100, opacity: 0.5,
          background: `radial-gradient(circle at center, ${a}38, transparent 65%)`,
          filter: "blur(8px)",
        }}
      />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 relative"
        style={{
          background: `linear-gradient(135deg, ${a}30, ${a}10)`,
          border: `1px solid ${a}30`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px ${a}22`,
        }}
      >
        {icon}
      </div>
      <div className="font-bold text-xl relative" style={{ color: "var(--text)" }}>
        {value.toLocaleString("ru-RU")}
      </div>
      <div className="text-xs mt-0.5 relative" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}
