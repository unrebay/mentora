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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35 },
  }),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          whileHover={s.suggest || (s.comingSoon && !s.live) ? {} : { y: -3, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {s.live ? (
            <Link href={`/learn/${s.id}`} className="block h-full">
              <div
                className="relative p-4 rounded-2xl border bg-[var(--bg-card)] border-[var(--border)] hover:shadow-lg cursor-pointer transition-all h-full overflow-hidden group"
                style={{ "--subject-color": subjectColor(s.id) } as React.CSSProperties}
              >
                {/* Colored top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${subjectColor(s.id)}, transparent)` }}
                />
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-md">LIVE</span>
                <div className="mb-3 mt-1">
                  <SubjectIcon id={s.id} size={36} />
                </div>
                <div className="font-semibold text-sm text-[var(--text)]">{s.title}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{s.desc}</div>
              </div>
            </Link>
          ) : s.suggest ? (
            <div className="relative p-4 rounded-2xl border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-brand-300 cursor-pointer flex flex-col items-center justify-center min-h-[110px] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center mb-1.5">
                <span className="text-lg font-light text-[var(--text-muted)]">+</span>
              </div>
              <div className="text-xs font-medium">{s.title}</div>
              <div className="text-xs text-[var(--text-muted)]">{s.desc}</div>
            </div>
          ) : (
            <div className="relative p-4 rounded-2xl border bg-[var(--bg-secondary)] border-[var(--border)] opacity-60">
              <span className="absolute top-3 right-3 text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md">СКОРО</span>
              <div className="mb-3 mt-1">
                <SubjectIcon id={s.id} size={36} style={{ opacity: 0.6 }} />
              </div>
              <div className="font-semibold text-sm text-[var(--text)]">{s.title}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">{s.desc}</div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
