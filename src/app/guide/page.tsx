import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Как учиться с Mentora | Гайд",
  description: "7 советов как получить максимум от AI-ментора. Режимы, стили, лайфхаки для школьников и студентов.",
};

const TIPS = [
  {
    n: "01",
    icon: "🤔",
    title: "Задавай любые вопросы",
    body: "Ментора не знает слова «глупый вопрос». Спрашивай всё, что не решаешься спросить вслух — именно для этого она здесь.",
    example: "«Почему вообще нужно знать эту тему?» — отличный стартовый вопрос.",
  },
  {
    n: "02",
    icon: "🔁",
    title: "Проси объяснить иначе",
    body: "Если не понял — не молчи. Напиши «объясни другими словам» или «приведи пример из жизни». Ментора перестроит ответ без оговорок.",
    example: "«Объясни квантовую физику как будто я школьник».",
  },
  {
    n: "03",
    icon: "📝",
    title: "Используй режим проверки",
    body: "Напиши «проверь меня» или «квиз» — Ментора задаст 5 вопросов и покажет, что ты знаешь, а что нет. Отлично для подготовки к егэ.",
    example: "«Сделай мне квиз по Смутному времени — 5 вопросов».",
  },
  {
    n: "04",
    icon: "🎯",
    title: "Настрой свой стиль общения",
    body: "При регистрации ты выбираешь стиль: «как учебник», «цифры и факты» или «через задания». Если хочешь поменять — напиши «расскажи как историю» или «дай чёткую схему».",
    example: "«Объясняй через тест с вариантами ответов».",
  },
  {
    n: "05",
    icon: "⚡",
    title: "Проси подвести итог",
    body: "В конце сессии напиши «что я сегодня узнал» или «итог». Ментора сделает сжатые тезисы, которые удобно повторить или выписать.",
    example: "«что я узнал за сессию?» — и ты получишь конспект в 3–5 точках.",
  },
  {
    n: "06",
    icon: "🔥",
    title: "Учись каждый день",
    body: "Стрик (цепочка дней подряд) виден в профиле. Даже 5 минут в день — дточечный вопрос или один факт — лучше, чем двухчасовой порыв раз в неделю.",
    example: "За 30 дней стрика — бедж «🔥 Pro на 1 месяц» (available soon).",
  },
  {
    n: "07",
    icon: "🌐",
    title: "Пробуй режим Кругозор",
    body: "Не знаешь, что узнать сегодня? Открой «Кругозор» и просто спроси Ментору о чём-нибудь — она поделится чем-то удивительным из любой области.",
    example: "«Удиви меня каким-нибудь фактом о космосе».",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)]" style={{ background: "var(--bg-nav)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size="sm" fontSize="1.44rem" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors">
              Начать бесплатно →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-semibold rounded-full mb-6 tracking-widest uppercase">
            Как учиться
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Гайд по <span className="text-brand-600 dark:text-brand-500 italic">Mentora</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            7 приёмов, которые помогут учиться эффективнее и запоминать больше
          </p>
        </div>

        {/* Tips */}
        <div className="space-y-6 mb-16">
          {TIPS.map((tip) => (
            <div key={tip.n} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-xl">
                  {tip.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-[var(--text-muted)]">{tip.n}</span>
                    <h2 className="font-bold text-lg text-[var(--text)]">{tip.title}</h2>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-3">{tip.body}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg text-sm text-[var(--text-muted)] italic">
                    Пример: {tip.example}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Free limit note */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 mb-10 text-sm">
          <div className="font-semibold text-amber-800 dark:text-amber-400 mb-1">Про лимит бесплатного тарифа</div>
          <p className="text-amber-700 dark:text-amber-500">
            Free: 15 сообщений за 8 часов. Счётчик сбрасывается автоматически — не нужно ждать полночи.{" "}
            <Link href="/pricing" className="underline hover:text-amber-900 dark:hover:text-amber-300">Узнать про Pro и Ultra →</Link>
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
            Начать учиться бесплатно →
          </Link>
          <p className="text-xs text-[var(--text-muted)] mt-3">Без карты. Без обязательств.</p>
        </div>
      </main>

      <footer className="py-8 border-t border-[var(--border)] mt-16">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Конфиденциальность</Link>
            <Link href="/pricing" className="hover:text-[var(--text)] transition-colors">Тарифы</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
