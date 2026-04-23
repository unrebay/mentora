"use client";
import type { CSSProperties } from "react";

/**
 * AmbientHero — CSS-only animated background scene.
 * Used as a fallback when no Spline URL is provided, or as a layer
 * beneath the Spline iframe.
 *
 * Props:
 *   splineUrl — if provided, renders <iframe> from spline.design ON TOP of
 *               the CSS scene. Pass via Share → Embed → Link.
 *   variant   — "hero" (full blue glow), "auth" (blue+purple split),
 *               "dashboard" (subtle ambient, for behind content)
 */

interface AmbientHeroProps {
  splineUrl?: string;
  variant?: "hero" | "auth" | "dashboard";
  className?: string;
  style?: CSSProperties;
}

const ORBS: Record<
  "hero" | "auth" | "dashboard",
  Array<{ color: string; size: number; x: string; y: string; delay: string; duration: string; opacity: number }>
> = {
  hero: [
    { color: "69,97,232",  size: 600, x: "10%",  y: "-10%", delay: "0s",    duration: "18s", opacity: 0.35 },
    { color: "107,135,255",size: 500, x: "70%",  y: "5%",   delay: "3s",    duration: "22s", opacity: 0.25 },
    { color: "167,139,250",size: 400, x: "40%",  y: "60%",  delay: "6s",    duration: "16s", opacity: 0.20 },
    { color: "69,97,232",  size: 350, x: "85%",  y: "80%",  delay: "1s",    duration: "20s", opacity: 0.15 },
  ],
  auth: [
    { color: "69,97,232",  size: 500, x: "5%",   y: "10%",  delay: "0s",    duration: "20s", opacity: 0.30 },
    { color: "167,139,250",size: 450, x: "50%",  y: "-5%",  delay: "4s",    duration: "24s", opacity: 0.20 },
    { color: "107,135,255",size: 300, x: "80%",  y: "70%",  delay: "2s",    duration: "18s", opacity: 0.18 },
  ],
  dashboard: [
    { color: "69,97,232",  size: 400, x: "5%",   y: "0%",   delay: "0s",    duration: "25s", opacity: 0.15 },
    { color: "107,135,255",size: 350, x: "75%",  y: "10%",  delay: "5s",    duration: "28s", opacity: 0.10 },
    { color: "167,139,250",size: 300, x: "40%",  y: "70%",  delay: "8s",    duration: "22s", opacity: 0.08 },
  ],
};

const ANIM_NAMES = ["orbDrift1", "orbDrift2", "orbDrift3", "orbDrift1"];

export default function AmbientHero({
  splineUrl,
  variant = "hero",
  className = "",
  style,
}: AmbientHeroProps) {
  const orbs = ORBS[variant];

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={style}
      aria-hidden
    >
      {/* Base deep-dark gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            variant === "hero"
              ? "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(69,97,232,0.18) 0%, transparent 65%), #080814"
              : variant === "auth"
              ? "radial-gradient(ellipse 70% 50% at 20% 50%, rgba(69,97,232,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(167,139,250,0.12) 0%, transparent 55%), #080814"
              : "#080814",
        }}
      />

      {/* Animated blur orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width:  orb.size,
            height: orb.size,
            left:   orb.x,
            top:    orb.y,
            marginLeft:  -(orb.size / 2),
            marginTop:   -(orb.size / 2),
            background: `radial-gradient(circle, rgba(${orb.color},${orb.opacity}) 0%, transparent 70%)`,
            filter: "blur(40px)",
            animation: `${ANIM_NAMES[i % ANIM_NAMES.length]} ${orb.duration} ${orb.delay} ease-in-out infinite`,
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Noise vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Spline iframe — layered on top */}
      {splineUrl && (
        <iframe
          src={splineUrl}
          frameBorder="0"
          className="absolute inset-0 w-full h-full"
          style={{ border: "none", opacity: 0.85 }}
          title="3D scene"
          aria-hidden
          loading="lazy"
          allow="autoplay"
        />
      )}
    </div>
  );
}
