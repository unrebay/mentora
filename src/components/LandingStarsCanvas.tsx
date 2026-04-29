"use client";
import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number;    // normalized 0..1
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  layer: 0 | 1 | 2;        // parallax depth: 0=bg, 1=mid, 2=fg
  r: number; g: number; b: number;
}

// How many px of parallax per unit of normalized cursor offset (−1..1)
const LAYER_PARALLAX = [0.012, 0.030, 0.060];
const LAYER_COUNT    = [220, 90, 40];

function starColor(): { r: number; g: number; b: number } {
  const t = Math.random();
  if (t < 0.50) return { r: 205, g: 220, b: 255 };   // cool blue-white
  if (t < 0.72) return { r: 255, g: 255, b: 255 };   // pure white
  if (t < 0.86) return { r: 160, g: 185, b: 255 };   // blue
  if (t < 0.94) return { r: 255, g: 215, b: 170 };   // warm
  return           { r: 180, g: 255, b: 220 };        // teal
}

function makeStar(layer: 0 | 1 | 2): Star {
  const { r, g, b } = starColor();
  const baseSize =
    layer === 0 ? 0.25 + Math.random() * 0.55 :
    layer === 1 ? 0.45 + Math.random() * 0.80 :
                  0.75 + Math.random() * 1.10;
  const baseAlpha =
    layer === 0 ? 0.10 + Math.random() * 0.22 :
    layer === 1 ? 0.18 + Math.random() * 0.32 :
                  0.28 + Math.random() * 0.42;
  return {
    x: Math.random(), y: Math.random(),
    size: baseSize, baseAlpha,
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.003 + Math.random() * 0.010,
    layer, r, g, b,
  };
}

export default function LandingStarsCanvas({ className }: { className?: string }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  // Smoothed (inertia) cursor, normalized −1..1 relative to viewport centre
  const cursorRef  = useRef({ x: 0, y: 0 });
  const targetRef  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, rafId = 0;

    // Build stars once
    const stars: Star[] = [];
    for (let l = 0 as 0 | 1 | 2; l < 3; l++) {
      for (let i = 0; i < LAYER_COUNT[l]; i++) stars.push(makeStar(l));
    }

    function resize() {
      const dpr = Math.min(devicePixelRatio, 2);
      W = cvs!.offsetWidth;
      H = cvs!.offsetHeight;
      cvs!.width  = W * dpr;
      cvs!.height = H * dpr;
      ctx!.scale(dpr, dpr);
    }

    function draw() {
      // Inertia — smooth cursor
      const c = cursorRef.current;
      const tgt = targetRef.current;
      c.x += (tgt.x - c.x) * 0.04;
      c.y += (tgt.y - c.y) * 0.04;

      ctx!.clearRect(0, 0, W, H);

      for (const s of stars) {
        const par = LAYER_PARALLAX[s.layer];
        // offset in px: cursor −1..1 mapped to ±(W|H * par)
        const ox = c.x * W * par;
        const oy = c.y * H * par;

        // Wrap seamlessly
        const px = ((s.x * W + ox) % W + W) % W;
        const py = ((s.y * H + oy) % H + H) % H;

        // Twinkle
        s.twinklePhase += s.twinkleSpeed;
        const tw = 0.55 + 0.45 * Math.sin(s.twinklePhase);
        const alpha = s.baseAlpha * tw;

        // Soft glow for larger stars
        if (s.size > 0.9) {
          const gr = s.size * 3.5;
          const grad = ctx!.createRadialGradient(px, py, 0, px, py, gr);
          grad.addColorStop(0, `rgba(${s.r},${s.g},${s.b},${alpha * 0.35})`);
          grad.addColorStop(1, `rgba(${s.r},${s.g},${s.b},0)`);
          ctx!.beginPath();
          ctx!.arc(px, py, gr, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(px, py, s.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${s.r},${s.g},${s.b},${alpha})`;
        ctx!.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    // Mouse: normalized relative to viewport centre
    function onMouseMove(e: MouseEvent) {
      targetRef.current = {
        x: (e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2),
        y: (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2),
      };
    }
    function onMouseLeave() { targetRef.current = { x: 0, y: 0 }; }

    // Touch
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      targetRef.current = {
        x: (t.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2),
        y: (t.clientY - window.innerHeight / 2) / (window.innerHeight / 2),
      };
    }
    function onTouchEnd() { targetRef.current = { x: 0, y: 0 }; }

    resize();
    draw();
    window.addEventListener("resize",     resize);
    window.addEventListener("mousemove",  onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchmove",  onTouchMove, { passive: true });
    window.addEventListener("touchend",   onTouchEnd);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize",     resize);
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: "none" }}
    />
  );
}
