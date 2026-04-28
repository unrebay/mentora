"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_KEY = "mentora_tour_v1";
const CARD_W = 360;
const CARD_H = 310;
const SPOT_PAD = 12;
const SPOT_R   = 16; // rounded corners on spotlight
const CARD_GAP = 18;

/* ── Step icon SVG paths ──────────────────────────────────────────── */
const STEP_ICONS: Record<string, string> = {
  wave:  "M6 8c0-1.1.9-2 2-2s2 .9 2 2c0 2.2-4 5-4 5s-4-2.8-4-5c0-1.1.9-2 2-2s2 .9 2 2zM14 4c.6 0 1 .4 1 1v6c0 .6-.4 1-1 1h-2",
  book:  "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  chat:  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  flame: "M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-2-1-4-2-5-1 2-3 3-3 5 0-3 0-7 0-10z",
  star:  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  gift:  "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
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
  targetSelector?: string;
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
    targetSelector: "[data-tour='continue-learning']",
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

interface SpotRect { x: number; y: number; w: number; h: number }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

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

function cardPos(
  spot: SpotRect | null,
  side: Step["cardSide"],
  _stepIdx: number,
  vw: number,
  vh: number,
  isMobile: boolean,
): { x: number; y: number } {
  const cw = Math.min(CARD_W, vw - 32);
  const ch = CARD_H;
  const NAV_H = 92;

  if (isMobile) {
    return { x: Math.max(8, (vw - cw) / 2), y: vh - ch - 36 };
  }

  if (!spot || side === "center") {
    return {
      x: clamp(vw / 2 - cw / 2, 16, vw - cw - 16),
      y: clamp(vh / 2 - ch / 2, NAV_H, vh - ch - 24),
    };
  }

  const spotCX = spot.x + spot.w / 2;
  const spotCY = spot.y + spot.h / 2;
  const cardX = clamp(spotCX - cw / 2, 16, vw - cw - 16);

  const belowY = spot.y + spot.h + CARD_GAP;
  const aboveY = spot.y - ch - CARD_GAP;
  const rightX = spot.x + spot.w + CARD_GAP;
  const leftX  = spot.x - cw - CARD_GAP;

  const hasRoomBelow = belowY + ch <= vh - 8;
  const hasRoomAbove = aboveY >= NAV_H;
  const hasRoomRight = rightX + cw <= vw - 8;
  const hasRoomLeft  = leftX >= 8;

  const cardY = clamp(spotCY - ch / 2, NAV_H, vh - ch - 24);

  function tryAll(preferred: "above" | "below" | "right" | "left"): { x: number; y: number } {
    const order: ("above" | "below" | "right" | "left")[] =
      preferred === "below" ? ["below", "above", "right", "left"] :
      preferred === "above" ? ["above", "below", "right", "left"] :
      preferred === "right" ? ["right", "left",  "below", "above"] :
                              ["left",  "right",  "below", "above"];

    for (const dir of order) {
      if (dir === "below" && hasRoomBelow) return { x: cardX, y: belowY };
      if (dir === "above" && hasRoomAbove) return { x: cardX, y: aboveY };
      if (dir === "right" && hasRoomRight) return { x: rightX, y: cardY };
      if (dir === "left"  && hasRoomLeft)  return { x: leftX,  y: cardY };
    }
    return { x: clamp(vw / 2 - cw / 2, 16, vw - cw - 16), y: NAV_H };
  }

  switch (side) {
    case "bottom": return tryAll("below");
    case "top":    return tryAll("above");
    case "right":  return tryAll("right");
    case "left":   return tryAll("left");
    default:
      return { x: clamp(vw / 2 - cw / 2, 16, vw - cw - 16), y: clamp(vh / 2 - ch / 2, NAV_H, vh - ch - 24) };
  }
}

/* ── Spotlight overlay — SVG mask for rounded cutout ─────────────── */
function SpotlightOverlay({
  spot,
  isDark,
  onClose,
}: {
  spot: SpotRect | null;
  isDark: boolean;
  onClose: () => void;
}) {
  const overlayColor = isDark ? "rgba(4,4,18,0.78)" : "rgba(160,165,200,0.55)";
  const ringColor = isDark ? "rgba(107,135,255,0.75)" : "rgba(69,97,232,0.7)";
  const glowColor = isDark ? "rgba(107,135,255,0.2)" : "rgba(69,97,232,0.15)";

  if (!spot) {
    return (
      <div
        style={{ position: "fixed", inset: 0, background: overlayColor, pointerEvents: "all", cursor: "default" }}
        onClick={onClose}
      />
    );
  }

  const { x, y, w, h } = spot;

  return (
    <>
      {/* SVG visual overlay with rounded rectangle cutout */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx={SPOT_R} ry={SPOT_R} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={overlayColor}
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Click-to-close divs (4 quadrants, transparent) */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, y), pointerEvents: "all", cursor: "default" }} onClick={onClose} />
      <div style={{ position: "fixed", top: y + h, left: 0, right: 0, bottom: 0, pointerEvents: "all", cursor: "default" }} onClick={onClose} />
      <div style={{ position: "fixed", top: y, left: 0, width: Math.max(0, x), height: h, pointerEvents: "all", cursor: "default" }} onClick={onClose} />
      <div style={{ position: "fixed", top: y, left: x + w, right: 0, height: h, pointerEvents: "all", cursor: "default" }} onClick={onClose} />

      {/* Glow ring with matching border radius */}
      <div style={{
        position: "fixed",
        top: y - 2, left: x - 2,
        width: w + 4, height: h + 4,
        border: `2px solid ${ringColor}`,
        borderRadius: SPOT_R + 2,
        boxShadow: `0 0 0 1px ${glowColor.replace("0.2", "0.12")}, 0 0 28px ${glowColor}, inset 0 0 20px ${glowColor.replace("0.2", "0.05")}`,
        pointerEvents: "none",
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        zIndex: 1,
      }} />
    </>
  );
}

