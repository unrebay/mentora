"use client";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  id?: string;
  /** fade only — no y shift (for inline elements) */
  fade?: boolean;
}

/**
 * FadeUp — wrapper around framer-motion m.div + LazyMotion.
 * LazyMotion + domAnimation cuts ~25KB off the framer-motion bundle vs
 * importing the full `motion` API. This component renders on every page,
 * so the saving is real even though framer-motion stays as a dep.
 */
export default function FadeUp({ children, delay = 0, duration = 0.45, className, id, fade }: Props) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        id={id}
        className={className}
        initial={{ opacity: 0, y: fade ? 0 : 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
