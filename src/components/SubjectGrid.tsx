"use client";

import { motion } from "framer-motion";
import Link from "next/link";

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
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: "easeOut" },
  }),
};

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
              <div className="relative p-4 rounded-2xl border bg-[var(--bg-card)] border-[var(--border)] hover:border-brand-300 hover:shadow-md cursor-pointer transition-shadow h-full">
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-md">LIVE</span>
                <div className="text-2xl mb-2">{s.emoji}</div>
                <div className="font-semibold text-sm text-[var(--text)]">{s.title}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{s.desc}</div>
              </div>
            </Link>
          ) : s.suggest ? (
            <div className="relative p-4 rounded-2xl border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-brand-300 cursor-pointer flex flex-col items-center justify-center min-h-[100px] transition-colors">
              <div className="text-2xl mb-1">+</div>
              <div className="text-xs">{s.title}</div>
              <div className="text-xs text-[var(--text-muted)]">{s.desc}</div>
            </div>
          ) : (
            <div className="relative p-4 rounded-2xl border bg-[var(--bg-secondary)] border-[var(--border)] opacity-70">
              <span className="absolute top-3 right-3 text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md">СКОРО</span>
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="font-semibold text-sm text-[var(--text)]">{s.title}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">{s.desc}</div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
