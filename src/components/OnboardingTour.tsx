"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

const TOUR_KEY = "mentora_tour_v1";
const CARD_W = 360;
const CARD_H = 290; // approximate for clamping

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
  /** cx/cy = fraction of viewport (0..1), where the card center lands */
  cx: number;
  cy: number;
  icon: string;
  tag: string;
  title: string;
  desc: string;
  tip?: string;
  /** arrow direction pointing toward the UI element being described */
  arrow?: "up" | "down" | "left" | "right";
}

const STEPS: Step[] = [
  {
    cx: 0.5, cy: 0.5,
    icon: "wave",
    tag: "Добро пожаловать",
    title: "Ты в Mentora!",
    desc: "AI-ментор по 14 предметам — знает твой уровень и объясняет так, как тебе удобно. Пройдём быстрый тур?",
    tip: "Займёт меньше минуты",
  },
  {
    cx: 0.28, cy: 0.68,
    icon: "book",
    tag: "Предметы",
    title: "Выбери предмет",
    desc: "Нажми на любую карточку — откроется чат именно по этой теме. Прогресс по каждому предмету хранится отдельно.",
    arrow: "down",
    tip: "Можно менять предмет в любое время",
  },
  {
    cx: 0.72, cy: 0.38,
    icon: "chat",
    tag: "Чат",
    title: "Просто задай вопрос",
    desc: "Внутри предмета — живой чат. Пиши свободно: «объясни теорему Пифагора» или «почему началась Холодная война». Ментора помнит весь контекст.",
    tip: "Можно переспрашивать сколько угодно",
  },
  {
    cx: 0.5, cy: 0.14,
    icon: "flame",
    tag: "Прогресс",
    title: "Стрики и менты",
    desc: "Каждый день учёбы — это стрик. Каждый ответ приносит менты (твой XP). Они видны в шапке прямо сейчас.",
    arrow: "up",
    tip: "Стрик сбрасывается если пропустить день",
  },
  {
    cx: 0.5, cy: 0.5,
    icon: "star",
    tag: "Тарифы",
    title: "Базовый и Pro",
    desc: "Бесплатно: 20 сообщений в сутки и один активный предмет. Pro (499 ₽/мес) — безлимит, все 14 предметов, долгосрочная память.",
    tip: "Пробные дни дают новым пользователям",
  },
  {
    cx: 0.72, cy: 0.72,
    icon: "gift",
    tag: "Рефералы",
    title: "Приглашай — получай дни",
    desc: "Твоя реферальная ссылка — в профиле. Приглашённый друг регистрируется — вам обоим +3 дня Pro. Его рефералы тоже приносят тебе +1 день.",
    arrow: "down",
    tip: "До 4 уровней в реферальной цепочке",
  },
];

