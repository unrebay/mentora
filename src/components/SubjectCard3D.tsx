"use client";
import { useState } from "react";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";

interface Props {
  id: string;
  label?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function SubjectCard3D({ id, label, size = 52, className = "", onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = subjectColor(id);

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
        background: hovered ? `${color}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? color + "50" : "rgba(255,255,255,0.07)"}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-4px) scale(1.04)" : "none",
        boxShadow: hovered ? `0 12px 36px ${color}30, 0 4px 16px rgba(0,0,0,0.25)` : "none",
        userSelect: "none",
        minWidth: 80,
      }}
    >
      <div style={{
        filter: hovered ? `drop-shadow(0 0 10px ${color}99)` : "none",
        transition: "filter 0.18s",
      }}>
        <SubjectIcon id={id} size={size} />
      </div>
      {label && (
        <span style={{
          color: hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
          fontSize: 12, fontWeight: 600,
          textAlign: "center", lineHeight: 1.3,
          transition: "color 0.18s",
          fontFamily: "system-ui, sans-serif",
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
