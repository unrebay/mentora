"use client";
import { useState } from "react";
import Logo from "@/components/Logo";
import SubjectIcon from "@/components/SubjectIcon";
import SphereBlobScene from "@/components/SphereBlobScene";
import { useTranslations } from "next-intl";

async function completeOnboarding(answers: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch("/api/onboarding/complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });
    return res.ok;
  } catch { return false; }
}

/* ── Inline SVG icons for each option value ───────────────────────────── */
function OptionIcon({ value }: { value: string }) {
  const props = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (value) {
    /* Learning styles */
    case "storytelling": return <svg {...props}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    case "facts": return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "practice": return <svg {...props}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    /* Levels */
    case "school": return <svg {...props}><path d="M5 16H3l1-6h7V5a2 2 0 114 0v5h7l1 6h-2" /><path d="M9 20h6M12 16v4" /></svg>;
    case "student": return <svg {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
    case "adult": return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
    case "expert": return <svg {...props}><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5a2 2 0 01-2-2V9m6 5h10a2 2 0 002-2V9m0 0H9" /><circle cx="9" cy="18" r="1" /><path d="M9 14l4.5 5" /></svg>;
    /* Goals */
    case "exam": return <svg {...props}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>;
    case "general": return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>;
    case "professional": return <svg {...props}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;
    case "curiosity": return <svg {...props}><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    default: return null;
  }
}

const ONBOARDING_SPHERES = [
  { highlight: "#B8CCFF", mid: "#4561E8", shadow: "#1A2A8A", deepShadow: "#060820", glow: "rgba(69,97,232,0.45)", size: 360, top: "-10%", right: "-5%", float: "sphereFloat1" as const, duration: "10s", opacity: 0.7 },
  { highlight: "#FFD08C", mid: "#FF7A00", shadow: "#7A3800", deepShadow: "#200E00", glow: "rgba(255,122,0,0.35)", size: 240, bottom: "-5%", left: "-5%", float: "sphereFloat2" as const, duration: "13s", delay: "2s", opacity: 0.6 },
  { highlight: "#D4B8FF", mid: "#7C3AED", shadow: "#2E1278", deepShadow: "#0A0418", glow: "rgba(124,58,237,0.3)", size: 160, top: "45%", left: "8%", float: "sphereFloat3" as const, duration: "15s", delay: "4s", opacity: 0.55 },
];

const STEP_FIELDS = [
  { step: 1, field: "style",         values: ["storytelling", "facts", "practice"] },
  { step: 2, field: "level",         values: ["school", "student", "adult", "expert"] },
  { step: 3, field: "goal",          values: ["exam", "general", "professional", "curiosity"] },
  { step: 4, field: "first_subject", values: ["russian-history", "world-history", "mathematics", "physics", "english", "russian-language"] },
];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build localized steps from stable keys
  const STEPS = STEP_FIELDS.map(sf => ({
    ...sf,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    title: (t as any)(`${sf.field}.title`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subtitle: (t as any)(`${sf.field}.subtitle`),
    options: sf.values.map(v => ({
      value: v,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      label: (t as any)(`${sf.field}.${v}.label`),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      desc: (t as any)(`${sf.field}.${v}.desc`),
    })),
  }));

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isSubjectStep = step.field === "first_subject";

  async function handleNext() {
    if (!selected || saving) return;
    const newAnswers = { ...answers, [step.field]: selected };
    setAnswers(newAnswers);
    if (isLast) {
      setSaving(true); setError(null);
      const firstSubject = selected;
      const ok = await completeOnboarding(newAnswers);
      if (ok) {
        fetch("/api/email/welcome", { method: "POST" }).catch(() => {});
        window.location.href = `/learn/${firstSubject}`;
      } else {
        setError(t("errorSave")); setSaving(false);
      }
    } else {
      setCurrentStep((s) => s + 1); setSelected(null);
    }
  }

  async function handleSkip() {
    if (saving) return;
    setSaving(true); setError(null);
    const ok = await completeOnboarding({
      style: answers.style ?? "storytelling",
      level: answers.level ?? "adult",
      goal: answers.goal ?? "general",
      first_subject: "russian-history",
    });
    if (ok) { window.location.href = "/learn/russian-history"; }
    else { setError(t("errorSkip")); setSaving(false); }
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: "#04060f" }}
    >
      {/* Sphere background */}
      <SphereBlobScene spheres={ONBOARDING_SPHERES} intensity={0.9} />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Logo size="md" />
      </div>

      {/* Progress pills */}
      <div className="relative z-10 flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === currentStep ? "32px" : i < currentStep ? "24px" : "12px",
              background: i <= currentStep
                ? "linear-gradient(90deg, #4561E8, #6B8FFF)"
                : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      {/* Glass card */}
      <div
        className="relative z-10 w-full glass animate-fade-in-up"
        style={{ maxWidth: isSubjectStep ? "560px" : "440px", borderRadius: "24px", padding: "32px" }}
      >
        {/* Step indicator */}
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3"
          style={{
            background: "linear-gradient(90deg, #6B8FFF, #9F7AFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {t("step", { step: step.step, total: STEPS.length })}
        </p>
        <h1 className="text-2xl font-bold text-white mb-1 leading-snug">{step.title}</h1>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>{step.subtitle}</p>

        {/* Options */}
        <div className={`mb-7 ${isSubjectStep ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}`}>
          {step.options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className="w-full text-left transition-all duration-200"
                style={{
                  padding: isSubjectStep ? "14px 16px" : "14px 16px",
                  borderRadius: "16px",
                  border: isSelected
                    ? "1.5px solid rgba(107,143,255,0.8)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isSelected
                    ? "rgba(69,97,232,0.18)"
                    : "rgba(255,255,255,0.04)",
                  boxShadow: isSelected ? "0 0 24px rgba(69,97,232,0.2), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div className={`flex ${isSubjectStep ? "flex-col" : "flex-row"} items-start gap-3`}>
                  {/* Icon */}
                  <div
                    className="shrink-0 flex items-center justify-center rounded-xl transition-all duration-200"
                    style={{
                      width: isSubjectStep ? "44px" : "36px",
                      height: isSubjectStep ? "44px" : "36px",
                      background: isSelected ? "rgba(107,143,255,0.2)" : "rgba(255,255,255,0.07)",
                      color: isSelected ? "#6B8FFF" : "rgba(255,255,255,0.5)",
                      padding: isSubjectStep ? "0" : undefined,
                    }}
                  >
                    {isSubjectStep
                      ? <SubjectIcon id={opt.value} size={28} />
                      : <OptionIcon value={opt.value} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="font-semibold text-sm leading-tight"
                      style={{ color: isSelected ? "#ffffff" : "rgba(255,255,255,0.85)" }}
                    >
                      {opt.label}
                    </div>
                    <div
                      className="text-xs mt-0.5 leading-snug"
                      style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)" }}
                    >
                      {opt.desc}
                    </div>
                  </div>

                  {!isSubjectStep && isSelected && (
                    <div
                      className="ml-auto shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)" }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-center mb-4" style={{ color: "#f87171" }}>{error}</p>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!selected || saving}
          className="btn-glow w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? t("saving") : isLast ? t("start") : t("next")}
        </button>
      </div>

      {/* Skip */}
      <button
        onClick={handleSkip}
        disabled={saving}
        className="relative z-10 mt-5 text-sm transition-colors disabled:opacity-50"
        style={{ color: "rgba(255,255,255,0.25)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
      >
        {saving ? t("wait") : t("skip")}
      </button>
    </main>
  );
}
