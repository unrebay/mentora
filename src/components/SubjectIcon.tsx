"use client";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

// ── Per-subject gradient colours ───────────────────────────────────────────
const META: Record<string, { from: string; to: string }> = {
  "russian-history":  { from: "#E85656", to: "#B82020" },
  "world-history":    { from: "#4561E8", to: "#2438B0" },
  "mathematics":      { from: "#8B5CF6", to: "#5B28D0" },
  "physics":          { from: "#0EA5E9", to: "#0870B0" },
  "chemistry":        { from: "#10B981", to: "#067050" },
  "biology":          { from: "#22C55E", to: "#0F7A32" },
  "russian-language": { from: "#EF4444", to: "#B01010" },
  "literature":       { from: "#F59E0B", to: "#B06000" },
  "english":          { from: "#3B82F6", to: "#1848C0" },
  "social-studies":   { from: "#6366F1", to: "#3730A3" },
  "geography":        { from: "#14B8A6", to: "#0A7A6A" },
  "computer-science": { from: "#64748B", to: "#334155" },
  "astronomy":        { from: "#7C3AED", to: "#4C1598" },
  "discovery":        { from: "#8BB8CC", to: "#4A7080" },
  "spanish":          { from: "#EF4444", to: "#B91C1C" },
  "german":           { from: "#374151", to: "#1F2937" },
  "french":           { from: "#3B82F6", to: "#1D4ED8" },
};

const FALLBACK = { from: "#6b7280", to: "#4b5563" };

// ── Individual SVG icons (24×24 viewBox, stroke-based) ─────────────────────

function RussianHistoryIcon() {
  // Kremlin-style tower with star
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M5 21V11l7-4 7 4v10H5Z" />
      <path d="M9 21v-6h6v6" />
      <path d="M12 7V4" />
      <path d="M10.5 4l1.5-2 1.5 2" />
      <path d="M3 21h18" />
    </svg>
  );
}

function WorldHistoryIcon() {
  // Globe with meridians
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18" />
      <path d="M3.5 9h17M3.5 15h17" />
    </svg>
  );
}

function MathematicsIcon() {
  // Pi symbol (π) — clean and recognisable
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M5 7h14" />
      <path d="M9 7v9a2 2 0 0 1-2 2" />
      <path d="M15 7v6c0 2 1 3 2 3" />
    </svg>
  );
}

function PhysicsIcon() {
  // Atom — nucleus + 3 elliptic orbits
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
    </svg>
  );
}

function ChemistryIcon() {
  // Erlenmeyer flask with liquid
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M9 3h6M10 3v6l-5 9a1 1 0 0 0 .9 1.5h12.2A1 1 0 0 0 19 18l-5-9V3" />
      <path d="M8.5 16h7" />
    </svg>
  );
}

function BiologyIcon() {
  // DNA double helix (simplified)
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M7 3c4 2 6 4 6 9s-2 7-6 9" />
      <path d="M17 3c-4 2-6 4-6 9s2 7 6 9" />
      <path d="M9 9h6M9 15h6" />
    </svg>
  );
}

function RussianLanguageIcon() {
  // Open book
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M2 4v16a1 1 0 0 0 1 1h8v-1a2 2 0 0 1 2 0v1h8a1 1 0 0 0 1-1V4" />
      <path d="M12 4v16" />
      <path d="M2 4c0-1 2-2 5-2s5 1 5 2" />
      <path d="M12 4c0-1 2-2 5-2s5 1 5 2" />
      <path d="M5 9h5M5 13h4" />
    </svg>
  );
}

function LiteratureIcon() {
  // Feather quill with ink
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M20 4C14 4 9 8 8 14l-3 7 4-2c2-1 3-2 4-4 4-1 8-4 9-11Z" />
      <path d="M8 14c1-3 3-5 6-7" />
      <path d="M5 21l3-7" />
    </svg>
  );
}

function EnglishIcon() {
  // Speech bubble with "EN"
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M21 11.5A8.38 8.38 0 0 1 12.5 20c-1.8 0-3.5-.5-4.9-1.4L3 20l1.4-4.6A8.5 8.5 0 1 1 21 11.5Z" />
      <text x="5.5" y="14" fontSize="6.5" fontWeight="700" fontFamily="system-ui,sans-serif" fill="currentColor" stroke="none" letterSpacing="0.3">EN</text>
    </svg>
  );
}

function SpanishIcon() {
  // Speech bubble with "ES"
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M21 11.5A8.38 8.38 0 0 1 12.5 20c-1.8 0-3.5-.5-4.9-1.4L3 20l1.4-4.6A8.5 8.5 0 1 1 21 11.5Z" />
      <text x="5.5" y="14" fontSize="6.5" fontWeight="700" fontFamily="system-ui,sans-serif" fill="currentColor" stroke="none" letterSpacing="0.3">ES</text>
    </svg>
  );
}

function GermanIcon() {
  // Speech bubble with "DE"
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M21 11.5A8.38 8.38 0 0 1 12.5 20c-1.8 0-3.5-.5-4.9-1.4L3 20l1.4-4.6A8.5 8.5 0 1 1 21 11.5Z" />
      <text x="5.5" y="14" fontSize="6.5" fontWeight="700" fontFamily="system-ui,sans-serif" fill="currentColor" stroke="none" letterSpacing="0.3">DE</text>
    </svg>
  );
}

