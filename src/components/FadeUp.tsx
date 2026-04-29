"use client";
import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  id?: string;
  /** fade only — no y shift (for inline elements) */
  fade?: boolean;
}

export default function FadeUp({ children, delay = 0, duration = 0.45, className, id, fade }: Props) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: fade ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
