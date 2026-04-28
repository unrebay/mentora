"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

function useOpenTour() {
  const pathname = usePathname();
  const router = useRouter();
  return () => {
    if (pathname === "/dashboard") {
      window.dispatchEvent(new CustomEvent("mentora:open-tour"));
    } else {
      router.push("/dashboard?tour=1");
    }
  };
}

/* ── One-time hint bubble pointing at the tour button ─────────────── */
const HINT_KEY = "mentora_tour_hint_v1";

function TourHintBubble({ forceDark }: { forceDark: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(HINT_KEY)) return;

    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem(HINT_KEY, "1");
      // Auto-hide after 5 seconds
      setTimeout(() => setShow(false), 5000);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.94 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={() => setShow(false)}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {/* Arrow pointing up */}
          <div style={{
            position: "absolute",
            top: -5,
            left: "50%",
            transform: "translateX(-50%)",
            width: 10,
            height: 5,
            overflow: "hidden",
          }}>
            <div style={{
              width: 8,
              height: 8,
              background: forceDark ? "rgba(18,18,38,0.95)" : "rgba(255,255,255,0.97)",
              border: `1px solid ${forceDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)"}`,
              transform: "rotate(45deg) translate(1px, 1px)",
            }} />
          </div>

          {/* Bubble */}
          <div style={{
            whiteSpace: "nowrap",
            padding: "6px 11px",
            borderRadius: 10,
            fontSize: 11.5,
            fontWeight: 600,
            lineHeight: 1.4,
            background: forceDark ? "rgba(18,18,38,0.95)" : "rgba(255,255,255,0.97)",
            border: `1px solid ${forceDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)"}`,
            color: forceDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
            boxShadow: forceDark
              ? "0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "0 4px 20px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,1)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}>
            туториал будет доступен здесь
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Desktop button (injected into DashboardNav) ──────────────────── */
export function TourButtonDesktop({ forceDark = false }: { forceDark?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const openTour = useOpenTour();

  return (
    <div style={{ position: "relative" }}>
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

      <TourHintBubble forceDark={forceDark} />
    </div>
  );
}

/* ── Mobile floating button (appears after 10s of inactivity) ─────── */
const INACTIVITY_MS = 10_000;

export function TourButtonMobile() {
  const [visible, setVisible] = useState(false);
  const [pulsed, setPulsed] = useState(false);
  const openTour = useOpenTour();

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

    if (window.innerWidth >= 768) return;

    const events = ["mousemove", "touchstart", "keydown", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

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
            bottom: 88,
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
