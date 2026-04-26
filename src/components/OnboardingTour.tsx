"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_KEY = "mentora_tour_v1";
const CARD_W = 360;
const CARD_H = 300;
const SPOT_PAD = 14;   // padding around element for spotlight rect
const CARD_GAP = 20;   // gap between spotlight edge and card

/* ── Step icon SVG paths ──────────────────────────────────────────── */
const STEP_ICONS: Record<string, string> = {
  wave:    "M6 8c0-1.1.9-2 2-2s2 .9 2 2c0 2.2-4 5-4 5s-4-2.8-4-5c0-1.1.9-2 2-2s2 .9 2 2zM14 4c.6 0 1 .4 1 1v6c0 .6-.4 1-1 1h-2",
  book:    "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  chat:    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  flame:   "M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-2-1-4-2-5-1 2-3 3-3 5 0-3 0-7 0-10z",
  star:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  gift:    "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
};

function StepIcon({ name, color = "#4561E8" }: { name: string; color?: string }) {
  const d = STEP_ICONS[name] ?? STEP_ICONS.star;
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Step definitions ──────────────────────────────────────────────── */
interface Step {
  /**
   * CSS selector of the element to spotlight.
   * null = no spotlight (welcome / tiers steps).
   */
  targetSelector?: string;
  /**
   * Preferred side for the card relative to the spotlight.
   * "center" means no spotlight — card in the middle of the screen.
   * For large (full-width) elements the card auto-falls to a safe corner.
   */
  cardSide: "top" | "bottom" | "left" | "right" | "center";
  icon: string;
  tag: string;
  title: string;
  desc: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    cardSide: "center",
    icon: "wave",
    tag: "Добро пожаловать",
    title: "Ты в Mentora!",
    desc: "AI-ментор по 14 предметам — знает твой уровень и объясняет так, как тебе удобно. Пройдём быстрый тур?",
    tip: "Займёт меньше минуты",
  },
  {
    targetSelector: "[data-tour='subjects']",
    cardSide: "bottom",
    icon: "book",
    tag: "Предметы",
    title: "Выбери предмет",
    desc: "Нажми на любую карточку — откроется чат именно по этой теме. Прогресс по каждому предмету хранится отдельно.",
    tip: "Можно менять предмет в любое время",
  },
  {
    targetSelector: "[data-tour='subjects']",
    cardSide: "bottom",
    icon: "chat",
    tag: "Чат",
    title: "Просто задай вопрос",
    desc: "Внутри предмета — живой чат. Пиши свободно: «объясни теорему Пифагора» или «почему началась Холодная война». Ментора помнит контекст.",
    tip: "Можно переспрашивать сколько угодно",
  },
  {
    targetSelector: "[data-tour='nav-stats']",
    cardSide: "bottom",
    icon: "flame",
    tag: "Прогресс",
    title: "Стрики и менты",
    desc: "Каждый день учёбы — это стрик. Каждый ответ приносит менты (твой XP). Они видны в шапке прямо сейчас.",
    tip: "Стрик сбрасывается если пропустить день",
  },
  {
    cardSide: "center",
    icon: "star",
    tag: "Тарифы",
    title: "Базовый и Pro",
    desc: "Бесплатно: 20 сообщений в сутки и один активный предмет. Pro (499 ₽/мес) — безлимит, все 14 предметов, долгосрочная память.",
    tip: "Пробные дни дают новым пользователям",
  },
  {
    targetSelector: "[data-tour='referral']",
    cardSide: "top",
    icon: "gift",
    tag: "Рефералы",
    title: "Приглашай — получай дни",
    desc: "Твоя реферальная ссылка — в профиле. Приглашённый друг регистрируется — вам обоим +3 дня Pro. Его рефералы тоже приносят тебе +1 день.",
    tip: "До 4 уровней в реферальной цепочке",
  },
];

/* ── Spotlight rect (viewport-relative, in px) ─────────────────────── */
interface SpotRect { x: number; y: number; w: number; h: number }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Query the DOM for a selector and return its padded bounding rect.
 * Returns null if element not found.
 */
function querySpot(selector: string): SpotRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return {
    x: r.left - SPOT_PAD,
    y: r.top  - SPOT_PAD,
    w: r.width  + SPOT_PAD * 2,
    h: r.height + SPOT_PAD * 2,
  };
}

/**
 * Compute where the card should sit given a spotlight rect, preferred side,
 * step index (used for alternating large-element placement), and viewport size.
 */