function FrenchIcon() {
  // Speech bubble with "FR"
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M21 11.5A8.38 8.38 0 0 1 12.5 20c-1.8 0-3.5-.5-4.9-1.4L3 20l1.4-4.6A8.5 8.5 0 1 1 21 11.5Z" />
      <text x="5.5" y="14" fontSize="6.5" fontWeight="700" fontFamily="system-ui,sans-serif" fill="currentColor" stroke="none" letterSpacing="0.3">FR</text>
    </svg>
  );
}

function SocialStudiesIcon() {
  // Two people silhouettes
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      <path d="M16 3.1a3 3 0 0 1 0 5.8" />
      <path d="M21 21v-2a5 5 0 0 0-3-4.6" />
    </svg>
  );
}

function GeographyIcon() {
  // Globe with location pin
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M12 2C8.7 2 6 4.7 6 8c0 5 6 14 6 14s6-9 6-14c0-3.3-2.7-6-6-6Z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  );
}

function ComputerScienceIcon() {
  // Code brackets </>
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M16 18l6-6-6-6" />
      <path d="M8 6L2 12l6 6" />
      <path d="M12 4l-1.5 16" />
    </svg>
  );
}

function AstronomyIcon() {
  // Saturn-like planet with ring
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <circle cx="12" cy="12" r="5" />
      <path d="M3 8c2 1 11 6 18 5" />
      <path d="M3 8c0-1 1-2 3-1" />
      <path d="M21 13c0 1-1 2-3 1" />
    </svg>
  );
}

function DiscoveryIcon() {
  // Lightbulb / idea
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M12 2a7 7 0 0 1 5 11.8l-.7 1.2H7.7L7 13.8A7 7 0 0 1 12 2Z" />
      <path d="M9 18h6M10 21h4" />
      <path d="M12 6v2M8.5 7.5l1.5 1.5M15.5 7.5l-1.5 1.5" />
    </svg>
  );
}

// ── Icon map ────────────────────────────────────────────────────────────────
const ICONS: Record<string, ReactNode> = {
  "russian-history":  <RussianHistoryIcon />,
  "world-history":    <WorldHistoryIcon />,
  "mathematics":      <MathematicsIcon />,
  "physics":          <PhysicsIcon />,
  "chemistry":        <ChemistryIcon />,
  "biology":          <BiologyIcon />,
  "russian-language": <RussianLanguageIcon />,
  "literature":       <LiteratureIcon />,
  "english":          <EnglishIcon />,
  "social-studies":   <SocialStudiesIcon />,
  "geography":        <GeographyIcon />,
  "computer-science": <ComputerScienceIcon />,
  "astronomy":        <AstronomyIcon />,
  "discovery":        <DiscoveryIcon />,
  "spanish":          <SpanishIcon />,
  "german":           <GermanIcon />,
  "french":           <FrenchIcon />,
};

// ── Component ───────────────────────────────────────────────────────────────
interface Props {
  id: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Force white/light icon (for use on dark card backgrounds) */
  light?: boolean;
}

export default function SubjectIcon({ id, size = 40, className, style, light: _light }: Props) {
  const cfg = META[id] ?? FALLBACK;
  const radius = Math.round(size * 0.28);
  const padding = Math.round(size * 0.22);
  const glow = cfg.from + "88"; // 53% opacity glow

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${cfg.from} 0%, ${cfg.to} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        padding,
        color: "rgba(255,255,255,0.95)",
        boxSizing: "border-box",
        /* 3D Lambertian shading */
        boxShadow: `0 1px 0 rgba(255,255,255,0.22) inset,
                    0 -2px 0 rgba(0,0,0,0.22) inset,
                    0 4px 12px ${glow},
                    0 2px 4px rgba(0,0,0,0.35)`,
        ...style,
      }}
    >
      {ICONS[id] ?? (
        // Fallback: first two letters if no icon defined
        <span style={{ fontSize: Math.round(size * 0.32), fontWeight: 700, lineHeight: 1, userSelect: "none" }}>
          {id.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/* ── SubjectCard3D — hover-lift card wrapping a SubjectIcon ─────────────── */

interface CardProps {
  id: string;
  label: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function SubjectCard3D({ id, label, size = 52, className = "", onClick }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = META[id] ?? FALLBACK;
  const glow = cfg.from;

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        padding: "18px 14px",
        borderRadius: 18,
        background: hovered ? `${cfg.from}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? cfg.from + "50" : "rgba(255,255,255,0.07)"}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-4px) scale(1.04)" : "none",
        boxShadow: hovered ? `0 12px 36px ${glow}30, 0 4px 16px rgba(0,0,0,0.25)` : "none",
        userSelect: "none",
        minWidth: 80,
      }}
    >
      <SubjectIcon id={id} size={size} />
      {label && (
        <span style={{
          color: hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
          fontSize: 12, fontWeight: 600,
          textAlign: "center", lineHeight: 1.3,
          transition: "color 0.18s",
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

/** Returns the gradient start colour for a subject id (for accent lines, etc.) */
export function subjectColor(id: string): string {
  return (META[id] ?? FALLBACK).from;
}
