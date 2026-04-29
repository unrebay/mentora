"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

const SYMBOLS = [
  "4", "0", "4", "∑", "∫", "π", "√", "∞", "α", "β",
  "γ", "δ", "θ", "λ", "е", "Я", "∂", "Ω", "dx", "f(x)",
  "x²", "∇", "ℏ", "≈", "sin", "cos", "lim", "log", "∈",
  "∀", "∃", "DNA", "Fe", "Au", "H₂O", "CO₂", "★", "☀",
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  symbol: string;
  opacity: number;
  size: number;
  color: string;
  isFour: boolean;
}

const COLORS_NORMAL = ["#4561E8cc", "#8B5CF6cc", "#6366f1cc", "#3b82f6cc"];
const COLORS_404 = ["#4561E8", "#8B5CF6", "#4561E8"];

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      particlesRef.current = Array.from({ length: 80 }, (_, i) => {
        const isFour = i < 15;
        const angle = Math.random() * Math.PI * 2;
        const radius = isFour ? 30 + Math.random() * 60 : 100 + Math.random() * Math.max(canvas.width, canvas.height) * 0.45;
        return {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          symbol: isFour ? ["4", "0", "4"][i % 3] : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          opacity: isFour ? 0.7 + Math.random() * 0.3 : 0.12 + Math.random() * 0.2,
          size: isFour ? 40 + Math.floor(Math.random() * 30) : 13 + Math.floor(Math.random() * 16),
          color: isFour
            ? COLORS_404[Math.floor(Math.random() * COLORS_404.length)]
            : COLORS_NORMAL[Math.floor(Math.random() * COLORS_NORMAL.length)],
          isFour,
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const REPEL_RADIUS = 160;
      const REPEL_FORCE = 0.06;
      const DAMPING = 0.92;
      const RETURN_FORCE = 0.008;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (const p of particlesRef.current) {
        if (p.isFour) {
          const angle = Math.random() * Math.PI * 2;
          p.vx += (cx + Math.cos(angle) * 80 - p.x) * RETURN_FORCE * 0.3;
          p.vy += (cy + Math.sin(angle) * 60 - p.y) * RETURN_FORCE * 0.3;
        } else {
          p.vx += (Math.random() - 0.5) * 0.08;
          p.vy += (Math.random() - 0.5) * 0.08;
        }

        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 1) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          p.vx += (dx / dist) * force * REPEL_FORCE * (p.isFour ? 2 : 1);
          p.vy += (dy / dist) * force * REPEL_FORCE * (p.isFour ? 2 : 1);
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 20) p.vx += 0.5;
        if (p.x > canvas.width - 20) p.vx -= 0.5;
        if (p.y < 20) p.vy += 0.5;
        if (p.y > canvas.height - 20) p.vy -= 0.5;

        const proximity = dist < REPEL_RADIUS ? (1 - dist / REPEL_RADIUS) : 0;
        ctx.font = `${p.isFour ? "bold " : ""}${p.size}px 'Georgia', serif`;
        ctx.globalAlpha = Math.min(1, p.opacity + proximity * (p.isFour ? 0.4 : 0.3));
        ctx.fillStyle = p.color;
        ctx.fillText(p.symbol, p.x, p.y);
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#06060f] flex flex-col items-center justify-center overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 flex flex-col items-center gap-6 pointer-events-none">
        <div
          className="text-[140px] md:text-[200px] font-black leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, #4561E8, #8B5CF6, #4561E8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: 0.15,
          }}
        >
          404
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6 -mt-8">
        <p className="text-white/60 text-lg font-medium">Страница не найдена</p>
        <p className="text-white/30 text-sm max-w-xs">
          Подвинь курсор — символы знаний разлетятся в стороны
        </p>
        <Link
          href="/"
          className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #4561E8, #6366f1)", boxShadow: "0 0 30px #4561E840", pointerEvents: "auto" }}
        >
          На главную
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
          style={{ pointerEvents: "auto" }}
        >
          Или вернись в библиотеку <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle" }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  );
}
