"use client";

import Link from "next/link";
import SubjectIcon, { subjectColor, SUBJECT_META_COLORS } from "@/components/SubjectIcon";

type Subject = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  live?: boolean;
  suggest?: boolean;
  comingSoon?: boolean;
};

/* ── Single glass card (same design as SubjectGrid) ── */
function CarouselCard({ s }: { s: Subject }) {
  const color = subjectColor(s.id);
  const toColor = SUBJECT_META_COLORS[s.id]?.to ?? color + "99";

  const inner = (
    <div
      className="relative rounded-2xl flex flex-col select-none overflow-hidden"
      style={{
        width: 154,
        height: 138,
        flexShrink: 0,
        background: `linear-gradient(145deg, ${color}EE 0%, ${toColor}CC 55%, ${color}99 100%)`,
        border: `1px solid ${color}60`,
        boxShadow: [
          `0 6px 24px ${color}30`,
          `0 2px 6px rgba(0,0,0,0.12)`,
          `inset 0 1px 0 rgba(255,255,255,0.45)`,
          `inset 1px 0 0 rgba(255,255,255,0.18)`,
          `inset 0 -1px 0 rgba(0,0,0,0.15)`,
        ].join(", "),
      }}
    >
      {/* Diagonal glass sheen */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.06) 38%, transparent 62%)",
        }}
      />
      {/* Bottom-right depth shadow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: "linear-gradient(315deg, rgba(0,0,0,0.18) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-4 flex flex-col h-full">
        <div className="mb-2.5 mt-0.5">
          <SubjectIcon
            id={s.id}
            size={32}
            style={{
              background: "rgba(255,255,255,0.20)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          />
        </div>
        <div
          className="font-semibold text-[13px] leading-snug"
          style={{
            color: "rgba(255,255,255,0.97)",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {s.title}
        </div>
        <div
          className="text-[10px] mt-0.5 leading-relaxed flex-1"
          style={{ color: "rgba(255,255,255,0.60)" }}
        >
          {s.desc}
        </div>
        <div className="mt-auto pt-1.5">
          <svg
            viewBox="0 0 12 12"
            width="9"
            height="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <path d="M2 6h8M6 2l4 4-4 4" />
          </svg>
        </div>
      </div>
    </div>
  );

  if (s.live) {
    return (
      <Link href={`/learn/${s.id}`} className="block" style={{ flexShrink: 0 }}>
        {inner}
      </Link>
    );
  }
  return (
    <div style={{ flexShrink: 0, opacity: 0.48, pointerEvents: "none" }}>
      {inner}
    </div>
  );
}

/* ── Main carousel ── */
export default function SubjectCarousel({ subjects }: { subjects: Subject[] }) {
  // Filter out "suggest" placeholders — only real subject cards
  const cards = subjects.filter((s) => !s.suggest);

  // Triple-duplicate so the loop is seamless at any viewport width
  const track = [...cards, ...cards, ...cards];

  // Duration: ~4s per card → feels slow and graceful
  const durationSec = cards.length * 4;

  return (
    <>
      {/* Inject keyframes once — avoids SSR mismatch issues with style tags */}
      <style>{`
        @keyframes mentora-carousel-rtl {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.3334%); }
        }
        .mentora-carousel-track {
          animation: mentora-carousel-rtl ${durationSec}s linear infinite;
          will-change: transform;
        }
        .mentora-carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Outer container: perspective gives 3-D depth */}
      <div
        className="relative overflow-hidden"
        style={{
          perspective: "1100px",
          perspectiveOrigin: "50% 30%",
          /* Tall enough for cards + slight tilt padding */
          paddingTop: 10,
          paddingBottom: 24,
        }}
      >
        {/* Left & right fade masks */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: 120,
            background: "linear-gradient(to right, var(--bg) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 z-10 pointer-events-none"
          style={{
            width: 120,
            background: "linear-gradient(to left, var(--bg) 0%, transparent 100%)",
          }}
        />

        {/* 3-D tilt wrapper — gives the ring / conveyor-belt look */}
        <div
          style={{
            transform: "rotateX(7deg) scaleX(1.04)",
            transformStyle: "preserve-3d",
            transformOrigin: "50% 50%",
          }}
        >
          {/* Scrolling track */}
          <div
            className="mentora-carousel-track flex gap-4"
            style={{ width: "max-content" }}
          >
            {track.map((s, i) => (
              <CarouselCard key={`${s.id}-${i}`} s={s} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
