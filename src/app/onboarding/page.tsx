"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

const STEPS = [
  {
    step: 1,
    title: "Как тебе удобнее учиться?",
    subtitle: "Подберём стиль подачи материала под тебя",
    field: "onboarding_style",
    options: [
      {
        value: "storytelling",
        emoji: "📖",
        label: "Через истории",
        desc: "Живые рассказы, образы, детали эпохи",
      },
      {
        value: "facts",
        emoji: "📅",
        label: "Факты и хронология",
        desc: "Чёткие даты, события, причинно-следственные связи",
      },
      {
        value: "practice",
        emoji: "✍️",
        label: "Вопросы и задания",
        desc: "Учусь через практику и проверку знаний",
      },
    ],
  },
  {
    step: 2,
    title: "Какой у тебя уровень?",
    subtitle: "Ментор адаптирует сложность объяснений",
    field: "onboarding_level",
    options: [
      {
        value: "school",
        emoji: "🎒",
        label: "Школьник",
        desc: "Готовлюсь к урокам, ОГЭ или ЕГЭ",
      },
      {
        value: "student",
        emoji: "🎓",
        label: "Студент",
        desc: "Учусь в вузе или колледже",
      },
      {
        value: "adult",
        emoji: "💼",
        label: "Взрослый",
        desc: "Изучаю историю для себя",
      },
      {
        value: "expert",
        emoji: "🔬",
        label: "Историк / профи",
        desc: "Глубокие знания, хочу детали",
      },
    ],
  },
  {
    step: 3,
    title: "Что хочешь получить?",
    subtitle: "Поможет нам расставить акценты",
    field: "onboarding_goal",
    options: [
      {
        value: "exam",
        emoji: "📝",
        label: "Сдать ЕГЭ / ОГЭ",
        desc: "Нужна подготовка к экзамену",
      },
      {
        value: "general",
        emoji: "🌍",
        label: "Общее развитие",
        desc: "Хочу понимать историю страны и мира",
      },
      {
        value: "professional",
        emoji: "📊",
        label: "Работа / профессия",
        desc: "История нужна для карьеры",
      },
      {
        value: "curiosity",
        emoji: "✨",
        label: "Просто интересно",
        desc: "Люблю историю, хочу узнать больше",
      },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  function handleSelect(value: string) {
    setSelected(value);
  }

  async function handleNext() {
    if (!selected) return;

    const newAnswers = { ...answers, [step.field]: selected };
    setAnswers(newAnswers);

    if (isLast) {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({
            onboarding_style: newAnswers.onboarding_style,
            onboarding_level: newAnswers.onboarding_level,
            onboarding_goal: newAnswers.onboarding_goal,
            onboarding_completed: true,
          })
          .eq("id", user.id);
      }
      // Send welcome email (fire-and-forget, don't block redirect)
      fetch("/api/email/welcome", { method: "POST" }).catch(() => {});

      // Redirect directly to chat — full navigation to avoid stale server cache
      window.location.href = "/dashboard";
    } else {
      setCurrentStep((s) => s + 1);
      setSelected(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
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
              i < currentStep
                ? "w-8 bg-brand-600"
                : i === currentStep
                ? "w-8 bg-brand-600"
                : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step header */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
              Шаг {step.step} из {STEPS.length}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {step.title}
            </h1>
            <p className="text-gray-500 text-sm">{step.subtitle}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  selected === opt.value
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <div
                      className={`font-semibold text-sm ${
                        selected === opt.value
                          ? "text-brand-700"
                          : "text-gray-800"
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {opt.desc}
                    </div>
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

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!selected || saving}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? "Сохраняем..."
              : isLast
              ? "Начать учиться →"
              : "Далее →"}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from("users")
                .update({ onboarding_completed: true })
                .eq("id", user.id);
            }
            window.location.href = "/dashboard";
          }}
          className="w-full mt-4 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Пропустить
        </button>
      </div>
    </main>
  );
}
