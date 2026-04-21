"use client";

/**
 * MathField — animated floating math/science symbols for dark backgrounds.
 * Replaces SphereBlobScene on the auth left panel.
 * Pure CSS animations, no canvas, no WebGL.
 */

const SYMBOLS = [
  "E = mc²",
  "∫f(x)dx",
  "a² + b² = c²",
  "∑ nᵢ",
  "∂f/∂x",
  "F = ma",
  "v = λf",
  "ΔE = hν",
  "PV = nRT",
  "sin²θ + cos²θ = 1",
  "e^(iπ) + 1 = 0",
  "π ≈ 3.14159",
  "∇²φ = 0",
  "ℏ",
  "∞",
  "∀x∃y",
  "H₂O",
  "CO₂",
  "NaCl",
  "x = (−b ± √D) / 2a",
  "lim(x→∞)",
  "ln e = 1",
  "√x²+y²",
  "d/dt",
  "∈ ℝ",
  "∮ B·dA = 0",
  "∆S ≥ 0",
  "p = mv",
  "α β γ δ",
  "χ² тест",
  "ρ = m/V",
  "λ = h/p",
  "²³⁸U",
  "CH₄",
  "C₆H₁₂O₆",
  "→ ← ↑ ↓",
];

// Seeded pseudo-random to ensure consistent SSR+CSR render
function pseudoRand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface Particle {
  symbol: string;
  left: number;
  delay: number;
  dur: number;
  size: number;
  opacity: number;
  rotate: number;
}

function buildParticles(count = 28): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    symbol: SYMBOLS[i % SYMBOLS.length],
    left: pseudoRand(i * 3 + 1) * 90 + 2,
    delay: -(pseudoRand(i * 7 + 2) * 30),
    dur: pseudoRand(i * 11 + 3) * 18 + 22,
    size: pseudoRand(i * 5 + 4) * 0.45 + 0.7,
    opacity: pseudoRand(i * 13 + 5) * 0.18 + 0.06,
    rotate: (pseudoRand(i * 17 + 6) - 0.5) * 24,
  }));
}

const PARTICLES = buildParticles(30);

export default function MathField({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(var(--rot)); opacity: 0; }
          8%   { opacity: var(--op); }
          92%  { opacity: var(--op); }
          100% { transform: translateY(-12vh) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      {PARTICLES.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: `${p.left}%`,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: `${p.size}rem`,
            fontWeight: 500,
            color: "#6B8FFF",
            whiteSpace: "nowrap",
            ["--rot" as string]: `${p.rotate}deg`,
            ["--op" as string]: p.opacity,
            animation: `floatUp ${p.dur}s linear ${p.delay}s infinite`,
            willChange: "transform, opacity",
          }}
        >
          {p.symbol}
        </span>
      ))}

      {/* Fade symbols at edges */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, #04060f 0%, transparent 18%, transparent 82%, #04060f 100%)",
        pointerEvents: "none",
      }} />

      {/* Faint blue glow for depth */}
      <div style={{
        position: "absolute",
        top: "-10%",
        right: "-10%",
        width: "55%",
        paddingBottom: "55%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(69,97,232,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
