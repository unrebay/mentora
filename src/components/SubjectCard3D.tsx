"use client";
import { useState } from "react";
import { SUBJECT_ICONS, SUBJECT_META_COLORS } from "@/components/SubjectIcon";

interface Props {
  id: string;
  label?: string;
  /** Icon size (the full card will be slightly larger) */
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * iOS-style glassmorphism icon card.
 * Two layers: solid colour card behind + frosted glass card on top with the SVG icon.
 * Hover: lifts, glows, glass brightens.
 */
export default function SubjectCard3D({ id, label, size = 64, className = "", onClick }: Props) {
  const [hovered, setHovered] = useState(false);

  const meta = SUBJECT_META_COLORS[id] ?? { from: "#6b7280", to: "#4b5563" };
  const icon = SUBJECT_ICONS[id] ?? (
    <span style={{ fontSize: Math.round(size * 0.3), fontWeight: 800, lineHeight: 1 }}>
      {id.slice(0, 2).toUpperCase()}
    </span>
  );

  // Layout: solid card offset bottom-right, glass card top-left (matches Spline "Frosted Glass Icons")
  const offset = Math.round(size * 0.13);
  const cardSize = size - offset;
  const radius = Math.round(cardSize * 0.26);
  const iconPad = Math.round(cardSize * 0.2);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "14px 10px",
        borderRadius: 20,
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.18s ease",
        transform: hovered ? "translateY(-5px) scale(1.06)" : "none",
        userSelect: "none",
        minWidth: 72,
      }}
    >
      {/* Icon — two-layer glassmorphism */}
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>

        {/* ① Solid colour card — bottom-right, "shadow" layer */}
        <div style={{
          position: "absolute",
          bottom: 0, right: 0,
          width: cardSize, height: cardSize,
          borderRadius: radius,
          background: `linear-gradient(135deg, ${meta.from} 0%, ${meta.to} 100%)`,
          transition: "transform 0.18s ease, opacity 0.18s",
          opacity: hovered ? 1 : 0.88,
          transform: hovered ? "scale(1.04)" : "none",
        }} />

        {/* ② Frosted glass card — top-left, icon layer */}
        <div style={{
          position: "absolute",
          top: 0, left: 0,
          width: cardSize, height: cardSize,
          borderRadius: radius,
          /* Glass effect */
          background: hovered
            ? "rgba(255,255,255,0.28)"
            : "rgba(255,255,255,0.18)",
          backdropFilter: "blur(14px) saturate(1.6)",
          WebkitBackdropFilter: "blur(14px) saturate(1.6)",
          border: "1.5px solid rgba(255,255,255,0.55)",
          boxShadow: hovered
            ? `0 6px 32px rgba(0,0,0,0.22),
               inset 0 1.5px 0 rgba(255,255,255,0.85),
               inset 0 -1px 0 rgba(255,255,255,0.15),
               0 0 28px ${meta.from}55`
            : `0 4px 18px rgba(0,0,0,0.16),
               inset 0 1.5px 0 rgba(255,255,255,0.75),
               inset 0 -1px 0 rgba(255,255,255,0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: iconPad,
          boxSizing: "border-box",
          color: "rgba(255,255,255,0.95)",
          transition: "background 0.18s, box-shadow 0.18s",
        }}>
          {icon}
        </div>
      </div>

      {/* Label */}
      {label && (
        <span style={{
          color: hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
          fontSize: 12, fontWeight: 600,
          textAlign: "center", lineHeight: 1.3,
          transition: "color 0.18s",
          fontFamily: "system-ui, sans-serif",
          maxWidth: 72,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
