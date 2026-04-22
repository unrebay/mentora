"use client";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

/**
 * SplineScene — renders a Spline 3D scene using @splinetool/react-spline.
 * Loaded client-side only (no SSR) with a minimal loading placeholder.
 *
 * Usage:
 *   <SplineScene scene="https://prod.spline.design/{hash}/scene.splinecode" />
 *
 * To create/find scenes: https://spline.design → share → copy embed URL (.splinecode)
 */

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  scene: string;
  className?: string;
  style?: CSSProperties;
}

export default function SplineScene({ scene, className, style }: Props) {
  return (
    <div className={className} style={{ width: "100%", height: "100%", ...style }}>
      <Spline
        scene={scene}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      />
    </div>
  );
}
