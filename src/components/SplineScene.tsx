"use client";
import type { CSSProperties } from "react";

/**
 * SplineScene — embeds a Spline 3D scene as an iframe.
 * The scene URL comes from spline.design → Share → Copy Link.
 * For the .splinecode format (react-spline), use SplineReact instead.
 */
interface Props {
  scene: string;
  className?: string;
  style?: CSSProperties;
}

export default function SplineScene({ scene, className, style }: Props) {
  return (
    <iframe
      src={scene}
      frameBorder="0"
      className={className}
      style={{ width: "100%", height: "100%", border: "none", ...style }}
      title="3D galaxy background"
      aria-hidden
      loading="lazy"
      allow="autoplay"
    />
  );
}
