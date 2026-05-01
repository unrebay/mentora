"use client";

/**
 * SphereBlobScene — Spline-style 3D CSS spheres floating in a dark void.
 *
 * Each sphere uses a radial-gradient from a bright highlight (top-left) to a
 * near-black shadow (bottom-right) to simulate Lambertian shading — giving the
 * illusion of a lit 3D object without any WebGL.
 *
 * Drop this into any dark-background container as an absolutely-positioned layer.
 */

interface SphereConfig {
  /** CSS color string for the radial gradient stop palette */
  highlight: string;
  mid: string;
  shadow: string;
  deepShadow: string;
  /** Outer glow colour (rgba) */
  glow: string;
  size: number;
  top?: string; bottom?: string; left?: string; right?: string;
  /** Which keyframe animation to use */
  float: "sphereFloat1" | "sphereFloat2" | "sphereFloat3" | "sphereFloat4";
  duration: string;
  delay?: string;
  /** 0-1 — how visible / prominent this sphere is */
  opacity?: number;
}

const DEFAULT_SPHERES: SphereConfig[] = [
  // Large blue — upper-right
  {
    highlight: "#B8CCFF",
    mid: "#4561E8",
    shadow: "#1A2A8A",
    deepShadow: "#060820",
    glow: "rgba(69,97,232,0.55)",
    size: 340,
    top: "-8%", right: "-4%",
    float: "sphereFloat1",
    duration: "9s",
    opacity: 0.92,
  },
  // Medium orange — lower-left
  {
    highlight: "#FFD08C",
    mid: "#FF7A00",
    shadow: "#7A3800",
    deepShadow: "#200E00",
    glow: "rgba(255,122,0,0.45)",
    size: 220,
    bottom: "2%", left: "-3%",
    float: "sphereFloat2",
    duration: "11s",
    delay: "1.5s",
    opacity: 0.85,
  },
  // Small purple — mid-left
  {
    highlight: "#D4B8FF",
    mid: "#7C3AED",
    shadow: "#2E1278",
    deepShadow: "#0A0418",
    glow: "rgba(124,58,237,0.4)",
    size: 140,
    top: "38%", left: "10%",
    float: "sphereFloat3",
    duration: "13s",
    delay: "3s",
    opacity: 0.8,
  },
  // Tiny teal accent — upper-left
  {
    highlight: "#9FFFFF",
    mid: "#00C9E0",
    shadow: "#005A66",
    deepShadow: "#001A1F",
    glow: "rgba(0,201,224,0.35)",
    size: 88,
    top: "12%", left: "22%",
    float: "sphereFloat4",
    duration: "15s",
    delay: "5s",
    opacity: 0.7,
  },
];

interface Props {
  spheres?: SphereConfig[];
  /** Extra className on the wrapper */
  className?: string;
  /** Overall opacity multiplier for the scene */
  intensity?: number;
}

export default function SphereBlobScene({
  spheres = DEFAULT_SPHERES,
  className = "",
  intensity = 1,
}: Props) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden
    >
      {spheres.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            top: s.top,
            bottom: s.bottom,
            left: s.left,
            right: s.right,
            /* Soft glowing orb — light source at 38% 32%, feathered edges */
            background: `radial-gradient(
              circle at 38% 32%,
              ${s.highlight}  0%,
              ${s.mid}       22%,
              ${s.shadow}    52%,
              ${s.deepShadow} 72%,
              transparent   90%
            )`,
            /* Multi-layer glow: tight core + wide diffuse halo */
            boxShadow: `0 0 ${Math.round(s.size * 0.4)}px ${s.glow},
                        0 0 ${Math.round(s.size * 0.9)}px ${s.glow},
                        0 0 ${Math.round(s.size * 1.6)}px ${s.glow.replace(/[\d.]+\)$/, "0.15)")}`,
            /* Soft blur makes edges glow naturally */
            filter: `blur(${Math.round(s.size * 0.018)}px)`,
            /* Float animation */
            animation: `${s.float} ${s.duration} ease-in-out ${s.delay ?? "0s"} infinite`,
            opacity: (s.opacity ?? 1) * intensity,
            /* Prevent layout reflow during animation */
            willChange: "transform",
          }}
        />
      ))}

      {/* Subtle grain — very low opacity so spheres stay clean */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          opacity: 0.02,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}

/* ── Preset scenes for different contexts ───────────────────────────────── */

/** Compact scene for narrow panels (e.g. auth left side) */
export const AUTH_SPHERES: SphereConfig[] = [
  {
    highlight: "#B8CCFF", mid: "#4561E8", shadow: "#1A2A8A", deepShadow: "#060820",
    glow: "rgba(69,97,232,0.6)",
    size: 320, top: "-6%", right: "-8%",
    float: "sphereFloat1", duration: "9s", opacity: 0.95,
  },
  {
    highlight: "#FFD08C", mid: "#FF7A00", shadow: "#7A3800", deepShadow: "#200E00",
    glow: "rgba(255,122,0,0.5)",
    size: 200, bottom: "4%", left: "-6%",
    float: "sphereFloat2", duration: "11s", delay: "2s", opacity: 0.88,
  },
  {
    highlight: "#D4B8FF", mid: "#7C3AED", shadow: "#2E1278", deepShadow: "#0A0418",
    glow: "rgba(124,58,237,0.45)",
    size: 130, top: "42%", left: "8%",
    float: "sphereFloat3", duration: "14s", delay: "4s", opacity: 0.8,
  },
];

/** Subtle scene for section backgrounds (light touch) */
export const SUBTLE_SPHERES: SphereConfig[] = [
  {
    highlight: "#B8CCFF", mid: "#4561E8", shadow: "#1A2A8A", deepShadow: "#060820",
    glow: "rgba(69,97,232,0.3)",
    size: 500, top: "-20%", right: "-10%",
    float: "sphereFloat1", duration: "14s", opacity: 0.35,
  },
  {
    highlight: "#FFD08C", mid: "#FF7A00", shadow: "#7A3800", deepShadow: "#200E00",
    glow: "rgba(255,122,0,0.2)",
    size: 350, bottom: "-15%", left: "-8%",
    float: "sphereFloat2", duration: "17s", delay: "2s", opacity: 0.3,
  },
];
