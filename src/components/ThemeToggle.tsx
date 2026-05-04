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
      <path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8Z" fill="currentColor" opacity="0.95" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="12" height="12" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="3.2" fill="currentColor" opacity="0.95" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.75">
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

function AutoIcon() {
  // Display monitor with system-color split (sun/moon halves)
  return (
    <svg viewBox="0 0 16 16" fill="none" width="11" height="11" style={{ display: "block", flexShrink: 0 }}>
      <rect x="2" y="3" width="12" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 7h12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="6" y1="13.5" x2="10" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="11" x2="8" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function ThemeToggle({ className = "", forceDark = false }: ThemeToggleProps) {
  const { mode, theme, cycle } = useTheme();
  const isDark = forceDark || theme === "dark";
  const isAuto = !forceDark && mode === "system";

  const [stretching, setStretching] = useState(false);

  function handleClick() {
    setStretching(true);
    setTimeout(() => setStretching(false), 180);
    cycle();
  }

  // ── 3-position track: left (light) | middle (auto) | right (dark)
  const TRACK_W = 64;
  const TRACK_H = 26;
  const THUMB_H = 20;
  const THUMB_W = stretching ? 28 : 22;
  const positions = {
    light:  3,
    system: (TRACK_W - THUMB_W) / 2,
    dark:   TRACK_W - THUMB_W - 3,
  };
  const thumbLeft = forceDark ? positions.dark : positions[mode];

  // Visual track gradient hint at all 3 zones
  const trackBg = isDark
    ? "linear-gradient(135deg, #4561E8 0%, #2438B0 100%)"
    : isAuto
    ? "linear-gradient(135deg, #d1d5db 0%, #6B8FFF 50%, #1f2a4d 100%)"
    : "#d1d5db";

  const tooltip =
    forceDark ? "Тёмная тема" :
    mode === "system" ? "Системная (следует за устройством) · клик: тёмная" :
    mode === "light"  ? "Светлая · клик: системная" :
                        "Тёмная · клик: светлая";

  // Icon shown inside the thumb based on effective state
  const thumbIcon = isAuto ? <AutoIcon /> : isDark ? <MoonIcon /> : <SunIcon />;

  return (
    <button
      onClick={handleClick}
      className={`relative focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
      style={{ width: TRACK_W, height: TRACK_H, display: "flex", alignItems: "center", flexShrink: 0 }}
      aria-label={tooltip}
      title={tooltip}
    >
      {/* Track */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 99,
        background: trackBg,
        transition: "background 0.25s ease",
        boxShadow: isDark
          ? "inset 0 1px 3px rgba(0,0,0,0.3)"
          : "inset 0 1px 3px rgba(0,0,0,0.15)",
      }} />

      {/* 3 background hint markers (only show when not forceDark) */}
      {!forceDark && (
        <>
          <span style={{
            position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            width: 8, height: 8, color: mode === "light" ? "transparent" : "rgba(255,255,255,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.2s",
          }}>
            <SunIcon />
          </span>
          <span style={{
            position: "absolute", left: TRACK_W / 2 - 4, top: "50%", transform: "translateY(-50%)",
            color: mode === "system" ? "transparent" : "rgba(255,255,255,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.2s",
          }}>
            <AutoIcon />
          </span>
          <span style={{
            position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
            color: mode === "dark" ? "transparent" : "rgba(255,255,255,0.34)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.2s",
          }}>
            <MoonIcon />
          </span>
        </>
      )}

      {/* Thumb */}
      <div style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        left: thumbLeft, width: THUMB_W, height: THUMB_H,
        borderRadius: 99,
        background: isDark
          ? "rgba(160,185,255,0.25)"
          : isAuto
          ? "rgba(255,255,255,0.95)"
          : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px) saturate(1.6)",
        WebkitBackdropFilter: "blur(10px) saturate(1.6)",
        border: isDark
          ? "1px solid rgba(200,220,255,0.45)"
          : "1px solid rgba(255,255,255,0.95)",
        boxShadow: isDark
          ? `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 10px rgba(69,97,232,0.3)`
          : `0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)`,
        transition: "left 0.22s cubic-bezier(.34,1.56,.64,1), width 0.14s ease, background 0.22s, box-shadow 0.22s",
        willChange: "left, width",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: isDark ? "rgba(190,215,255,0.95)" : isAuto ? "rgba(80,100,150,0.85)" : "rgba(90,110,150,0.85)",
        zIndex: 1,
      }}>
        {thumbIcon}
      </div>
    </button>
  );
}
