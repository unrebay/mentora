"use client";
import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  /** Extra bottom margin before element is considered "in view". Default: "-80px" */
  margin?: string;
}

/**
 * Lightweight scroll-triggered fade-up wrapper.
 * Drop into any server component to animate a section into view.
 * Animates once — doesn't re-trigger on scroll back.
 */
export default function AnimateIn({
  children,
  className,
  style,
  delay = 0,
  margin = "-80px",
}: AnimateInProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
