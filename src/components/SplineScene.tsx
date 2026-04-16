"use client";
import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

interface Props {
  scene?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SplineScene({
  scene = "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode",
  className,
  style,
}: Props) {
  return (
    <Spline
      scene={scene}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
