"use client";
import { useState } from "react";
import Logo from "@/components/Logo";

async function completeOnboarding(answers: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch("/api/onboarding/complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });
    return res.ok;
  } catch { return false; }
}

const STEPS = [
  {
    step: 1,
    title: "Как тебе удобнее учиться?",
    subtitle: "Подберём стиль подачи материала под тебя",
    field: "style",
    options: [
      { value: "storytelling", emoji: "📖", label: "Через истории", desc: "Живые рассказы, образы, детали эпохи" },
      { value: "facts", emoji: "📅", label: "Факты и хронология", desc: "Чёткие даты, события, причинно-следственные связи" },
      { value: "practice", emoji: "✍️", label: "Вопросы и задания", desc: "Учусь через практику и проверку знаний" },
    ],
  },
  {
    step: 2,
    title: "Какой у тебя уровень?",
    subtitle: "Ментор адаптирует сложность объяснений",
    field: "level",
    options: [
      { value: "school", emoji: "🎒", label: "Школьник", desc: "Готовлюсь к урокам, ОГЭ или ЕГЭ" },
      { value: "student", emoji: "🎓", label: "Студент", desc: "Учусь в вузе или колледже" },
      { value: "adult", emoji: "💼", label: "Взрослый", desc: "Изучаю историю для себя" },
      { value: "expert", emoji: "🔬", label: "Историк / профи", desc: "Глубокие знания, хочу детали" },
    ],
  },
  {
    step: 3,
    title: "Что хочешь получить?",
    subtitle: "Поможет нам расставить акценты",
    field: "goal",
    options: [
      { value: "exam", emoji: "📝", label: "Сдать ЕГЭ / ОГЭ", desc: "Нужна подготовка к экзамену" },
      { value: "general", emoji: "🌍", label: "Общее развитие", desc: "Хочу понимать историю страны и мира" },
      { value: "professional", emoji: "📊", label: "Работа / профессия", desc: "История нужна для карьеры" },
      { value: "curiosity", emoji: "✨", label: "Просто интересно", desc: "Люблю историю, хочу узнать больше" },
    ],
  },
  {
    step: 4,
    title: "С чего начнём?",
    subtitle: "Выбери первый предмет — сразу откроем чат",
    field: "first_subject",
    options: [
      { value: "russian-history", emoji: "📜", label: "История России", desc: "От Древней Руси до современности" },
      { value: "world-history", emoji: "🌍", label: "Всемирная история", desc: "Цивилизации, войны, революции" },
      { value: "mathematics", emoji: "📐", label: "Математика", desc: "Алгебра, геометрия, задачи" },
      { value: "physics", emoji: "⚡", label: "Физика", desc: "Механика, электричество, оптика" },
      { value: "english", emoji: "🇬🇧", label: "Английский язык", desc: "Грамматика, лексика, разговорный" },
      { value: "russian-language", emoji: "📝", label: "Русский язык", desc: "Орфография, пунктуация, ЕГЭ" },
    ],
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  function handleSelect(value: string) {
    setSelected(value);
  }

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
        setError("Не удалось сохранить. Попробуй ещё раз."); setSaving(false);
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
    else { setError("Не удалось пропустить. Попробуй ещё раз."); setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-10">
        <Logo size="md" />
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i <= currentStep ? "w-8 bg-brand-600" : "w-2 bg-[var(--border)]"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-8">
          {/* Step header */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
              Шаг {step.step} из {STEPS.length}
            </p>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-1">{step.title}</h1>
            <p className="text-[var(--text-secondary)] text-sm">{step.subtitle}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  selected === opt.value
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <div
                      className={`font-semibold text-sm ${
                        selected === opt.value
                          ? "text-brand-700 dark:text-brand-300"
                          : "text-[var(--text)]"
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-[var(--text-secondary)] text-xs mt-0.5">{opt.desc}</div>
                  </div>
                  {selected === opt.value && (
                    <div className="ml-auto mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center mb-4">{error}</p>}

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!selected || saving}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Сохраняем..." : isLast ? "Начать учиться →" : "Далее →"}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={handleSkip}
          disabled={saving}
          className="w-full mt-4 text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50"
        >
          {saving ? "Подождите..." : "Пропустить →"}
        </button>
      </div>
    </main>
  );
}
