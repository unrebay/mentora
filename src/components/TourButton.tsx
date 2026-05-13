"use client";
import { useEffect, useState, useRef } from "react";
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

/** True when the current pathname is /dashboard exactly (not /dashboard/analytics
 *  or /dashboard/about). Locale-prefix-aware: matches /dashboard, /ru/dashboard,
 *  /en/dashboard, etc. */
function useIsDashboardRoot() {
  const pathname = usePathname();
  if (!pathname) return false;
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] === "dashboard";
}

function useOpenTour() {
  const pathname = usePathname();
  const router = useRouter();
  return () => {
    if (pathname && pathname.split("/").filter(Boolean).pop() === "dashboard") {
      window.dispatchEvent(new CustomEvent("mentora:open-tour"));
    } else {
      router.push("/dashboard?tour=1");
    }
  };
}

/* ── One-time hint bubble pointing at the tour button (first visit only) ─── */
const HINT_KEY = "mentora_tour_hint_v1";

function TourHintBubble({ forceDark }: { forceDark: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(HINT_KEY)) return;

    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem(HINT_KEY, "1");
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
          <div style={{
            position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)",
            width: 10, height: 5, overflow: "hidden",
          }}>
            <div style={{
              width: 8, height: 8,
              background: forceDark ? "rgba(18,18,38,0.95)" : "rgba(255,255,255,0.97)",
              border: `1px solid ${forceDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)"}`,
              transform: "rotate(45deg) translate(1px, 1px)",
            }} />
          </div>
          <div style={{
            whiteSpace: "nowrap", padding: "6px 11px", borderRadius: 10,
            fontSize: 11.5, fontWeight: 600, lineHeight: 1.4,
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

/* ── Navbar tour button — only renders on /dashboard root ─────────────────
 *  Why /dashboard only: the tour walks the user through dashboard widgets;
 *  on other pages clicking it just teleports them to /dashboard, which is
 *  jarring. Per-page tutorials would justify keeping the button on every
 *  page — until then, hide it elsewhere.
 *
 *  Inactivity pulse: after 10s without user input, the button gets a soft
 *  pulsing glow around its contour. Calls attention without being a
 *  floating CTA in the corner.
 */
const INACTIVITY_MS = 10_000;

export function TourButtonDesktop({ forceDark = false }: { forceDark?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const isDashboardRoot = useIsDashboardRoot();
  const openTour = useOpenTour();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inactivity timer — start a soft pulsing glow after 10s of no input.
  // User interaction kills the timer; the glow restarts the cycle.
  useEffect(() => {
    if (!isDashboardRoot) return;

    const arm = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPulsing(false);
      timerRef.current = setTimeout(() => setPulsing(true), INACTIVITY_MS);
    };

    const events = ["mousemove", "touchstart", "keydown", "scroll", "click"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [isDashboardRoot]);

  // Stop the pulse when the user finally interacts with the button itself
  const handleClick = () => {
    setPulsing(false);
    openTour();
  };

  if (!isDashboardRoot) return null;

  // Soft, slow, breathing glow — fades in/out a colored shadow around the
  // button's border-radius. Color matches the brand accent.
  const glowColor = "107,135,255";
  const pulseShadow = pulsing
    ? `0 0 0 1px rgba(${glowColor},0.30), 0 0 16px 2px rgba(${glowColor},0.45)`
    : "none";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Как пользоваться Mentora"
        aria-label="Открыть обучение"
        style={{
          width: 30, height: 30,
          borderRadius: 8,
          border: `1px solid ${forceDark ? "rgba(255,255,255,0.1)" : "var(--border)"}`,
          background: hovered
            ? forceDark ? "rgba(255,255,255,0.10)" : "var(--bg-secondary)"
            : "transparent",
          color: forceDark ? "rgba(255,255,255,0.38)" : "var(--text-muted)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          // Animate boxShadow for the slow soft breathing effect. Long
          // transition + the `mentoraTourPulse` keyframes give a calm pulse
          // that reads as "this is where help lives" rather than a panic
          // notification.
          boxShadow: pulseShadow,
          transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 1.6s ease-in-out",
          animation: pulsing ? "mentoraTourPulse 2.4s ease-in-out infinite" : "none",
          flexShrink: 0,
        }}
      >
        <BookIcon size={14} />
      </button>
      <TourHintBubble forceDark={forceDark} />
    </div>
  );
}

/* `TourButtonMobile` was a floating-CTA that popped up bottom-right after
 * inactivity — removed in favor of the navbar button's pulse glow above.
 * Kept as a no-op export so existing imports don't break across deploys
 * (will be cleaned up once layout.tsx removes the reference). */
export function TourButtonMobile() {
  return null;
}
