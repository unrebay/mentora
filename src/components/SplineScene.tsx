"use client";
import type { CSSProperties } from "react";

interface Props {
  scene?: string;
  className?: string;
  style?: CSSProperties;
}

export default function SplineScene({
  scene = "https://my.spline.design/6Wq1Q7YGyM-iab9i/",
  className,
  style,
}: Props) {
  return (
    <iframe
      src={scene}
      frameBorder="0"
      className={className}
      style={{ width: "100%", height: "100%", border: "none", ...style }}
      title="3D interactive background"
      aria-hidden
      loading="lazy"
    />
  );
}
