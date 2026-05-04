"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * 404 — calm, peaceful design.
 * Soft drifting stars (no repel-on-hover, no breaking digits).
 * The 404 number is static and serves as a quiet decorative element.
 */
interface Star {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  twinkle: number;
}

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
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
      const count = Math.floor((canvas.width * canvas.height) / 14000);
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        size: 0.4 + Math.random() * 1.6,
        opacity: 0.18 + Math.random() * 0.42,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of starsRef.current) {
        s.x += s.vx;
        s.y += s.vy;
        s.twinkle += 0.012;
        if (s.x < -10) s.x = canvas.width + 10;
        if (s.x > canvas.width + 10) s.x = -10;
        if (s.y < -10) s.y = canvas.height + 10;
        if (s.y > canvas.height + 10) s.y = -10;

        const alpha = s.opacity * (0.65 + 0.35 * Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #0f0f24 0%, #06060f 70%)" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />

      {/* Soft glow halo behind the 404 */}
      <div className="absolute pointer-events-none" aria-hidden
        style={{
          top: "30%", left: "50%", transform: "translate(-50%, -50%)",
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(69,97,232,0.18) 0%, rgba(139,92,246,0.10) 40%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
        <div
          className="text-[120px] sm:text-[160px] md:text-[200px] font-black leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, #4561E8, #8B5CF6, #4561E8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: 0.92,
            textShadow: "0 0 60px rgba(69,97,232,0.30)",
          }}
        >
          404
        </div>
        <p className="text-white/85 text-xl sm:text-2xl font-semibold mt-2">
          Эта страница потерялась в космосе
        </p>
        <p className="text-white/45 text-sm sm:text-base max-w-md">
          Возможно, ссылка устарела или произошла ошибка. Вернись в библиотеку, или попробуй главную.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #4561E8, #6366f1)",
              boxShadow: "0 10px 32px rgba(69,97,232,0.45), inset 0 1px 0 rgba(255,255,255,0.20)",
            }}
          >
            На главную
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              color: "rgba(255,255,255,0.85)",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            В библиотеку
          </Link>
        </div>
      </div>
    </div>
  );
}