function cardPos(
  spot: SpotRect | null,
  side: Step["cardSide"],
  stepIdx: number,
  vw: number,
  vh: number,
  isMobile: boolean,
): { x: number; y: number } {
  const cw = Math.min(CARD_W, vw - 32);
  const ch = CARD_H;
  const NAV_H = 90; // below sticky nav pill

  // Mobile: always pin to bottom-center
  if (isMobile) {
    return { x: Math.max(0, (vw - cw) / 2), y: vh - ch - 40 };
  }

  // No spotlight: center of screen
  if (!spot || side === "center") {
    return {
      x: clamp(vw / 2 - cw / 2, 16, vw - cw - 16),
      y: clamp(vh / 2 - ch / 2, NAV_H, vh - ch - 24),
    };
  }

  // Wide element (takes ≥60% of viewport width): card goes below nav on
  // alternating left / right so successive steps feel distinct.
  if (spot.w >= vw * 0.6) {
    const leftSide = stepIdx % 2 === 1; // odd steps → left, even → right
    return {
      x: leftSide ? 16 : clamp(vw - cw - 16, 16, vw - cw - 16),
      y: NAV_H,
    };
  }

  // Normal-sized element: position outside on the preferred side.
  const centerX = clamp(spot.x + spot.w / 2 - cw / 2, 16, vw - cw - 16);
  const centerY = clamp(spot.y + spot.h / 2 - ch / 2, NAV_H, vh - ch - 24);

  switch (side) {
    case "top": {
      const y = spot.y - ch - CARD_GAP;
      return { x: centerX, y: y >= NAV_H ? y : spot.y + spot.h + CARD_GAP }; // flip to bottom if no room
    }
    case "bottom": {
      const y = spot.y + spot.h + CARD_GAP;
      return { x: centerX, y: Math.min(vh - ch - 24, y) };
    }
    case "left": {
      const x = spot.x - cw - CARD_GAP;
      return { x: Math.max(16, x), y: centerY };
    }
    case "right": {
      const x = spot.x + spot.w + CARD_GAP;
      return { x: Math.min(vw - cw - 16, x), y: centerY };
    }
    default:
      return { x: clamp(vw / 2 - cw / 2, 16, vw - cw - 16), y: clamp(vh / 2 - ch / 2, NAV_H, vh - ch - 24) };
  }
}

