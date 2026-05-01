"use client";

import { motion } from "framer-motion";
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

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.045, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
} as any;

/* ── Single 3D-glass gradient card ──────────────────────── */
function GlassCard({ s, i }: { s: Subject; i: number }) {
  const color = subjectColor(s.id);
  // Get secondary (darker) color for richer gradient
  const toColor = SUBJECT_META_COLORS[s.id]?.to ?? (color + "99");

  const inner = (
    <motion.div
      className="relative rounded-2xl h-full flex flex-col cursor-pointer select-none overflow-hidden"
      style={{
        // Rich subject-color gradient base
        background: `linear-gradient(145deg, ${color}EE 0%, ${toColor}CC 55%, ${color}99 100%)`,
        border: `1px solid ${color}60`,
        boxShadow: [
          // Outer depth shadow
          `0 4px 20px ${color}35`,
          `0 2px 6px rgba(0,0,0,0.4)`,
          // Top-left glass sheen (3D light reflection)
          `inset 0 1px 0 rgba(255,255,255,0.45)`,
          `inset 1px 0 0 rgba(255,255,255,0.18)`,
          // Bottom-right depth edge
          `inset 0 -1px 0 rgba(0,0,0,0.25)`,
        ].join(", "),
        minHeight: 128,
      }}
      whileHover={{
        y: -6,
        scale: 1.03,
        boxShadow: [
          `0 10px 32px ${color}55`,
          `0 4px 12px rgba(0,0,0,0.4)`,
          `inset 0 1px 0 rgba(255,255,255,0.55)`,
          `inset 1px 0 0 rgba(255,255,255,0.22)`,
          `inset 0 -1px 0 rgba(0,0,0,0.20)`,
        ].join(", "),
        transition: { type: "spring", stiffness: 320, damping: 22 },
      }}
    >
      {/* Glass specular highlight — top diagonal sheen */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, transparent 65%)",
      }} />

      {/* Bottom-right subtle darkening for 3D depth */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        background: "linear-gradient(315deg, rgba(0,0,0,0.22) 0%, transparent 50%)",
      }} />

      <div className="relative z-10 p-4 flex flex-col flex-1">
        {/* Icon — white/glass version on colored background */}
        <div className="mb-3 mt-0.5">
          <SubjectIcon id={s.id} size={36}
            style={{
              background: "rgba(255,255,255,0.20)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)",
            }} />
        </div>

        {/* Title + desc */}
        <div className="font-semibold text-sm leading-snug" style={{ color: "rgba(255,255,255,0.97)", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>{s.title}</div>
        <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{s.desc}</div>

        {/* Arrow */}
        <div className="mt-auto pt-2.5">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            style={{ color: "rgba(255,255,255,0.65)" }}>
            <path d="M2 6h8M6 2l4 4-4 4" />
          </svg>
        </div>
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
          className="relative p-4 rounded-2xl flex flex-col items-center justify-center group h-full"
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
