"use client";
import { useEffect, useRef } from "react";

const SYMBOLS = [
  "∑", "∫", "π", "√", "∞", "α", "β", "γ", "δ", "θ", "λ", "μ", "φ", "∂", "Ω",
  "е", "Я", "ъ", "ф", "dx", "f(x)", "x²", "Δ", "∇", "ℏ", "≈", "≠", "≤", "≥",
  "1+1", "e=mc²", "∈", "∀", "∃", "⊂", "∩", "∪", "∏", "ζ", "η", "ξ", "ρ", "σ", "τ",
  "CO₂", "H₂O", "Fe", "Au", "DNA", "ATP", "sin", "cos", "lim", "log", "ℝ", "ℕ",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  symbol: string;
  opacity: number;
  size: number;
  color: string;
}

const COLORS = ["#4561E8", "#8B5CF6", "#6366f1", "#a78bfa", "#7c3aed", "#3b82f6"];

export default function ParticleHero({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = Math.min(90, Math.floor((canvas.width * canvas.height) / 14000));
      particlesRef.current = Array.from({ length: count }, () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        return {
          x, y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          tx: x, ty: y,
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          opacity: 0.08 + Math.random() * 0.18,
          size: 11 + Math.floor(Math.random() * 14),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const ATTRACT_RADIUS = 220;
      const ATTRACT_FORCE = 0.012;
      const DAMPING = 0.96;
      const DRIFT_FORCE = 0.002;

      for (const p of particlesRef.current) {
        p.vx += (p.tx - p.x) * DRIFT_FORCE;
        p.vy += (p.ty - p.y) * DRIFT_FORCE;
        p.tx += (Math.random() - 0.5) * 0.4;
        p.ty += (Math.random() - 0.5) * 0.4;
        p.tx = Math.max(20, Math.min(canvas.width - 20, p.tx));
        p.ty = Math.max(20, Math.min(canvas.height - 20, p.ty));

        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ATTRACT_RADIUS && dist > 1) {
          const force = (ATTRACT_RADIUS - dist) / ATTRACT_RADIUS;
          p.vx += dx * force * ATTRACT_FORCE;
          p.vy += dy * force * ATTRACT_FORCE;
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -30) p.x = canvas.width + 20;
        if (p.x > canvas.width + 30) p.x = -20;
        if (p.y < -30) p.y = canvas.height + 20;
        if (p.y > canvas.height + 30) p.y = -20;

        const proximity = dist < ATTRACT_RADIUS ? (1 - dist / ATTRACT_RADIUS) : 0;
        const finalOpacity = Math.min(0.9, p.opacity + proximity * 0.5);

        ctx.font = `${p.size}px 'Georgia', serif`;
        ctx.fillStyle = p.color + Math.round(finalOpacity * 255).toString(16).padStart(2, "0");
        ctx.fillText(p.symbol, p.x, p.y);

        if (proximity > 0.3) {
          for (const other of particlesRef.current) {
            if (other === p) continue;
            const ox = other.x - p.x;
            const oy = other.y - p.y;
            const od = Math.sqrt(ox * ox + oy * oy);
            if (od < 80) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = p.color + Math.round(proximity * 0.15 * 255).toString(16).padStart(2, "0");
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    resize();
    draw();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
      style={{ mixBlendMode: "screen" }}
    />
  );
}
