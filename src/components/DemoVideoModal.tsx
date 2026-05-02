"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import MeLogo from "@/components/MeLogo";

interface Props {
  open: boolean;
  onClose: () => void;
}

const BRAND = "#4561E8";
const GLASS_BG = "rgba(6,6,18,0.85)";
const GLASS_BLUR = "blur(24px) saturate(1.6) brightness(1.02)";
const GLASS_BORDER = "1px solid rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const TEXT_MUTED = "rgba(255,255,255,0.55)";

// Single scripted dialog — RU/EN. Messages animate sequentially.
const SCRIPT_RU = {
  question: "Объясни теорему Пифагора простыми словами",
  answer: "Это правило про прямоугольные треугольники: квадрат длинной стороны (гипотенузы) равен сумме квадратов двух коротких. Если катеты 3 и 4, то гипотенуза = √(9+16) = 5.",
  cta: "Попробовать самому →",
};
const SCRIPT_EN = {
  question: "Explain the Pythagorean theorem in simple terms",
  answer: "It's a rule about right-angled triangles: the square of the longest side (the hypotenuse) equals the sum of squares of the two shorter sides. If the legs are 3 and 4, the hypotenuse = √(9+16) = 5.",
  cta: "Try it yourself →",
};

type Phase = "typing-input" | "question" | "thinking" | "answer" | "done";

