"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} as any;

export default function SubjectGrid({ subjects }: { subjects: Subject[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {subjects.map((s, i) => (
        <motion.div
          key={s.id}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          whileHover={s.suggest || (s.comingSoon && !s.live) ? {} : { y: -4, scale: 1.025 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          {s.live ? (
            <Link href={`/learn/${s.id}`} className="block h-full">
              <div
                className="relative p-4 rounded-2xl border bg-[var(--bg-card)] border-[var(--border)] cursor-pointer transition-all duration-200 h-full overflow-hidden group"
                style={{
                  "--subject-color": subjectColor(s.id),
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                } as React.CSSProperties}
              >
                {/* Colored top accent — full line on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl transition-all duration-300"
                  style={{
                    background: `linear-gradient(90deg, ${subjectColor(s.id)}, ${subjectColor(s.id)}44)`,
                  }}
                />
                {/* Subtle glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at 30% 0%, ${subjectColor(s.id)}12 0%, transparent 60%)`,
                  }}
                />

                <div className="mb-3 mt-1 relative z-10">
                  <SubjectIcon id={s.id} size={38} />
                </div>
                <div className="font-semibold text-sm text-[var(--text)] relative z-10 leading-snug">{s.title}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5 relative z-10">{s.desc}</div>

                {/* Hover arrow */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2 6h8M6 2l4 4-4 4" style={{ color: subjectColor(s.id) }} />
                  </svg>
                </div>
              </div>
            </Link>
          ) : s.suggest ? (
            <Link href="/auth" className="block h-full">
              <div className="relative p-4 rounded-2xl border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-brand-400 dark:hover:border-brand-500 cursor-pointer flex flex-col items-center justify-center min-h-[120px] transition-all duration-200 group bg-[var(--bg-card)]">
                <div className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 flex items-center justify-center mb-2 transition-colors">
                  <span className="text-xl font-light text-[var(--text-muted)] group-hover:text-brand-500 transition-colors">+</span>
                </div>
                <div className="text-xs font-semibold text-center group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{s.title}</div>
                <div className="text-[10px] text-[var(--text-muted)] text-center mt-0.5">{s.desc}</div>
              </div>
            </Link>
          ) : (
            <div className="relative p-4 rounded-2xl border bg-[var(--bg-secondary)] border-[var(--border)] opacity-50 select-none">
              <span className="absolute top-3 right-3 text-[9px] font-bold bg-[var(--bg-card)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md tracking-wide">СКОРО</span>
              <div className="mb-3 mt-1">
                <SubjectIcon id={s.id} size={38} style={{ filter: "grayscale(0.4)" }} />
              </div>
              <div className="font-semibold text-sm text-[var(--text)] leading-snug">{s.title}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.desc}</div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
