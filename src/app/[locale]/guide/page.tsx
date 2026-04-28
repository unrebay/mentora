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
    title: "Задавай любые вопросы",
    body: "Ментора не знает слова «глупый вопрос». Спрашивай всё, что не решаешься спросить вслух — именно для этого она здесь.",
    example: "«Почему вообще нужно знать эту тему?» — отличный стартовый вопрос.",
    accent: "#4561E8",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Проси объяснить иначе",
    body: "Если не понял — не молчи. Напиши «объясни другими словами» или «приведи пример из жизни». Ментора перестроит ответ без оговорок.",
    example: "«Объясни квантовую физику как будто я школьник».",
    accent: "#7C3AED",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M1 4v6h6M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Используй режим проверки",
    body: "Напиши «проверь меня» или «квиз» — Ментора задаст 5 вопросов и покажет, что ты знаешь, а что нет. Отлично для подготовки к ЕГЭ.",
    example: "«Сделай мне квиз по Смутному времени — 5 вопросов».",
    accent: "#0EA5E9",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Настрой свой стиль общения",
    body: "При регистрации ты выбираешь стиль: «как учебник», «цифры и факты» или «через задания». Если хочешь поменять — напиши «расскажи как историю» или «дай чёткую схему».",
    example: "«Объясняй через тест с вариантами ответов».",
    accent: "#10B981",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    n: "05",
    title: "Проси подвести итог",
    body: "В конце сессии напиши «что я сегодня узнал» или «итог». Ментора сделает сжатые тезисы, которые удобно повторить или выписать.",
    example: "«что я узнал за сессию?» — и ты получишь конспект в 3–5 точках.",
    accent: "#F59E0B",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    n: "06",
    title: "Учись каждый день",
    body: "Стрик (цепочка дней подряд) виден в профиле. Даже 5 минут в день — точечный вопрос или один факт — лучше, чем двухчасовой порыв раз в неделю.",
    example: "За 7 дней стрика — 3 дня Pro бесплатно.",
    accent: "#FF7A00",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"
          fill="#FF7A00" />
        <path d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z" fill="rgba(255,200,80,0.9)" />
      </svg>
    ),
  },
  {
    n: "07",
    title: "Пробуй режим Кругозор",
    body: "Не знаешь, что узнать сегодня? Просто спроси Ментору о чём-нибудь — она поделится чем-то удивительным из любой области.",
    example: "«Удиви меня каким-нибудь фактом о космосе».",
    accent: "#9F7AFF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
      </svg>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: "var(--bg-nav)", borderColor: "var(--border-light)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/"><Logo size="sm" fontSize="1.44rem" /></Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth" className="btn-glow px-4 py-2 text-sm font-semibold rounded-xl text-white">
              Начать бесплатно →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
            style={{
              background: "rgba(69,97,232,0.08)",
              color: "var(--brand)",
              border: "1px solid rgba(69,97,232,0.18)",
            }}>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            Как учиться
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--text)" }}>
            Гайд по{" "}
            <span style={{ fontStyle: "italic", fontFamily: "var(--font-playfair), Georgia, serif" }}>
              M<span style={{ color: "#4561E8", fontStyle: "italic", marginRight: "0.02em" }}>e</span>ntora
            </span>
          </h1>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            7 приёмов, которые помогут учиться эффективнее и запоминать больше
          </p>
        </div>

        {/* ── Tips ─────────────────────────────────────────── */}
        <div className="space-y-4 mb-16">
          {TIPS.map((tip) => (
            <div key={tip.n}
              className="relative rounded-2xl border overflow-hidden transition-all duration-200 group"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ background: `linear-gradient(180deg, ${tip.accent}, ${tip.accent}55)` }} />

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 0% 50%, ${tip.accent}08 0%, transparent 50%)` }} />

              <div className="flex items-start gap-5 p-6 md:p-7 pl-7 md:pl-8 relative z-10">
                {/* Icon badge */}
                <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ background: `${tip.accent}15`, color: tip.accent }}>
                  {tip.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: tip.accent }}>{tip.n}</span>
                    <h2 className="font-bold text-[17px] leading-snug" style={{ color: "var(--text)" }}>{tip.title}</h2>
                  </div>
                  <p className="leading-relaxed mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>{tip.body}</p>
                  <div className="inline-flex items-start gap-2 px-3 py-2 rounded-xl text-sm italic"
                    style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", borderLeft: `2px solid ${tip.accent}40` }}>
                    <span className="shrink-0 font-semibold not-italic text-xs" style={{ color: tip.accent }}>→</span>
                    {tip.example}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Limit note ───────────────────────────────────── */}
        <div className="rounded-2xl p-6 mb-10 border"
          style={{
            background: "rgba(245,158,11,0.06)",
            borderColor: "rgba(245,158,11,0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(245,158,11,0.12)" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1" style={{ color: "#d97706" }}>Про лимит бесплатного тарифа</div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Free: 20 сообщений в скользящем окне 24 часа — без карты навсегда.{" "}
                <Link href="/pricing" className="font-semibold hover:underline" style={{ color: "#f59e0b" }}>
                  Узнать про Pro и Ultra →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────── */}
        <div className="text-center">
          <Link href="/auth" className="btn-glow inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl text-white text-base">
            Начать учиться бесплатно →
          </Link>
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>Без карты. Без обязательств.</p>
        </div>
      </main>

      {/* ── Footer CTA dark ──────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6 text-center mt-10"
        style={{ background: "#04060f" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-40 pointer-events-none rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(69,97,232,0.18) 0%, transparent 70%)", top: "-20px" }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Попробуй прямо сейчас
          </h2>
          <p className="mb-8 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
            13 предметов. Без VPN. Без карты.
          </p>
          <Link href="/auth" className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white">
            Начать бесплатно →
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
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