export default function DemoVideoModal({ open, onClose }: Props) {
  const t = useTranslations("demo");
  const locale = useLocale();
  const script = locale === "en" ? SCRIPT_EN : SCRIPT_RU;
  const [phase, setPhase] = useState<Phase>("typing-input");
  const [typedQuestion, setTypedQuestion] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Animation state machine — runs once when modal opens, then loops
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTypedQuestion("");
    setTypedAnswer("");
    setPhase("typing-input");

    async function runOnce() {
      // 1. Type the question into input field, char by char
      for (let i = 1; i <= script.question.length; i++) {
        if (cancelled) return;
        setTypedQuestion(script.question.slice(0, i));
        await sleep(35 + Math.random() * 35);
      }
      await sleep(500);
      if (cancelled) return;

      // 2. Question bubble appears, input clears
      setPhase("question");
      setTypedQuestion("");
      await sleep(700);
      if (cancelled) return;

      // 3. Mentora "thinking" with typing indicator
      setPhase("thinking");
      await sleep(1400);
      if (cancelled) return;

      // 4. Answer types out, char by char (faster than question)
      setPhase("answer");
      for (let i = 1; i <= script.answer.length; i++) {
        if (cancelled) return;
        setTypedAnswer(script.answer.slice(0, i));
        await sleep(15 + Math.random() * 15);
      }
      setPhase("done");
      await sleep(2500);
      if (cancelled) return;

      // 5. Reset and loop
      setTypedQuestion("");
      setTypedAnswer("");
      setPhase("typing-input");
      runOnce();
    }
    runOnce();

    return () => { cancelled = true; };
  }, [open, script.question, script.answer]);

  function tryItYourself() {
    onClose();
    setTimeout(() => {
      const el = document.getElementById("demo");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        document.querySelector<HTMLTextAreaElement>("#demo textarea")?.focus();
      }, 500);
    }, 200);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(2,3,10,0.78)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", animation: "demoFadeIn 0.25s ease-out" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "demoSlideUp 0.35s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-12 right-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            WebkitBackdropFilter: GLASS_BLUR,
            border: GLASS_BORDER,
            color: TEXT,
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header pill */}
        <div className="self-start flex items-center gap-2.5"
          style={{
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            WebkitBackdropFilter: GLASS_BLUR,
            border: GLASS_BORDER,
            borderRadius: 20,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 48px rgba(0,0,0,0.55)",
            padding: "8px 14px 8px 10px",
          }}
        >
          <div className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
            <MeLogo height={12} colorM="#111111" colorE={BRAND} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none" style={{ color: TEXT }}>{t("botTitle")}</p>
            <p className="text-[11px] leading-none mt-1 flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
              {t("onlineLabel")}
            </p>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex flex-col gap-2.5 min-h-[260px]">
          {/* Question bubble — appears in phase >= question */}
          {(phase === "question" || phase === "thinking" || phase === "answer" || phase === "done") && (
            <div className="flex justify-end gap-2 demo-bubble-in">
              <div className="max-w-[80%] px-4 py-2.5 text-[14px] leading-[1.6]"
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, #6B8FFF)`,
                  color: "white",
                  boxShadow: `0 2px 12px ${BRAND}55, 0 1px 0 rgba(255,255,255,0.15) inset`,
                  borderRadius: "20px 20px 4px 20px",
                }}>
                {script.question}
              </div>
            </div>
          )}

          {/* Typing indicator — phase thinking */}
          {phase === "thinking" && (
            <div className="flex justify-start gap-2 demo-bubble-in">
              <div className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 mt-auto mb-0.5"
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                <MeLogo height={12} colorM="#111111" colorE={BRAND} />
              </div>
              <div className="px-3.5 py-2.5 flex items-center gap-1"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  WebkitBackdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  borderRadius: "20px 20px 20px 4px",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 48px rgba(0,0,0,0.55)",
                }}>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: TEXT_MUTED, animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: TEXT_MUTED, animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: TEXT_MUTED, animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Answer bubble — types out char by char */}
          {(phase === "answer" || phase === "done") && (
            <div className="flex justify-start gap-2 demo-bubble-in">
              <div className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 mt-auto mb-0.5"
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                <MeLogo height={12} colorM="#111111" colorE={BRAND} />
              </div>
              <div className="max-w-[82%] px-4 py-2.5 text-[14px] leading-[1.6]"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  WebkitBackdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  borderLeft: `2.5px solid ${BRAND}55`,
                  color: TEXT,
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 48px rgba(0,0,0,0.55)",
                  borderRadius: "20px 20px 20px 4px",
                }}>
                {typedAnswer}
                {phase === "answer" && <span className="inline-block w-0.5 h-3.5 ml-0.5 align-middle" style={{ background: TEXT, animation: "demoCaret 0.8s steps(1) infinite" }} />}
              </div>
            </div>
          )}
        </div>

        {/* Input pill — shows typed-question caret while typing-input phase */}
        <div className="flex gap-2 items-end">
          <div className="flex-1"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              WebkitBackdropFilter: GLASS_BLUR,
              border: GLASS_BORDER,
              borderRadius: 22,
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 12px rgba(0,0,0,0.4)",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
            }}
          >
            <span className="text-[15px]" style={{ color: phase === "typing-input" ? TEXT : TEXT_MUTED }}>
              {phase === "typing-input"
                ? <>{typedQuestion}<span className="inline-block w-0.5 h-3.5 ml-0.5 align-middle" style={{ background: TEXT, animation: "demoCaret 0.8s steps(1) infinite" }} /></>
                : t("placeholder")
              }
            </span>
          </div>
          <button
            type="button"
            disabled
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: phase === "typing-input" && typedQuestion.length === script.question.length ? `linear-gradient(135deg, ${BRAND}, #6B8FFF)` : GLASS_BG,
              backdropFilter: GLASS_BLUR,
              WebkitBackdropFilter: GLASS_BLUR,
              border: GLASS_BORDER,
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 12px rgba(0,0,0,0.4)",
              color: TEXT_MUTED,
              transition: "background 0.3s ease",
            }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Try it yourself CTA */}
        <button
          type="button"
          onClick={tryItYourself}
          className="self-center mt-2 px-6 py-3 text-sm font-semibold rounded-full text-white transition-all hover:scale-[1.03] active:scale-95"
          style={{
            background: `linear-gradient(135deg, #5575FF 0%, ${BRAND} 50%, #6B4FF0 100%)`,
            boxShadow: `0 4px 20px ${BRAND}66, 0 1px 0 rgba(255,255,255,0.2) inset`,
          }}
        >
          {script.cta}
        </button>
      </div>

      <style jsx>{`
        @keyframes demoFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes demoSlideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes demoCaret { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }
        :global(.demo-bubble-in) { animation: demoBubbleIn 0.35s cubic-bezier(0.22,1,0.36,1) }
        @keyframes demoBubbleIn { from { opacity: 0; transform: translateY(8px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
