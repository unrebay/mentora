/**
 * MeLogo — фирменный символ «Mе» как SVG.
 * SVG-текст даёт точное позиционирование без проблем с line-height/baseline
 * при смешивании Playfair (latin M) и Georgia fallback (кириллическая е).
 *
 * Пресеты:
 *   <MeLogo />                         — M тёмный, е синий (светлая тема)
 *   <MeLogo variant="white" />         — M белый, е синий (тёмный фон / карточки)
 *   <MeLogo variant="muted" />         — M и е серые (неактивный контекст)
 *   <MeLogo colorM="…" colorE="…" />  — произвольные цвета (карточки предметов)
 */

import type { CSSProperties } from "react";

interface Props {
  /** Пресет цветов */
  variant?: "default" | "white" | "muted";
  /** Цвет буквы M (переопределяет variant) */
  colorM?: string;
  /** Цвет буквы е (переопределяет variant) */
  colorE?: string;
  /** Высота SVG в px (ширина пропорциональна) */
  height?: number;
  className?: string;
  style?: CSSProperties;
}

const VARIANTS = {
  default: { m: "var(--text)",          e: "#4561E8" },
  white:   { m: "rgba(255,255,255,0.95)", e: "rgba(255,255,255,0.75)" },
  muted:   { m: "var(--text-muted)",    e: "var(--text-muted)" },
};

export default function MeLogo({
  variant = "default",
  colorM,
  colorE,
  height = 18,
  className,
  style,
}: Props) {
  const preset = VARIANTS[variant];
  const cM = colorM ?? preset.m;
  const cE = colorE ?? preset.e;

  // viewBox: 23×16. Playfair M700 ≈13px, Georgia italic е ≈9px, gap −0.5px.
  // Baseline at y=13 (cap-height fills 0..13, 13..16 — descender space).
  const vw = 23;
  const vh = 16;
  const w = Math.round(height * (vw / vh) * 10) / 10;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      width={w}
      height={height}
      aria-hidden="true"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      <text
        x="0"
        y="13"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontWeight="700"
        fontSize="15"
        letterSpacing="-0.4"
      >
        <tspan fill={cM}>M</tspan>
        <tspan fill={cE} fontStyle="italic">е</tspan>
      </text>
    </svg>
  );
}