/* ── Position helpers ──────────────────────────────────────────────── */
function getCardPos(step: number, isMobile: boolean): { x: number; y: number } {
  if (isMobile || typeof window === "undefined") {
    const vw = typeof window !== "undefined" ? window.innerWidth : 390;
    const vh = typeof window !== "undefined" ? window.innerHeight : 844;
    return {
      x: Math.max(0, (vw - Math.min(CARD_W, vw - 24)) / 2),
      y: Math.max(60, (vh - CARD_H) / 2),
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { cx, cy } = STEPS[step];
  const cardW = Math.min(CARD_W, vw - 32);
  const x = Math.max(16, Math.min(vw - cardW - 16, cx * vw - cardW / 2));
  const y = Math.max(72, Math.min(vh - CARD_H - 24, cy * vh - CARD_H / 2));
  return { x, y };
}

/* ── Arrow SVG ─────────────────────────────────────────────────────── */
function Arrow({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const arrows = {
    up:    { d: "M8 12L8 4M8 4L4 8M8 4L12 8", label: "↑" },
    down:  { d: "M8 4L8 12M8 12L4 8M8 12L12 8", label: "↓" },
    left:  { d: "M12 8L4 8M4 8L8 4M4 8L8 12", label: "←" },
    right: { d: "M4 8L12 8M12 8L8 4M12 8L8 12", label: "→" },
  }[dir];
  return (
    <motion.span
      animate={{ y: dir === "down" ? [0, 4, 0] : dir === "up" ? [0, -4, 0] : 0, x: dir === "right" ? [0, 4, 0] : dir === "left" ? [0, -4, 0] : 0 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      className="inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
      style={{ background: "rgba(69,97,232,0.2)", border: "1px solid rgba(69,97,232,0.4)" }}
    >
      <svg viewBox="0 0 16 16" fill="none" width="12" height="12" stroke="#6b87ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={arrows.d} />
      </svg>
    </motion.span>
  );
}

/* ── Main component ────────────────────────────────────────────────── */
export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  const updatePos = useCallback((stepIdx: number, mobile: boolean) => {
    setPos(getCardPos(stepIdx, mobile));
  }, []);

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    // Show tour for new users
    if (!localStorage.getItem(TOUR_KEY)) {
      const initialPos = getCardPos(0, mobile);
      setPos(initialPos);
      setReady(true);
      // Small delay so the page settles first
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
    setReady(true);

    // Listen for manual open
    const openHandler = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      setStep(0);
      setPos(getCardPos(0, m));
      setVisible(true);
    };
    window.addEventListener("mentora:open-tour", openHandler);

    const onResize = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mentora:open-tour", openHandler);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Also register open handler when already done (for TourButton)
  useEffect(() => {
    if (!ready) return;
    const openHandler = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      setStep(0);
      setPos(getCardPos(0, m));
      setVisible(true);
    };
    window.addEventListener("mentora:open-tour", openHandler);
    return () => window.removeEventListener("mentora:open-tour", openHandler);
  }, [ready]);

  const close = useCallback((markDone = false) => {
    if (markDone) localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  }, []);

  const goTo = useCallback((idx: number) => {
    setStep(idx);
    updatePos(idx, isMobile);
  }, [isMobile, updatePos]);

  const next = () => {
    if (step < STEPS.length - 1) goTo(step + 1);
    else close(true);
  };

  const prev = () => { if (step > 0) goTo(step - 1); };

  if (!ready || !visible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const cardW = typeof window !== "undefined" ? Math.min(CARD_W, window.innerWidth - 24) : CARD_W;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => close(false)}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(4,4,16,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          pointerEvents: "all",
        }}
      />

      {/* ── Flying card ── */}
      <motion.div
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.9 }}
        style={{
          position: "absolute", top: 0, left: 0,
          width: cardW,
          pointerEvents: "all",
          zIndex: 9999,
        }}
      >
        {/* Glass card */}
        <div
          style={{
            background: "rgba(12,12,28,0.82)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20,
            boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(69,97,232,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div style={{ height: 2, background: "linear-gradient(90deg, #4561E8, #a78bfa, transparent)", opacity: 0.8 }} />

          <div style={{ padding: "18px 20px 20px" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(69,97,232,0.18)",
                  border: "1px solid rgba(69,97,232,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
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
                  width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 14, lineHeight: 1,
                }}
                title="Закрыть"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.65)", marginBottom: s.tip || s.arrow ? 12 : 0 }}>
                  {s.desc}
                </p>

                {(s.tip || s.arrow) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {s.arrow && <Arrow dir={s.arrow} />}
                    {s.tip && (
                      <span style={{
                        fontSize: 11.5, color: "rgba(255,255,255,0.35)",
                        fontStyle: "italic", lineHeight: 1.4,
                      }}>
                        {s.tip}
                      </span>
                    )}
                  </div>
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
                      width: i === step ? 18 : 6,
                      height: 6,
                      borderRadius: 99,
                      border: "none",
                      cursor: "pointer",
                      background: i === step ? "#4561E8" : "rgba(255,255,255,0.18)",
                      transition: "all 0.2s ease",
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                {step > 0 && (
                  <button
                    onClick={prev}
                    style={{
                      padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)",
                      cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                    }}
                  >
                    Назад
                  </button>
                )}
                <button
                  onClick={next}
                  style={{
                    padding: "7px 18px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
                    color: "white", cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                    boxShadow: "0 4px 16px rgba(69,97,232,0.4)",
                  }}
                >
                  {isLast ? "Понятно!" : "Далее →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step counter badge */}
        <div style={{
          position: "absolute", top: -10, right: 14,
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
          background: "rgba(12,12,28,0.9)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 99, padding: "2px 8px",
        }}>
          {step + 1} / {STEPS.length}
        </div>
      </motion.div>
    </div>
  );
}
