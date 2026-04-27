"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Phase = "hidden" | "glass" | "crack" | "reveal" | "card" | "done";

// Crack lines radiating from center (50,45) of a 100x100 SVG viewport
const CRACKS = [
  // 8 main fractures
  { d: "M50,45 L17,6",       delay: 0,    dur: 0.55 },
  { d: "M50,45 L83,2",       delay: 0.08, dur: 0.5  },
  { d: "M50,45 L97,36",      delay: 0.04, dur: 0.45 },
  { d: "M50,45 L89,80",      delay: 0.14, dur: 0.6  },
  { d: "M50,45 L58,99",      delay: 0.2,  dur: 0.55 },
  { d: "M50,45 L10,94",      delay: 0.12, dur: 0.65 },
  { d: "M50,45 L2,52",       delay: 0.06, dur: 0.48 },
  { d: "M50,45 L25,48",      delay: 0.1,  dur: 0.35 },
  // Secondary branches
  { d: "M30,22 L15,34",      delay: 0.45, dur: 0.28 },
  { d: "M30,22 L23,4",       delay: 0.5,  dur: 0.28 },
  { d: "M68,18 L75,6",       delay: 0.52, dur: 0.25 },
  { d: "M68,18 L82,14",      delay: 0.55, dur: 0.22 },
  { d: "M77,62 L87,55",      delay: 0.56, dur: 0.25 },
  { d: "M77,62 L92,70",      delay: 0.52, dur: 0.28 },
  { d: "M54,74 L46,84",      delay: 0.62, dur: 0.24 },
  { d: "M31,72 L18,62",      delay: 0.58, dur: 0.26 },
  { d: "M31,72 L24,85",      delay: 0.6,  dur: 0.22 },
  { d: "M16,28 L6,22",       delay: 0.65, dur: 0.2  },
];

