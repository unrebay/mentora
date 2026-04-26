"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Book SVG icon — subtle, monochrome */
function BookIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="13" y2="13" />
    </svg>
  );
}

function openTour() {
  window.dispatchEvent(new CustomEvent("mentora:open-tour"));
}

/* ── Desktop button (injected into DashboardNav) ──────────────────── */
export function TourButtonDesktop({ forceDark = false }: { forceDark?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={openTour}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Как пользоваться Mentora"
      aria-label="Открыть обучение"
      style={{
        width: 34, height: 34,
        borderRadius: 10,
        border: `1px solid ${forceDark ? "rgba(255,255,255,0.1)" : "var(--border)"}`,
        background: hovered
          ? forceDark ? "rgba(255,255,255,0.10)" : "var(--bg-secondary)"
          : "transparent",
        color: forceDark ? "rgba(255,255,255,0.38)" : "var(--text-muted)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
        flexShrink: 0,
      }}
    >
      <BookIcon size={15} />
    </button>
  );
}

/* ── Mobile floating button (appears after 10s of inactivity) ─────── */
const INACTIVITY_MS = 10_000;

export function TourButtonMobile() {
  const [visible, setVisible] = useState(false);
  const [pulsed, setPulsed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      setVisible(false);
      timer = setTimeout(() => {
        setVisible(true);
        setPulsed(true);
        setTimeout(() => setPulsed(false), 2000);
      }, INACTIVITY_MS);
    };

    // Only run on mobile
    if (window.innerWidth >= 768) return;

    const events = ["mousemove", "touchstart", "keydown", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset(); // start timer immediately

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="tour-float"
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          onClick={() => { setVisible(false); openTour(); }}
          aria-label="Как пользоваться"
          style={{
            position: "fixed",
            bottom: 88, // above mobile bottom nav if present
            right: 18,
            zIndex: 9000,
            width: 46, height: 46,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(12,12,28,0.88)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            color: "rgba(255,255,255,0.5)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <BookIcon size={18} />
          {/* Pulse ring on first appearance */}
          {pulsed && (
            <motion.span
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.9 }}
              style={{
                position: "absolute", inset: 0, borderRadius: 14,
                border: "2px solid rgba(107,135,255,0.5)",
                pointerEvents: "none",
              }}
            />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
