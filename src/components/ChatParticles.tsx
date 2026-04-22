"use client";
import { useEffect, useRef } from "react";

const SUBJECT_SYMBOLS: Record<string, string[]> = {
  "russian-history":   ["Ѣ", "Ъ", "1917", "Ц", "Щ", "Я", "Ю", "1812", "Р", "И", "С", "Т", "О", "Р", "И", "Я"],
  "world-history":     ["∞", "1776", "BC", "AD", "I", "II", "III", "♛", "1066", "∑", "Δ"],
  "mathematics":       ["∑", "∫", "π", "√", "∞", "α", "β", "dx", "f(x)", "x²", "lim", "log", "sin", "cos", "Δ", "∂"],
  "physics":           ["∇", "ℏ", "Ω", "Φ", "Ψ", "λ", "ν", "F=ma", "E=mc²", "∂", "∮", "→", "↑"],
  "chemistry":         ["H", "O", "C", "N", "Fe", "Au", "Na", "Cl", "CO₂", "H₂O", "pH", "Ag", "K"],
  "biology":           ["DNA", "RNA", "ATP", "G", "A", "T", "C", "↺", "ΔG", "H₂O", "O₂", "CO₂"],
  "russian-language":  ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К", "Л", "М", "Н", "О", "П", "Р", "ъ", "ь", "ё"],
  "literature":        ["«", "»", "…", "—", "§", "¶", "∞", "✦", "✧", "☽"],
  "english":           ["A", "B", "C", "the", "is", "am", "are", "Aa", "Bb", "Cc", "I", "you", "we"],
  "social-studies":    ["§", "∑", "↑", "↓", "%", "≠", "≈", "→", "←", "↔"],
  "geography":         ["N", "S", "E", "W", "↑", "∆", "≈", "○", "◎", "km", "°"],
  "computer-science":  ["01", "10", "if", "{}", "=>", "//", "fn", "&&", "||", "!=", "<<", ">>", "∅", "∈"],
  "astronomy":         ["☀", "☽", "★", "✦", "AU", "ly", "∞", "°", "λ", "ν", "c", "∇", "⊙"],
};

const DEFAULT_SYMBOLS = ["∑", "∫", "π", "α", "β", "γ", "∞", "Δ", "λ", "е", "∂", "√"];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  symbol: string;
  opacity: number;
  baseOpacity: number;
  size: number;
  phase: number;
}

export default function ChatParticles({ subject }: { subject: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const symbols = SUBJECT_SYMBOLS[subject] ?? DEFAULT_SYMBOLS;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };

    const isDark = () => document.documentElement.classList.contains("dark");

    const init = () => {
      const count = 32;
      particlesRef.current = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        symbol: symbols[i % symbols.length],
        opacity: 0,
        // Increased 2.5× vs original: dark 0.12–0.32, light 0.07–0.20
        baseOpacity: 0.12 + Math.random() * 0.20,
        size: 12 + Math.floor(Math.random() * 12),
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      timeRef.current += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = isDark();

      for (const p of particlesRef.current) {
        p.x += p.vx + Math.sin(timeRef.current + p.phase) * 0.2;
        p.y += p.vy + Math.cos(timeRef.current * 0.7 + p.phase) * 0.15;

        if (p.x < -30) p.x = canvas.width + 20;
        if (p.x > canvas.width + 30) p.x = -20;
        if (p.y < -30) p.y = canvas.height + 20;
        if (p.y > canvas.height + 30) p.y = -20;

        p.opacity += (p.baseOpacity - p.opacity) * 0.02;

        // Dark theme: bright blue-violet. Light theme: slightly deeper, less opacity
        const alpha = dark ? p.opacity : p.opacity * 0.55;
        const color = dark ? `rgba(100, 140, 255, ${alpha})` : `rgba(69, 97, 232, ${alpha})`;

        ctx.font = `${p.size}px 'Georgia', serif`;
        ctx.fillStyle = color;
        ctx.fillText(p.symbol, p.x, p.y);
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
  }, [subject]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
