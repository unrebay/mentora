"use client";
import { useEffect, useRef } from "react";

const SYMBOLS = [
  "∑", "∫", "π", "√", "∞", "α", "β", "γ", "δ", "θ",
  "λ", "μ", "φ", "∂", "Ω", "е", "Я", "ъ", "ф", "dx",
  "f(x)", "x²", "Δ", "∇", "ℏ", "≈", "≠", "≤", "≥", "1+1",
  "e=mc²", "∈", "∀", "∃", "⊂", "∩", "∪", "∏", "ζ", "η",
  "ξ", "ρ", "σ", "τ", "CO₂", "H₂O", "Fe", "Au", "DNA", "ATP",
  "sin", "cos", "lim", "log", "ℝ", "ℕ",
];

// Dark mode: brand-coloured glows; Light mode: soft grays
const DARK_COLORS  = ["#4561E8", "#8B5CF6", "#6366f1", "#a78bfa", "#7c3aed", "#3b82f6"];
const LIGHT_COLORS = ["#c8c8d8", "#b8b8cc", "#d0ccdc", "#a8a8bc", "#c4c0d8", "#b4b0c8"];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  tx: number; ty: number;
  symbol: string;
  opacity: number;
  size: number;
  colorIdx: number;
}

export default function ParticleHero({ className = "" }: { className?: string }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mouseRef     = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef       = useRef<number>(0);
  const isDarkRef    = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Apply blend mode based on theme
    const applyTheme = (dark: boolean) => {
      isDarkRef.current = dark;
      canvas.style.mixBlendMode = dark ? "screen" : "multiply";
    };

    applyTheme(document.documentElement.classList.contains("dark"));

    // Watch for live theme switches
    const observer = new MutationObserver(() =>
      applyTheme(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

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
          symbol:   SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          opacity:  0.08 + Math.random() * 0.18,
          size:     11 + Math.floor(Math.random() * 14),
          colorIdx: Math.floor(Math.random() * DARK_COLORS.length),
        };
      });
    };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;
      const isDark   = isDarkRef.current;
      const COLORS   = isDark ? DARK_COLORS : LIGHT_COLORS;
      // In light mode boost opacity so multiply-blend stays visible
      const opacityBoost = isDark ? 1 : 2.2;

      const ATTRACT_RADIUS = 220;
      const ATTRACT_FORCE  = 0.012;
      const DAMPING        = 0.96;
      const DRIFT_FORCE    = 0.002;

      for (const p of particlesRef.current) {
        // Drift toward lazy target
        p.vx += (p.tx - p.x) * DRIFT_FORCE;
        p.vy += (p.ty - p.y) * DRIFT_FORCE;
        p.tx += (Math.random() - 0.5) * 0.4;
        p.ty += (Math.random() - 0.5) * 0.4;
        p.tx = Math.max(20, Math.min(canvas.width  - 20, p.tx));
        p.ty = Math.max(20, Math.min(canvas.height - 20, p.ty));

        // Mouse attraction
        const dx   = mx - p.x;
        const dy   = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ATTRACT_RADIUS && dist > 1) {
          const force = (ATTRACT_RADIUS - dist) / ATTRACT_RADIUS;
          p.vx += dx * force * ATTRACT_FORCE;
          p.vy += dy * force * ATTRACT_FORCE;
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x  += p.vx;
        p.y  += p.vy;

        // Wrap around edges
        if (p.x < -30)               p.x = canvas.width  + 20;
        if (p.x > canvas.width  + 30) p.x = -20;
        if (p.y < -30)               p.y = canvas.height + 20;
        if (p.y > canvas.height + 30) p.y = -20;

        const proximity    = dist < ATTRACT_RADIUS ? (1 - dist / ATTRACT_RADIUS) : 0;
        const finalOpacity = Math.min(0.9, (p.opacity + proximity * 0.5) * opacityBoost);
        const color        = COLORS[p.colorIdx];
        const alphaHex     = Math.round(finalOpacity * 255).toString(16).padStart(2, "0");

        ctx.font      = `${p.size}px 'Georgia', serif`;
        ctx.fillStyle = color + alphaHex;
        ctx.fillText(p.symbol, p.x, p.y);

        // Connection lines near cursor
        if (proximity > 0.3) {
          for (const other of particlesRef.current) {
            if (other === p) continue;
            const ox = other.x - p.x;
            const oy = other.y - p.y;
            if (ox * ox + oy * oy < 6400) { // 80²
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle =
                color + Math.round(proximity * 0.15 * 255).toString(16).padStart(2, "0");
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
    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
    />
  );
}