export default function StreakRewardCelebration() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [cracksVisible, setCracksVisible] = useState(false);

  const dismiss = useCallback(() => {
    setPhase("done");
  }, []);

  useEffect(() => {
    if (searchParams.get("streak_reward") !== "1") return;

    // Clean the URL immediately without remounting
    router.replace("/dashboard", { scroll: false });

    // Animation sequence
    setPhase("glass");
    const t1 = setTimeout(() => { setPhase("crack"); setCracksVisible(true); }, 400);
    const t2 = setTimeout(() => setPhase("reveal"), 1800);
    const t3 = setTimeout(() => setPhase("card"), 2400);
    // Auto-dismiss after 9s
    const t4 = setTimeout(() => setPhase("done"), 9000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "hidden" || phase === "done") return null;

  const showGlass  = phase === "glass" || phase === "crack" || phase === "reveal";
  const showCard   = phase === "card";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      onClick={showCard ? dismiss : undefined}
      style={{ cursor: showCard ? "pointer" : "default" }}
    >
      {/* ── Dark glass overlay ──────────────────────────────── */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          background: "rgba(4,4,18,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          opacity: showGlass ? 1 : phase === "card" ? 0.65 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* ── SVG crack lines ─────────────────────────────────── */}
      {cracksVisible && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: phase === "card" ? 0.4 : 1, transition: "opacity 1s ease 0.5s" }}
        >
          <defs>
            {/* Glow filter for cracks */}
            <filter id="crackGlow">
              <feGaussianBlur stdDeviation="0.3" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            {/* Bright center glow */}
            <radialGradient id="centerGlow" cx="50%" cy="45%" r="18%">
              <stop offset="0%" stopColor="rgba(120,160,255,0.9)"/>
              <stop offset="40%" stopColor="rgba(80,120,255,0.5)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </radialGradient>
            {/* Shard fill for triangular regions */}
            <radialGradient id="glassShimmer" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="rgba(200,220,255,0.06)"/>
              <stop offset="100%" stopColor="rgba(100,140,255,0.01)"/>
            </radialGradient>
          </defs>

          {/* Glass texture shimmer */}
          <rect x="0" y="0" width="100" height="100" fill="url(#glassShimmer)"/>

          {/* Bright center impact point */}
          <circle cx="50" cy="45" r="1.2" fill="rgba(180,210,255,0.95)" filter="url(#crackGlow)"/>
          <circle cx="50" cy="45" r="3" fill="url(#centerGlow)"/>

          {/* Crack lines */}
          {CRACKS.map((crack, i) => {
            // Estimate path length: use a large dasharray value
            const dashLen = 120;
            return (
              <path
                key={i}
                d={crack.d}
                stroke="rgba(200,220,255,0.85)"
                strokeWidth={i < 8 ? "0.35" : "0.22"}
                fill="none"
                filter="url(#crackGlow)"
                strokeLinecap="round"
                style={{
                  strokeDasharray: dashLen,
                  strokeDashoffset: dashLen,
                  animation: `crackDraw ${crack.dur}s ease-out ${crack.delay}s forwards`,
                }}
              />
            );
          })}

          {/* Micro-crack highlights at intersections */}
          {[
            [30,22],[68,18],[77,62],[54,74],[31,72],[16,28]
          ].map(([x,y], i) => (
            <circle
              key={`node-${i}`}
              cx={x} cy={y} r="0.4"
              fill="rgba(180,210,255,0.7)"
              style={{
                opacity: 0,
                animation: `nodeAppear 0.2s ease-out ${0.5 + i*0.05}s forwards`,
              }}
            />
          ))}
        </svg>
      )}

      {/* ── Reward card (rises through the crack) ───────────── */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          opacity: showCard ? 1 : 0,
          transform: showCard ? "translateY(0) scale(1)" : "translateY(40px) scale(0.92)",
          transition: "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)",
          pointerEvents: showCard ? "auto" : "none",
        }}
      >
        {/* Glow halo behind card */}
        <div className="absolute inset-0 -z-10 rounded-3xl" style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(69,97,232,0.6) 0%, transparent 70%)",
          filter: "blur(30px)",
          transform: "scale(1.5)",
        }}/>

        {/* Card */}
        <div style={{
          background: "linear-gradient(145deg, rgba(20,24,60,0.97) 0%, rgba(12,16,40,0.97) 100%)",
          border: "1px solid rgba(107,135,255,0.4)",
          borderRadius: 28,
          padding: "36px 40px",
          maxWidth: 360,
          width: "90vw",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(69,97,232,0.35), 0 0 120px rgba(69,97,232,0.15), inset 0 1px 0 rgba(255,255,255,0.12)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top shimmer */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(107,135,255,0.8), transparent)",
          }}/>

          {/* Sparkle particles */}
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: i % 3 === 0 ? 4 : 2,
              height: i % 3 === 0 ? 4 : 2,
              borderRadius: "50%",
              left: `${8 + i * 9}%`,
              top: `${10 + (i * 23) % 70}%`,
              background: i % 2 === 0 ? "rgba(107,135,255,0.85)" : "rgba(255,255,255,0.6)",
              animation: `sparkle ${1 + (i % 3) * 0.4}s ease-in-out ${i * 0.15}s infinite`,
            }}/>
          ))}

          {/* Fire streak icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px",
            background: "linear-gradient(145deg, rgba(255,107,0,0.25), rgba(255,60,0,0.15))",
            border: "1px solid rgba(255,107,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(255,80,0,0.3)",
            animation: "pulseGlow 2s ease-in-out infinite",
          }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
              <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"
                fill="url(#fireGrad)"/>
              <path d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z"
                fill="rgba(255,220,80,0.9)"/>
              <defs>
                <linearGradient id="fireGrad" x1="12" y1="2" x2="12" y2="17" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF4500"/>
                  <stop offset="100%" stopColor="#FF9800"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* "7 дней подряд!" */}
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,107,0,0.9)", marginBottom: 8 }}>
            7 дней подряд!
          </div>

          {/* Main reward text */}
          <div style={{
            fontSize: "clamp(26px,6vw,36px)", fontWeight: 900, color: "white",
            lineHeight: 1.15, marginBottom: 6, letterSpacing: "-0.5px",
          }}>
            3 дня Pro
          </div>
          <div style={{
            fontSize: 15, fontWeight: 700, color: "#6b87ff", marginBottom: 20,
          }}>
            бесплатно — уже активировано
          </div>

          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.6, marginBottom: 28,
          }}>
            Безлимитные сообщения разблокированы на&nbsp;3&nbsp;дня.
            Учись без ограничений — ты заслужил это.
          </p>

          {/* CTA button */}
          <button
            onClick={dismiss}
            style={{
              width: "100%", padding: "13px 24px", borderRadius: 14,
              background: "linear-gradient(135deg, #4561E8, #2438B0)",
              color: "white", fontWeight: 700, fontSize: 15,
              border: "none", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(69,97,232,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(69,97,232,0.6), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(69,97,232,0.45), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
          >
            Продолжить учёбу →
          </button>

          {/* Bottom tap hint */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>
            нажми куда угодно, чтобы закрыть
          </div>
        </div>
      </div>

      <style>{`
        @keyframes crackDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes nodeAppear {
          to { opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(255,80,0,0.3); }
          50% { box-shadow: 0 0 40px rgba(255,80,0,0.6); }
        }
      `}</style>
    </div>
  );
}
