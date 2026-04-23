"use client";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  forceDark?: boolean;
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="11" height="11" style={{ display: "block", flexShrink: 0 }}>
      <path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="12" height="12" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="3.2" fill="currentColor" opacity="0.9" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        <line x1="8" y1="1" x2="8" y2="2.5" />
        <line x1="8" y1="13.5" x2="8" y2="15" />
        <line x1="1" y1="8" x2="2.5" y2="8" />
        <line x1="13.5" y1="8" x2="15" y2="8" />
        <line x1="3.05" y1="3.05" x2="4.1" y2="4.1" />
        <line x1="11.9" y1="11.9" x2="12.95" y2="12.95" />
        <line x1="12.95" y1="3.05" x2="11.9" y2="4.1" />
        <line x1="4.1" y1="11.9" x2="3.05" y2="12.95" />
      </g>
    </svg>
  );
}

export default function ThemeToggle({ className = "", forceDark = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = forceDark || theme === "dark";

  /* Liquid stretch — thumb widens briefly on click */
  const [stretching, setStretching] = useState(false);

  function handleClick() {
    setStretching(true);
    setTimeout(() => setStretching(false), 180);
    toggle();
  }

  /* ── dimensions — compact, proportional to Spline reference ── */
  const TRACK_W = 50;
  const TRACK_H = 26;
  const THUMB_H = 20;
  const THUMB_W = stretching ? 30 : 24;
  const thumbLeft = isDark ? TRACK_W - THUMB_W - 3 : 3;

  return (
    <button
      onClick={handleClick}
      className={`relative focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
      style={{ width: TRACK_W, height: TRACK_H, display: "flex", alignItems: "center", flexShrink: 0 }}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      {/* Track */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 99,
        background: isDark
          ? "linear-gradient(135deg, #4561E8 0%, #2438B0 100%)"
          : "#d1d5db",
        transition: "background 0.25s ease",
        boxShadow: isDark
          ? "inset 0 1px 3px rgba(0,0,0,0.3)"
          : "inset 0 1px 3px rgba(0,0,0,0.15)",
      }} />

      {/* Thumb — liquid glass oval with moon/sun */}
      <div style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left: thumbLeft,
        width: THUMB_W,
        height: THUMB_H,
        borderRadius: 99,
        background: isDark
          ? "rgba(160,185,255,0.22)"
          : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(10px) saturate(1.6)",
        WebkitBackdropFilter: "blur(10px) saturate(1.6)",
        border: isDark
          ? "1px solid rgba(200,220,255,0.45)"
          : "1px solid rgba(255,255,255,0.95)",
        boxShadow: isDark
          ? `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 10px rgba(69,97,232,0.3)`
          : `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,1)`,
        transition: "left 0.22s cubic-bezier(.34,1.56,.64,1), width 0.14s ease, background 0.22s, box-shadow 0.22s",
        willChange: "left, width",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isDark ? "rgba(190,215,255,0.9)" : "rgba(90,110,150,0.85)",
      }}>
        {isDark ? <MoonIcon /> : <SunIcon />}
      </div>
    </button>
  );
}
