"use client";

/**
 * DeepSpaceBlobs — frosted-glass depth layer.
 * Renders large, heavily-blurred colour shapes that appear to float
 * *behind* a matte glass surface. Only a soft silhouette is visible.
 * Pure CSS animation — fully GPU-accelerated, zero JS per frame.
 */

interface BlobDef {
  color: string;
  size: number;
  ry: number;       // height as % of size — makes ovals
  blur: number;
  opacity: number;
  x: number;        // % from left
  y: number;        // % from top
  dur: number;
  delay: number;
  floatIdx: number;
}

const BLOBS: BlobDef[] = [
  // large anchoring spheres on the sides
  { color: "69,97,232",   size: 420, ry: 90,  blur: 90,  opacity: 0.16, x: 8,  y: 35, dur: 26, delay:  0,  floatIdx: 0 },
  { color: "69,97,232",   size: 380, ry: 90,  blur: 85,  opacity: 0.15, x: 92, y: 60, dur: 22, delay: -6,  floatIdx: 1 },
  // mid purple cloud
  { color: "124,58,237",  size: 320, ry: 70,  blur: 80,  opacity: 0.14, x: 50, y: 85, dur: 30, delay: -10, floatIdx: 2 },
  { color: "124,58,237",  size: 260, ry: 65,  blur: 70,  opacity: 0.12, x: 50, y: 10, dur: 24, delay: -4,  floatIdx: 3 },
  // violet streaks (elongated ovals)
  { color: "159,122,255", size: 480, ry: 35,  blur: 75,  opacity: 0.10, x: 30, y: 55, dur: 35, delay: -15, floatIdx: 4 },
  { color: "159,122,255", size: 400, ry: 30,  blur: 70,  opacity: 0.09, x: 70, y: 30, dur: 28, delay: -8,  floatIdx: 5 },
  // small vivid accents
  { color: "100,160,255", size: 180, ry: 100, blur: 55,  opacity: 0.13, x: 22, y: 75, dur: 20, delay: -3,  floatIdx: 0 },
  { color: "190,80,255",  size: 160, ry: 100, blur: 50,  opacity: 0.11, x: 78, y: 20, dur: 18, delay: -12, floatIdx: 1 },
  // deep teal wash across bottom
  { color: "30,110,200",  size: 500, ry: 45,  blur: 100, opacity: 0.09, x: 50, y: 95, dur: 40, delay: -20, floatIdx: 2 },
];

// Six distinct drift patterns so blobs don't move in sync
const KEYFRAMES = `
@keyframes dsb0 {
  0%,100% { transform: translate(-50%,-50%) scale(1);      }
  25%      { transform: translate(calc(-50% + 35px), calc(-50% - 22px)) scale(1.06); }
  75%      { transform: translate(calc(-50% - 18px), calc(-50% + 28px)) scale(0.96); }
}
@keyframes dsb1 {
  0%,100% { transform: translate(-50%,-50%) scale(1);      }
  30%      { transform: translate(calc(-50% - 28px), calc(-50% + 18px)) scale(1.04); }
  70%      { transform: translate(calc(-50% + 22px), calc(-50% - 32px)) scale(0.97); }
}
@keyframes dsb2 {
  0%,100% { transform: translate(-50%,-50%) scale(1);      }
  33%      { transform: translate(calc(-50% + 20px), calc(-50% + 30px)) scale(1.05); }
  66%      { transform: translate(calc(-50% - 30px), calc(-50% - 12px)) scale(0.95); }
}
@keyframes dsb3 {
  0%,100% { transform: translate(-50%,-50%) scale(1);      }
  40%      { transform: translate(calc(-50% - 22px), calc(-50% - 28px)) scale(1.07); }
  80%      { transform: translate(calc(-50% + 28px), calc(-50% + 14px)) scale(0.96); }
}
@keyframes dsb4 {
  0%,100% { transform: translate(-50%,-50%) scale(1) rotate(0deg);   }
  50%      { transform: translate(calc(-50% + 18px), calc(-50% + 20px)) scale(0.94) rotate(6deg); }
}
@keyframes dsb5 {
  0%,100% { transform: translate(-50%,-50%) scale(1) rotate(0deg);   }
  50%      { transform: translate(calc(-50% - 22px), calc(-50% - 16px)) scale(1.06) rotate(-5deg); }
}
`;

export default function DeepSpaceBlobs({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ overflow: "hidden", pointerEvents: "none" }}
    >
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      {BLOBS.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size * (b.ry / 100),
            borderRadius: "50%",
            background: `rgba(${b.color},${b.opacity})`,
            filter: `blur(${b.blur}px)`,
            animation: `dsb${b.floatIdx} ${b.dur}s ${b.delay}s ease-in-out infinite`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
