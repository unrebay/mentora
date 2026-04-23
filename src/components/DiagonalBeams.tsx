"use client";
import type { CSSProperties } from "react";

/**
 * DiagonalBeams — CSS-only animated diagonal light beam effect.
 * Inspired by Spline's "Chasing Sunsets" style, but in brand blue/indigo.
 * Zero dependencies, no iframe, no errors.
 *
 * Place as absolute/fixed child with pointer-events-none.
 */

interface DiagonalBeamsProps {
  /** Number of beam stripes */
  count?: number;
  /** Rotation angle of the beam cluster */
  angle?: number;
  /** Primary beam color (CSS color) */
  color?: string;
  /** Secondary/accent color for center beams */
  accentColor?: string;
  /** Overall opacity multiplier */
  intensity?: number;
  /** Whether to animate (subtle breathing) */
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function DiagonalBeams({
  count = 8,
  angle = -42,
  color = "rgba(69,97,232,1)",
  accentColor = "rgba(107,135,255,1)",
  intensity = 1,
  animate = true,
  className = "",
  style,
}: DiagonalBeamsProps) {
  // Each beam: index, width, opacity relative to center
  const beams = Array.from({ length: count }, (_, i) => {
    const center = (count - 1) / 2;
    const dist = Math.abs(i - center) / center; // 0 at center, 1 at edges
    const opacity = (1 - dist * 0.85) * intensity;
    const width = Math.max(6, 28 - dist * 16);
    return { i, opacity, width };
  });

  const totalWidth = beams.reduce((s, b) => s + b.width + 4, 0);

  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{
        inset: 0,
        overflow: "hidden",
        ...style,
      }}
      aria-hidden
    >
      <style>{`
        @keyframes beamBreathe {
          0%, 100% { opacity: 0.85; transform: scaleY(1); }
          50%       { opacity: 1;    transform: scaleY(1.04); }
        }
        @keyframes beamShimmer {
          0%   { transform: translateY(-4%) scaleX(1); }
          50%  { transform: translateY(4%)  scaleX(1.015); }
          100% { transform: translateY(-4%) scaleX(1); }
        }
      `}</style>

      {/* Outer glow blob behind the beams */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: Math.min(totalWidth * 2.2, 700),
          height: Math.min(totalWidth * 2.2, 700),
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color.replace("1)", "0.18)")} 0%, transparent 65%)`,
          filter: "blur(60px)",
          animation: animate ? "beamBreathe 6s ease-in-out infinite" : "none",
        }}
      />

      {/* Beam cluster wrapper — rotated */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          display: "flex",
          gap: 4,
          alignItems: "center",
          animation: animate ? "beamShimmer 8s ease-in-out infinite" : "none",
          transformOrigin: "center center",
        }}
      >
        {beams.map(({ i, opacity, width }) => {
          // Interpolate color: outer beams get primary, center gets accent
          const center = (count - 1) / 2;
          const t = 1 - Math.abs(i - center) / center;

          return (
            <div
              key={i}
              style={{
                width,
                height: "120vh",
                borderRadius: width / 2,
                opacity,
                background: `linear-gradient(
                  to bottom,
                  transparent 0%,
                  ${color.replace("1)", `${t * 0.4})`)} 15%,
                  ${t > 0.6 ? accentColor.replace("1)", `${t * 0.9})`) : color.replace("1)", `${t * 0.7})`)} 40%,
                  ${t > 0.8 ? accentColor.replace("1)", "0.95)") : color.replace("1)", `${t * 0.6})`)} 50%,
                  ${t > 0.6 ? accentColor.replace("1)", `${t * 0.9})`) : color.replace("1)", `${t * 0.7})`)} 60%,
                  ${color.replace("1)", `${t * 0.4})`)} 85%,
                  transparent 100%
                )`,
                filter: `blur(${Math.max(0, (1 - t) * 3)}px)`,
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Soft noise grain overlay — depth/texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
          opacity: 0.5,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
