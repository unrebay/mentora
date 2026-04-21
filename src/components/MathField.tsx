"use client";

const SYMBOLS = [
  "E = mc²", "∫f(x)dx", "a² + b² = c²", "∑ nᵢ", "∂f/∂x",
  "F = ma", "v = λf", "ΔE = hν", "PV = nRT",
  "sin²θ + cos²θ = 1", "e^(iπ) + 1 = 0", "π ≈ 3.14159",
  "∇²φ = 0", "ℏ", "∞", "∀x∃y", "H₂O", "CO₂", "NaCl",
  "x = (−b ± √D) / 2a", "lim(x→∞)", "ln e = 1",
  "d/dt", "∈ ℝ", "∮ B·dA = 0", "∆S ≥ 0",
  "p = mv", "α β γ δ", "ρ = m/V", "λ = h/p", "CH₄",
];

function r(s: number) {
  const x = Math.sin(s + 1) * 73856;
  return x - Math.floor(x);
}

const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  symbol:  SYMBOLS[i % SYMBOLS.length],
  left:    r(i * 3)  * 88 + 2,
  delay:  -(r(i * 7)  * 32),
  dur:     r(i * 11) * 16 + 24,
  size:    r(i * 5)  * 0.55 + 0.7,
  opacity: r(i * 13) * 0.22 + 0.13,
  rotate:  (r(i * 17) - 0.5) * 22,
}));

export default function MathField({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <style>{`
        @keyframes mathFloat {
          from { transform: translateY(0px); }
          to   { transform: translateY(-130vh); }
        }
      `}</style>

      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: "-2em",
            left: `${p.left}%`,
            animation: `mathFloat ${p.dur}s linear ${p.delay}s infinite`,
            willChange: "transform",
          }}
        >
          <span
            style={{
              display: "block",
              transform: `rotate(${p.rotate}deg)`,
              fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
              fontSize: `${p.size}rem`,
              fontWeight: 500,
              color: "#7B9FFF",
              whiteSpace: "nowrap",
              opacity: p.opacity,
            }}
          >
            {p.symbol}
          </span>
        </div>
      ))}

      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, #04060f 0%, transparent 22%, transparent 78%, #04060f 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "-15%", right: "-15%",
        width: "60%", paddingBottom: "60%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(69,97,232,0.09) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
