"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";

type Subject = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  live?: boolean;
  suggest?: boolean;
  comingSoon?: boolean;
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.055, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
} as any;

/* ── Single liquid-glass card ────────────────────────────── */
function GlassCard({ s, i }: { s: Subject; i: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const color = subjectColor(s.id);

  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const springX = useSpring(mx, { stiffness: 200, damping: 30 });
  const springY = useSpring(my, { stiffness: 200, damping: 30 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    mx.set(x);
    my.set(y);
  }
  function handleMouseLeave() {
    mx.set(50);
    my.set(50);
  }

  const inner = (
    <motion.div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl h-full flex flex-col cursor-pointer select-none"
      style={{
        background: `linear-gradient(145deg, ${color}ee 0%, ${color}99 55%, ${color}cc 100%)`,
        boxShadow: `0 4px 24px ${color}35, inset 0 1px 0 rgba(255,255,255,0.18)`,
        border: "1px solid rgba(255,255,255,0.14)",
        minHeight: 140,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        y: -6,
        scale: 1.03,
        boxShadow: `0 14px 40px ${color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
        transition: { type: "spring", stiffness: 300, damping: 22 },
      }}
    >
      {/* Animated radial glow that follows cursor */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(circle at ${springX}% ${springY}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`,
        }}
      />

      {/* Glass shine — top-left sheen */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 45%, rgba(0,0,0,0.08) 100%)" }} />

      {/* Subtle grain texture */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          opacity: 0.04, mixBlendMode: "overlay",
        }}
      />

      <div className="relative z-10 p-4 flex flex-col flex-1">
        {/* Icon */}
        <div className="mb-3 mt-1">
          <SubjectIcon id={s.id} size={38} light
            style={{ background: "rgba(255,255,255,0.22)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
        </div>

        {/* Title */}
        <div className="font-bold text-sm text-white leading-snug">{s.title}</div>
        <div className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{s.desc}</div>

        {/* Hover arrow */}
        <motion.div
          className="mt-auto pt-2 flex items-center gap-1 text-[11px] font-semibold"
          style={{ color: "rgba(255,255,255,0.0)" }}
          whileHover={{ color: "rgba(255,255,255,0.9)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.6)" }}>
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 6h8M6 2l4 4-4 4" />
            </svg>
          </span>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      key={s.id}
      custom={i}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="h-full"
    >
      {s.live ? (
        <Link href={`/learn/${s.id}`} className="block h-full">
          {inner}
        </Link>
      ) : (
        <div className="h-full" style={{ opacity: 0.45, pointerEvents: "none" }}>
          {inner}
        </div>
      )}
    </motion.div>
  );
}

/* ── Suggest card ─────────────────────────────────────────── */
function SuggestCard({ s, i }: { s: Subject; i: number }) {
  return (
    <motion.div
      custom={i}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="h-full"
    >
      <Link href="/auth" className="block h-full">
        <motion.div
          className="relative p-4 rounded-2xl flex flex-col items-center justify-center group"
          style={{
            background: "rgba(69,97,232,0.04)",
            border: "2px dashed rgba(69,97,232,0.28)",
            minHeight: 140,
          }}
          whileHover={{
            background: "rgba(69,97,232,0.09)",
            borderColor: "rgba(69,97,232,0.55)",
            y: -6,
            scale: 1.03,
            transition: { type: "spring", stiffness: 300, damping: 22 },
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 transition-all duration-200 group-hover:scale-110"
            style={{ background: "rgba(69,97,232,0.12)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(69,97,232,0.8)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="text-sm font-bold text-center" style={{ color: "var(--text)" }}>{s.title}</div>
          <div className="text-xs text-center mt-1" style={{ color: "var(--text-muted)" }}>{s.desc}</div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ── Main export ──────────────────────────────────────────── */
export default function SubjectGrid({ subjects }: { subjects: Subject[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {subjects.map((s, i) =>
        s.suggest
          ? <SuggestCard key={s.id} s={s} i={i} />
          : <GlassCard key={s.id} s={s} i={i} />
      )}
    </div>
  );
}
