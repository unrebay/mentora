"use client";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  forceDark?: boolean;
}

export default function ThemeToggle({ className = "", forceDark = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = forceDark || theme === "dark";

  /* ── dimensions ── */
  const TRACK_W = 56;
  const TRACK_H = 30;
  // Glass thumb is wider than half-track, extends slightly past the edge
  const THUMB_W = 36;
  const THUMB_H = 36;

  return (
    <button
      onClick={toggle}
      className={`relative focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
      style={{ width: TRACK_W, height: THUMB_H, display: "flex", alignItems: "center" }}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      {/* Track — solid pill */}
      <div style={{
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: 99,
        background: isDark
          ? "linear-gradient(135deg, #4561E8 0%, #2438B0 100%)"
          : "#d1d5db",
        transition: "background 0.25s ease",
      }} />

      {/* Glass thumb — slides left/right, slightly overhangs track height */}
      <div style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left: isDark ? TRACK_W - THUMB_W + 2 : -2,
        width: THUMB_W,
        height: THUMB_H,
        borderRadius: 99,
        /* Glassmorphism */
        background: isDark
          ? "rgba(120,150,255,0.28)"
          : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px) saturate(1.8)",
        WebkitBackdropFilter: "blur(12px) saturate(1.8)",
        border: isDark
          ? "1.5px solid rgba(180,200,255,0.55)"
          : "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: isDark
          ? `0 4px 20px rgba(0,0,0,0.35),
             inset 0 1.5px 0 rgba(255,255,255,0.5),
             inset 0 -1px 0 rgba(255,255,255,0.15),
             0 0 16px rgba(69,97,232,0.45)`
          : `0 4px 20px rgba(0,0,0,0.18),
             inset 0 1.5px 0 rgba(255,255,255,1),
             inset 0 -1px 0 rgba(0,0,0,0.06)`,
        transition: "left 0.22s cubic-bezier(.34,1.56,.64,1), background 0.22s, box-shadow 0.22s",
        willChange: "left",
      }} />
    </button>
  );
}