/* ── Main component ────────────────────────────────────────────────── */
export default function OnboardingTour() {
  const [visible, setVisible]   = useState(false);
  const [step, setStep]         = useState(0);
  const [spot, setSpot]         = useState<SpotRect | null>(null);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady]       = useState(false);
  const [isDark, setIsDark]     = useState(true);
  const searchParams = useSearchParams();

  /* ── Theme detection ──────────────────────────────────────────── */
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

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

    // Scroll element into view with nav clearance
    const scrollY = window.scrollY + el.getBoundingClientRect().top - 130;
    window.scrollTo({ top: Math.max(0, scrollY), behavior: "smooth" });

    const timer = setTimeout(() => {
      const r = querySpot(s.targetSelector!);
      setSpot(r);
      setPos(cardPos(r, s.cardSide, stepIdx, vw, vh, mobile));
    }, 420);
    return timer;
  }, []);

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setReady(true);

    // Auto-open on first visit or ?tour=1
    const forceOpen = searchParams.get("tour") === "1";
    if (!localStorage.getItem(TOUR_KEY) || forceOpen) {
      const timer = setTimeout(() => {
        // Mark as seen immediately on auto-open (not just on close)
        // so closing the browser tab doesn't cause it to repeat
        if (!forceOpen) localStorage.setItem(TOUR_KEY, "1");
        setVisible(true);
        refreshLayout(0, mobile);
      }, forceOpen ? 400 : 900);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("mentora:open-tour", openHandler);
      window.removeEventListener("resize", onResize);
    };
  }, [ready, refreshLayout]);

  useEffect(() => {
    if (!visible) return;
    const timer = refreshLayout(step, isMobile);
    return () => { if (timer) clearTimeout(timer); };
  }, [step, visible, isMobile, refreshLayout]);

  const close = useCallback((markDone = false) => {
    if (markDone) localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  }, []);

  const goTo = useCallback((idx: number) => { setStep(idx); }, []);
  const next = () => { if (step < STEPS.length - 1) goTo(step + 1); else close(true); };
  const prev = () => { if (step > 0) goTo(step - 1); };

  if (!ready || !visible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const cardW = Math.min(CARD_W, vw - 24);

  /* ── Theme-aware colours ──────────────────────────────────────── */
  const C = {
    cardBg:       isDark ? "rgba(10,10,26,0.92)"         : "rgba(255,255,255,0.97)",
    cardBorder:   isDark ? "rgba(255,255,255,0.13)"       : "rgba(0,0,0,0.09)",
    cardShadow:   isDark
      ? "0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(69,97,232,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
      : "0 8px 48px rgba(0,0,0,0.10), 0 0 0 1px rgba(69,97,232,0.10), inset 0 1px 0 rgba(255,255,255,1)",
    topAccent:    "linear-gradient(90deg, #4561E8, #a78bfa, transparent)",
    tagColor:     "#6b87ff",
    titleColor:   isDark ? "white"                        : "var(--text)",
    descColor:    isDark ? "rgba(255,255,255,0.70)"       : "rgba(0,0,0,0.62)",
    tipColor:     isDark ? "rgba(255,255,255,0.33)"       : "rgba(0,0,0,0.32)",
    counterBg:    isDark ? "rgba(10,10,26,0.92)"          : "rgba(255,255,255,0.95)",
    counterText:  isDark ? "rgba(255,255,255,0.45)"       : "rgba(0,0,0,0.38)",
    counterBorder:isDark ? "rgba(255,255,255,0.10)"       : "rgba(0,0,0,0.10)",
    iconBg:       isDark ? "rgba(69,97,232,0.20)"         : "rgba(69,97,232,0.10)",
    iconBorder:   isDark ? "rgba(69,97,232,0.32)"         : "rgba(69,97,232,0.22)",
    closeBg:      isDark ? "rgba(255,255,255,0.06)"       : "rgba(0,0,0,0.05)",
    closeBorder:  isDark ? "rgba(255,255,255,0.12)"       : "rgba(0,0,0,0.10)",
    closeColor:   isDark ? "rgba(255,255,255,0.40)"       : "rgba(0,0,0,0.35)",
    dotInactive:  isDark ? "rgba(255,255,255,0.18)"       : "rgba(0,0,0,0.15)",
    prevBg:       isDark ? "rgba(255,255,255,0.06)"       : "rgba(0,0,0,0.05)",
    prevBorder:   isDark ? "rgba(255,255,255,0.12)"       : "rgba(0,0,0,0.10)",
    prevColor:    isDark ? "rgba(255,255,255,0.55)"       : "rgba(0,0,0,0.45)",
    connectorColor: isDark ? "rgba(107,135,255,0.30)"    : "rgba(69,97,232,0.25)",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>

      {/* ── Spotlight overlay ─────────────────────────────────────── */}
      <SpotlightOverlay spot={spot} isDark={isDark} onClose={() => close(true)} />

      {/* ── Dashed connector from card to spotlight ───────────────── */}
      {spot && (
        <svg
          style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }}
        >
          <line
            x1={pos.x + cardW / 2}
            y1={pos.y + (pos.y < spot.y ? CARD_H : 0)}
            x2={spot.x + spot.w / 2}
            y2={pos.y < spot.y ? spot.y : spot.y + spot.h}
            stroke={C.connectorColor}
            strokeWidth="1"
            strokeDasharray="5 4"
          />
        </svg>
      )}

      {/* ── Floating card ─────────────────────────────────────────── */}
      <motion.div
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 240, damping: 30, mass: 0.85 }}
        style={{
          position: "fixed", top: 0, left: 0,
          width: cardW, pointerEvents: "all", zIndex: 10000,
        }}
      >
        {/* Step counter badge */}
        <div style={{
          position: "absolute", top: -11, right: 14,
          fontSize: 10, fontWeight: 700, color: C.counterText,
          background: C.counterBg, border: `1px solid ${C.counterBorder}`,
          borderRadius: 99, padding: "2px 8px", zIndex: 1,
        }}>
          {step + 1} / {STEPS.length}
        </div>

        {/* Glass card */}
        <div style={{
          background: C.cardBg,
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 20,
          boxShadow: C.cardShadow,
          overflow: "hidden",
        }}>
          {/* Top accent */}
          <div style={{ height: 2, background: C.topAccent, opacity: 0.85 }} />

          <div style={{ padding: "18px 20px 20px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: C.iconBg, border: `1px solid ${C.iconBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <StepIcon name={s.icon} color="#6b87ff" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.tagColor, marginBottom: 2 }}>
                    {s.tag}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.titleColor, lineHeight: 1.2 }}>
                    {s.title}
                  </div>
                </div>
              </div>
              <button
                onClick={() => close(true)}
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  border: `1px solid ${C.closeBorder}`,
                  background: C.closeBg,
                  color: C.closeColor,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 14, lineHeight: 1,
                }}
              >✕</button>
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
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: C.descColor, marginBottom: s.tip ? 12 : 0 }}>
                  {s.desc}
                </p>
                {s.tip && (
                  <span style={{ fontSize: 11.5, color: C.tipColor, fontStyle: "italic", lineHeight: 1.4 }}>
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
                      background: i === step ? "#4561E8" : C.dotInactive,
                      transition: "all 0.2s ease", padding: 0,
                    }}
                  />
                ))}
              </div>
              {/* Nav buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                {step > 0 && (
                  <button
                    onClick={prev}
                    style={{
                      padding: "7px 14px", borderRadius: 10,
                      border: `1px solid ${C.prevBorder}`,
                      background: C.prevBg,
                      color: C.prevColor,
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