/* ── Main component ────────────────────────────────────────────────── */
export default function OnboardingTour() {
  const [visible, setVisible]   = useState(false);
  const [step, setStep]         = useState(0);
  const [spot, setSpot]         = useState<SpotRect | null>(null);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady]       = useState(false);

  /* Update spotlight + card position whenever step or visibility changes */
  const refreshLayout = useCallback((stepIdx: number, mobile: boolean) => {
    const s = STEPS[stepIdx];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!s.targetSelector) {
      setSpot(null);
      setPos(cardPos(null, s.cardSide, stepIdx, vw, vh, mobile));
      return;
    }

    const el = document.querySelector(s.targetSelector) as HTMLElement | null;
    if (!el) {
      setSpot(null);
      setPos(cardPos(null, "center", stepIdx, vw, vh, mobile));
      return;
    }

    // Scroll the element into view (top of viewport, accounting for nav height)
    const scrollY = window.scrollY + el.getBoundingClientRect().top - 100;
    window.scrollTo({ top: Math.max(0, scrollY), behavior: "smooth" });

    // Wait for scroll to settle, then measure
    const timer = setTimeout(() => {
      const r = querySpot(s.targetSelector!);
      setSpot(r);
      setPos(cardPos(r, s.cardSide, stepIdx, vw, vh, mobile));
    }, 450);
    return timer;
  }, []);

  /* Initial mount */
  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setReady(true);

    if (!localStorage.getItem(TOUR_KEY)) {
      const timer = setTimeout(() => {
        setVisible(true);
        refreshLayout(0, mobile);
      }, 900);
      return () => clearTimeout(timer);
    }

    const openHandler = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      setStep(0);
      setVisible(true);
      refreshLayout(0, m);
    };
    window.addEventListener("mentora:open-tour", openHandler);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("mentora:open-tour", openHandler);
      window.removeEventListener("resize", onResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* TourButton re-open (after ready=true) */
  useEffect(() => {
    if (!ready) return;
    const openHandler = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      setStep(0);
      setVisible(true);
      refreshLayout(0, m);
    };
    window.addEventListener("mentora:open-tour", openHandler);
    return () => window.removeEventListener("mentora:open-tour", openHandler);
  }, [ready, refreshLayout]);

  /* Refresh layout when step or visible changes */
  useEffect(() => {
    if (!visible) return;
    const timer = refreshLayout(step, isMobile);
    return () => { if (timer) clearTimeout(timer); };
  }, [step, visible, isMobile, refreshLayout]);

  const close = useCallback((markDone = false) => {
    if (markDone) localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  }, []);

  const goTo = useCallback((idx: number) => {
    setStep(idx);
  }, []);

  const next = () => { if (step < STEPS.length - 1) goTo(step + 1); else close(true); };
  const prev = () => { if (step > 0) goTo(step - 1); };

  if (!ready || !visible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const cardW = Math.min(CARD_W, vw - 24);
  const hasSpotlight = !!spot;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>
      {/* ── SVG backdrop with rectangular spotlight cutout ── */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "all" }}
        onClick={() => close(false)}
      >
        <defs>
          <mask id="tourMask">
            <rect width="100%" height="100%" fill="white" />
            {hasSpotlight && (
              <motion.rect
                x={spot.x}
                y={spot.y}
                width={spot.w}
                height={spot.h}
                rx={16}
                fill="black"
                initial={false}
                animate={{ x: spot.x, y: spot.y, width: spot.w, height: spot.h }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            )}
          </mask>
        </defs>

        {/* Dark overlay with spotlight hole */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(4,4,18,0.65)"
          mask="url(#tourMask)"
        />

        {/* Spotlight ring glow */}
        {hasSpotlight && (
          <motion.rect
            x={spot.x - 2}
            y={spot.y - 2}
            width={spot.w + 4}
            height={spot.h + 4}
            rx={17}
            fill="none"
            stroke="rgba(107,135,255,0.6)"
            strokeWidth="1.5"
            initial={false}
            animate={{ x: spot.x - 2, y: spot.y - 2, width: spot.w + 4, height: spot.h + 4 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        )}
      </svg>

      {/* ── Flying card ── */}
      <motion.div
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 240, damping: 30, mass: 0.85 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: cardW,
          pointerEvents: "all",
          zIndex: 9999,
        }}
      >
        {/* Step counter badge */}
        <div style={{
          position: "absolute", top: -11, right: 14,
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
          background: "rgba(10,10,26,0.92)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 99, padding: "2px 8px", zIndex: 1,
        }}>
          {step + 1} / {STEPS.length}
        </div>

        {/* Glass card */}
        <div style={{
          background: "rgba(10,10,26,0.88)",
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 20,
          boxShadow: "0 8px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(69,97,232,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}>
          {/* Top accent bar */}
          <div style={{ height: 2, background: "linear-gradient(90deg, #4561E8, #a78bfa, transparent)", opacity: 0.85 }} />

          <div style={{ padding: "18px 20px 20px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(69,97,232,0.2)",
                  border: "1px solid rgba(69,97,232,0.32)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <StepIcon name={s.icon} color="#6b87ff" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b87ff", marginBottom: 2 }}>
                    {s.tag}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1.2 }}>
                    {s.title}
                  </div>
                </div>
              </div>
              <button
                onClick={() => close(false)}
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 14, lineHeight: 1,
                }}
                title="Закрыть"
              >✕</button>
            </div>

            {/* Description (animated on step change) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(255,255,255,0.68)", marginBottom: s.tip ? 12 : 0 }}>
                  {s.desc}
                </p>
                {s.tip && (
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.33)", fontStyle: "italic", lineHeight: 1.4 }}>
                    {s.tip}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
              {/* Step dots */}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    style={{
                      width: i === step ? 18 : 6, height: 6, borderRadius: 99,
                      border: "none", cursor: "pointer",
                      background: i === step ? "#4561E8" : "rgba(255,255,255,0.18)",
                      transition: "all 0.2s ease", padding: 0,
                    }}
                  />
                ))}
              </div>
              {/* Navigation buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                {step > 0 && (
                  <button
                    onClick={prev}
                    style={{
                      padding: "7px 14px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.55)",
                      cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                    }}
                  >Назад</button>
                )}
                <button
                  onClick={next}
                  style={{
                    padding: "7px 18px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
                    color: "white", cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                    boxShadow: "0 4px 16px rgba(69,97,232,0.4)",
                  }}
                >{isLast ? "Понятно!" : "Далее →"}</button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
