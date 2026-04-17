import type { CSSProperties } from "react";

interface Config {
  abbrev: string;
  from: string;
  to: string;
}

const META: Record<string, Config> = {
  "russian-history":  { abbrev: "ИС", from: "#E85656", to: "#C02828" },
  "world-history":    { abbrev: "МИ", from: "#4561E8", to: "#2940C0" },
  "mathematics":      { abbrev: "МА", from: "#8B5CF6", to: "#6238C8" },
  "physics":          { abbrev: "ФИ", from: "#0EA5E9", to: "#0878B8" },
  "chemistry":        { abbrev: "ХИ", from: "#10B981", to: "#0A8A5E" },
  "biology":          { abbrev: "БИ", from: "#16A34A", to: "#0E7235" },
  "russian-language": { abbrev: "РЯ", from: "#DC2626", to: "#A41C1C" },
  "literature":       { abbrev: "ЛИ", from: "#D97706", to: "#A85500" },
  "english":          { abbrev: "EN", from: "#3B82F6", to: "#1A5FD4" },
  "social-studies":   { abbrev: "ОБ", from: "#6366F1", to: "#4244C8" },
  "geography":        { abbrev: "ГЕ", from: "#0D9488", to: "#097268" },
  "computer-science": { abbrev: "ИТ", from: "#475569", to: "#2D3A4A" },
  "astronomy":        { abbrev: "АС", from: "#7C3AED", to: "#5820B8" },
  "discovery":        { abbrev: "КР", from: "#FF7A00", to: "#CC5500" },
};

const FALLBACK: Config = { abbrev: "??", from: "#6b7280", to: "#4b5563" };

interface Props {
  id: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Force white text (for use on dark card backgrounds) */
  light?: boolean;
}

export default function SubjectIcon({ id, size = 40, className, style, light }: Props) {
  const cfg = META[id] ?? FALLBACK;
  const fontSize = Math.round(size * 0.34);
  const radius = Math.round(size * 0.28);

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
        ...style,
      }}
    >
      <span
        style={{
          color: light ? "rgba(255,255,255,0.95)" : "#fff",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
          userSelect: "none",
        }}
      >
        {cfg.abbrev}
      </span>
    </div>
  );
}

/** Returns the gradient start color for a subject id (for accent lines, etc.) */
export function subjectColor(id: string): string {
  return (META[id] ?? FALLBACK).from;
}
