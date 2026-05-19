"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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

  // 5×-duplicate track so we can fake an infinite swipe loop on mobile by
  // resetting the scroll position from the edge copies back to the middle
  // copy — gives the user "endless" left/right swiping without ever hitting
  // a boundary. Desktop uses CSS marquee animation as before.
  const COPIES = 5;
  const track = Array.from({ length: COPIES }, () => cards).flat();

  // Duration: ~4s per card → feels slow and graceful (desktop marquee)
  const durationSec = cards.length * 4;

  // Mobile infinite-loop scroll: when the user nears either edge of the
  // track, silently jump scrollLeft back to the same offset within the
  // middle copy. Browsers don't render the jump because we use auto-behavior
  // and skip the next scroll event.
  const outerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    let resetting = false;
    let mounted = true;

    function isMobile() {
      return window.matchMedia("(max-width: 767px)").matches;
    }

    // Position to the middle copy on mount (mobile only).
    function centerScroll() {
      if (!el || !isMobile()) return;
      const oneCopyWidth = el.scrollWidth / COPIES;
      // Land at the start of copy index 2 (0-indexed) — middle of 5
      el.scrollLeft = oneCopyWidth * 2;
    }

    function onScroll() {
      if (!el || resetting || !isMobile()) return;
      const oneCopyWidth = el.scrollWidth / COPIES;
      // If scrolled past copies 0-1 boundary into copy 1 → jump to copy 3
      if (el.scrollLeft < oneCopyWidth * 1) {
        resetting = true;
        el.scrollLeft = el.scrollLeft + oneCopyWidth * 2;
        requestAnimationFrame(() => {
          if (mounted) resetting = false;
        });
      } else if (el.scrollLeft > oneCopyWidth * 4) {
        // Past copy 3 into copy 4 → jump to copy 1
        resetting = true;
        el.scrollLeft = el.scrollLeft - oneCopyWidth * 2;
        requestAnimationFrame(() => {
          if (mounted) resetting = false;
        });
      }
    }

    // Defer initial centering until layout has settled (next frame)
    const raf = requestAnimationFrame(centerScroll);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", centerScroll);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", centerScroll);
    };
  }, []);

  return (
    <>
      {/* Inject keyframes once — avoids SSR mismatch issues with style tags */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mentora-carousel-rtl {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-20%); }
        }
        .mentora-carousel-track {
          animation: mentora-carousel-rtl ${durationSec}s linear infinite;
          will-change: transform;
        }
        .mentora-carousel-track:hover {
          animation-play-state: paused;
        }
        /* Mobile: replace auto-marquee with native swipe scroll
           — user can flick through subjects manually. */
        @media (max-width: 767px) {
          .mentora-carousel-outer {
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .mentora-carousel-outer::-webkit-scrollbar { display: none; }
          .mentora-carousel-track {
            animation: none;
          }
          .mentora-carousel-track > * {
            scroll-snap-align: start;
          }
          .mentora-carousel-tilt {
            transform: none !important;
          }
        }
      ` }} />

      {/* Outer container: perspective gives 3-D depth */}
      <div
        ref={outerRef}
        className="relative overflow-hidden mentora-carousel-outer"
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
          className="mentora-carousel-tilt"
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
