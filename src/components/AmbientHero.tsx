"use client";
import type { CSSProperties } from "react";

interface AmbientHeroProps {
  splineUrl?: string;
  variant?: "hero" | "auth" | "dashboard";
  className?: string;
  style?: CSSProperties;
  /** Override position/size of the Spline iframe. Default: absolute inset-0 100%x100% */
  iframeStyle?: CSSProperties;
}

const ORBS: Record<
  "hero" | "auth" | "dashboard",
  Array<{ color: string; size: number; x: string; y: string; delay: string; duration: string; opacity: number }>
> = {
  hero: [
    { color: "69,97,232",  size: 900, x: "15%",  y: "-15%", delay: "0s",  duration: "18s", opacity: 0.55 },
    { color: "107,135,255",size: 750, x: "75%",  y: "0%",   delay: "3s",  duration: "22s", opacity: 0.45 },
    { color: "167,139,250",size: 600, x: "45%",  y: "65%",  delay: "6s",  duration: "16s", opacity: 0.35 },
    { color: "69,97,232",  size: 500, x: "88%",  y: "75%",  delay: "1s",  duration: "20s", opacity: 0.30 },
    { color: "99,102,241", size: 400, x: "30%",  y: "30%",  delay: "9s",  duration: "24s", opacity: 0.25 },
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

const ANIM_NAMES = ["orbDrift1", "orbDrift2", "orbDrift3", "orbDrift1", "orbDrift2"];

export default function AmbientHero({
  splineUrl,
  variant = "hero",
  className = "",
  style,
  iframeStyle,
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
              ? "radial-gradient(ellipse 120% 70% at 50% -5%, rgba(69,97,232,0.30) 0%, rgba(69,97,232,0.08) 50%, transparent 70%), #080814"
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
            filter: "blur(60px)",
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

      {/* Spline iframe — hue-rotated orange→blue */}
      {splineUrl && (
        <>
          <iframe
            src={splineUrl}
            frameBorder="0"
            style={{
              position: "absolute",
              border: "none",
              opacity: 0.90,
              filter: "hue-rotate(190deg) saturate(1.3) brightness(0.80)",
              top: "-5%",
              left: "-5%",
              width: "110%",
              height: "110%",
              ...iframeStyle,
            }}
            title="3D scene"
            aria-hidden
            loading="lazy"
            allow="autoplay"
          />

          {/* ── Full-coverage vignette mask ─────────────────────────────
              Radial + edge gradients hide ALL Spline watermarks and scene
              text regardless of viewport size or scene layout.            */}

          {/* Radial dark vignette — center transparent, edges dark */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 65% 55% at 50% 45%, transparent 20%, rgba(8,8,20,0.55) 65%, rgba(8,8,20,0.92) 90%, #080814 100%)",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />

          {/* Bottom fade — fully covers watermarks and scene text */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "38%",
              background: "linear-gradient(to top, #080814 0%, rgba(8,8,20,0.95) 40%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 4,
            }}
          />

          {/* Top fade */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "18%",
              background: "linear-gradient(to bottom, rgba(8,8,20,0.7) 0%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 4,
            }}
          />

          {/* Left fade */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "12%",
              background: "linear-gradient(to right, rgba(8,8,20,0.6) 0%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 4,
            }}
          />

          {/* Right fade */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "12%",
              background: "linear-gradient(to left, rgba(8,8,20,0.6) 0%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 4,
            }}
          />
        </>
      )}
    </div>
  );
}
