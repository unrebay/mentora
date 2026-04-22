"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  r: number; g: number; b: number;
}

interface Props {
  className?: string;
  /** Number of particles (default 110) */
  count?: number;
}

/**
 * ParticleField — lightweight canvas particle system.
 * Particles gently drift and flow toward the cursor on desktop.
 * On mobile they float autonomously (no cursor available).
 * pointer-events: none — sits behind interactive layers.
 */
export default function ParticleField({ className, count = 110 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouseX = -9999, mouseY = -9999;
    let particles: Particle[] = [];
    let W = 0, H = 0;
    let dpr = 1;

    // white, soft blue, soft violet — matches galaxy palette
    const PALETTE: [number, number, number][] = [
      [255, 255, 255],
      [100, 140, 255],
      [180, 140, 255],
    ];

    function resize() {
      dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(): Particle {
      const [r, g, b] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        size: Math.random() * 1.3 + 0.3,
        opacity: Math.random() * 0.42 + 0.07,
        r, g, b,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: count }, spawn);
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        // Cursor attraction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 200 * 200 && dist2 > 1) {
          const dist = Math.sqrt(dist2);
          const f = ((200 - dist) / 200) * 0.011;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }

        // Tiny random drift — keeps particles alive on mobile
        p.vx += (Math.random() - 0.5) * 0.008;
        p.vy += (Math.random() - 0.5) * 0.008;

        // Damping
        p.vx *= 0.975;
        p.vy *= 0.975;

        // Speed cap
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.4) { p.vx = (p.vx / spd) * 1.4; p.vy = (p.vy / spd) * 1.4; }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -4) p.x = W + 4;
        else if (p.x > W + 4) p.x = -4;
        if (p.y < -4) p.y = H + 4;
        else if (p.y > H + 4) p.y = -4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.opacity})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(tick);
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };
    const onResize = () => { init(); };

    init();
    tick();

    // Use document-level listener so cursor outside canvas still attracts
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: "none" }}
    />
  );
}
