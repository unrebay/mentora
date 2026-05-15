import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import LandingNav from "@/components/LandingNav";
import { PublicFooter } from "@/components/SiteFooter";
import { getLocale } from "next-intl/server";

// SEO: piggyback страница под высокочастотный запрос «репетитор онлайн»
// (Wordstat: 48 489/мес РФ + CIS). Конвертирует трафик в AI-ментора.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const url = isEn ? "https://mentora.su/en/repetitor" : "https://mentora.su/ru/repetitor";
  return {
    title: isEn
      ? "AI tutor online — try free at Mentora"
      : "Репетитор онлайн? Попробуй ИИ-ментора бесплатно — Mentora",
    description: isEn
      ? "Online tutor — but smarter and free. Mentora answers 24/7 across 17 sciences. No schedule, no card. Try it before paying $30/hour for a tutor."
      : "Репетитор онлайн — но умнее и бесплатно. Mentora отвечает 24/7 по 17 наукам без расписания и привязки карты. Попробуй до того как платить 2000 ₽/час.",
    keywords: isEn
      ? ["AI tutor online", "online tutor", "free tutor", "neural network for learning", "Mentora"]
      : ["репетитор онлайн", "репетитор онлайн бесплатно", "ИИ репетитор", "нейросеть для учёбы", "репетитор по математике онлайн", "репетитор английского онлайн", "репетитор без расписания", "Mentora"],
    alternates: {
      canonical: url,
      languages: {
        ru: "https://mentora.su/ru/repetitor",
        en: "https://mentora.su/en/repetitor",
        "x-default": "https://mentora.su/ru/repetitor",
      },
    },
    openGraph: {
      title: isEn ? "AI tutor online — Mentora" : "Репетитор онлайн — попробуй ИИ-ментора Mentora",
      description: isEn
        ? "Online tutor, but smarter and free. 17 sciences, 24/7, no card required."
        : "Репетитор онлайн, но умнее и бесплатно. 17 наук, 24/7, без карты.",
      url,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

type Row = { criterion: string; tutor: string; mentora: string; mentoraWin: boolean };

export default async function RepetitorPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  const t = isEn
    ? {
        backLink: "Back",
        h1Lead: "Online tutor —",
        h1Accent: "or AI mentor that's free?",
        sub: "Mentora answers 24/7 across 17 sciences. No schedule, no card. Try it before booking a tutor for $30/hour.",
        ctaPrimary: "Try Mentora free",
        ctaSecondary: "See pricing",
        comparisonTitle: "Tutor vs Mentora AI mentor",
        comparisonSub: "Side-by-side, no marketing fluff",
        examplesTitle: "Three real conversations",
        examplesSub: "Mentora doesn't lecture. It explains the way that works for you.",
        ex1Title: "«Explain quadratic equations like I'm 12»",
        ex1User: "I don't get quadratic equations. Explain like I'm 12.",
        ex1Bot: "OK. Imagine you have a square garden and you want to find its side. If its area is 49, what's the side? Right — 7. That's the simplest «quadratic equation»: x² = 49. The full version (ax² + bx + c = 0) just adds two more knobs…",
        ex2Title: "«Help me prep for the SAT-equivalent exam»",
        ex2User: "I'm stuck on derivatives. Can you make a 5-question quiz?",
        ex2Bot: "Sure. Question 1: Find f'(x) for f(x) = 3x² - 5x + 2. Answer when you're ready, I'll check and explain any miss.",
        ex3Title: "«Tell me a story about Napoleon»",
        ex3User: "Tell me about Napoleon like a story, not a textbook.",
        ex3Bot: "1769, Corsica. A short kid with a sharp eye for maps is born to a struggling lawyer. Twenty years later he commands an army. Thirty — he rewrites European law. Want me to focus on his rise, his fall, or both?",
        finalCtaH: "Stop scheduling lessons. Start learning.",
        finalCtaSub: "Free forever — 10 messages every 8 hours. No card.",
        finalCtaBtn: "Try Mentora now →",
      }
    : {
        backLink: "Назад",
        h1Lead: "Репетитор онлайн —",
        h1Accent: "или ИИ-ментор, который бесплатно?",
        sub: "Mentora отвечает 24/7 по 17 наукам, без расписания и привязки карты. Попробуй до того как платить 2000 ₽/час репетитору.",
        ctaPrimary: "Попробовать бесплатно",
        ctaSecondary: "Посмотреть тарифы",
        comparisonTitle: "Репетитор vs ИИ-ментор Mentora",
        comparisonSub: "Без маркетинговых сказок — как есть",
        examplesTitle: "Три реальных диалога",
        examplesSub: "Mentora не читает лекций — объясняет так, как тебе понятно.",
        ex1Title: "«Объясни квадратное уравнение как 12-летнему»",
        ex1User: "Не понимаю квадратные уравнения. Объясни как 12-летнему.",
        ex1Bot: "Окей. Представь квадратный участок, надо найти сторону. Площадь = 49. Какая сторона? Правильно — 7. Это и есть простейшее квадратное уравнение: x² = 49. Полная версия (ax² + bx + c = 0) — это просто две дополнительные «крутилки»…",
        ex2Title: "«Помоги подготовиться к ЕГЭ»",
        ex2User: "Застрял на производных. Сделай мне квиз из 5 вопросов.",
        ex2Bot: "Окей. Вопрос 1: найди f'(x), если f(x) = 3x² - 5x + 2. Ответь — проверю и разберу любую ошибку.",
        ex3Title: "«Расскажи про Наполеона как историю»",
        ex3User: "Расскажи про Наполеона как историю, не учебником.",
        ex3Bot: "1769 год, Корсика. У небогатого юриста рождается невысокий мальчик с острым взглядом на карты. Через двадцать лет он командует армией. Через тридцать — переписывает законы Европы. Сосредоточиться на восхождении, падении или всём целиком?",
        finalCtaH: "Хватит подстраиваться под расписание репетитора. Начни учиться.",
        finalCtaSub: "Бесплатно навсегда — 10 сообщений каждые 8 часов. Без карты.",
        finalCtaBtn: "Попробовать Mentora →",
      };

  const rows: Row[] = isEn
    ? [
        { criterion: "Price",          tutor: "From $30/hour",       mentora: "Free forever (Pro from $5/mo)",   mentoraWin: true },
        { criterion: "Availability",   tutor: "1-2 lessons / week",  mentora: "24/7, instant reply",              mentoraWin: true },
        { criterion: "Subjects",       tutor: "One per tutor",       mentora: "17 in one chat",                    mentoraWin: true },
        { criterion: "Age",            tutor: "Mostly students",     mentora: "Any age, kids to adults",           mentoraWin: true },
        { criterion: "Personalization",tutor: "Slow, weeks to settle", mentora: "Adapts every message",            mentoraWin: true },
        { criterion: "Emotional contact", tutor: "Real human",       mentora: "Patient AI, no judgment",            mentoraWin: false },
        { criterion: "Hands-on practice", tutor: "Real-time feedback", mentora: "Quizzes, photo problems (Ultra)",   mentoraWin: false },
      ]
    : [
        { criterion: "Цена",            tutor: "От 2000 ₽/час",       mentora: "Бесплатно навсегда (Pro от 499 ₽/мес)", mentoraWin: true },
        { criterion: "Доступность",     tutor: "1-2 урока/неделя",    mentora: "24/7, ответ мгновенно",              mentoraWin: true },
        { criterion: "Предметы",        tutor: "Один на репетитора",  mentora: "17 в одном чате",                     mentoraWin: true },
        { criterion: "Возраст",         tutor: "В основном школьники",mentora: "Любой возраст — от детей до взрослых",mentoraWin: true },
        { criterion: "Персонализация",  tutor: "Медленная, недели на адаптацию", mentora: "Адаптируется с каждым сообщением", mentoraWin: true },
        { criterion: "Эмоциональный контакт", tutor: "Живой человек",  mentora: "Терпеливый ИИ без осуждения",          mentoraWin: false },
        { criterion: "Практика руками", tutor: "Реал-тайм обратная связь", mentora: "Квизы, фото задач (Ultra)",        mentoraWin: false },
      ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <LandingNav alwaysLight />

      {/* Кнопка «Назад» */}
      <div className="max-w-4xl mx-auto px-6 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium rounded-full px-3.5 py-1.5 transition-colors"
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t.backLink}
        </Link>
      </div>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
        <h1
          className="font-bold leading-[1.05] tracking-tight mb-6"
          style={{ color: "var(--text)", fontSize: "clamp(2rem, 5.2vw, 3.6rem)" }}
        >
          <span>{t.h1Lead}</span>
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {t.h1Accent}
          </span>
        </h1>
        <p
          className="leading-relaxed mx-auto max-w-2xl mb-8"
          style={{ color: "var(--text-muted)", fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}
        >
          {t.sub}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
              boxShadow: "0 8px 28px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.25) inset",
            }}
          >
            {t.ctaPrimary}
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold transition-colors"
            style={{
              color: "var(--text)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            {t.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* ─── Comparison Table ────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight" style={{ color: "var(--text)" }}>
            {t.comparisonTitle}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.comparisonSub}
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid var(--border-light)",
            background: "var(--bg-card)",
          }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-3 px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest"
            style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)" }}
          >
            <div>{isEn ? "Criterion" : "Критерий"}</div>
            <div className="text-center">{isEn ? "Live tutor" : "Репетитор"}</div>
            <div className="text-center" style={{ color: "#4561E8" }}>
              Mentora
            </div>
          </div>

          {/* Rows */}
          {rows.map((r, i) => (
            <div
              key={r.criterion}
              className="grid grid-cols-3 px-4 sm:px-6 py-4 text-[13px] sm:text-sm items-center"
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid var(--border-light)" : "none",
                background: i % 2 === 0 ? "transparent" : "var(--bg-secondary)",
              }}
            >
              <div className="font-semibold pr-2" style={{ color: "var(--text)" }}>
                {r.criterion}
              </div>
              <div className="text-center pr-2" style={{ color: "var(--text-secondary)" }}>
                {r.tutor}
              </div>
              <div
                className="text-center font-semibold"
                style={{ color: r.mentoraWin ? "#4561E8" : "var(--text-secondary)" }}
              >
                {r.mentora}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Examples ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight" style={{ color: "var(--text)" }}>
            {t.examplesTitle}
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            {t.examplesSub}
          </p>
        </div>

        <div className="space-y-5">
          {[
            { title: t.ex1Title, user: t.ex1User, bot: t.ex1Bot, accent: "#4561E8" },
            { title: t.ex2Title, user: t.ex2User, bot: t.ex2Bot, accent: "#7C3AED" },
            { title: t.ex3Title, user: t.ex3User, bot: t.ex3Bot, accent: "#10B981" },
          ].map((ex) => (
            <div
              key={ex.title}
              className="rounded-2xl p-5 sm:p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderLeft: `2.5px solid ${ex.accent}`,
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: ex.accent }}
              >
                {ex.title}
              </div>

              {/* User bubble */}
              <div className="flex justify-end mb-3">
                <div
                  className="rounded-2xl rounded-tr-md px-4 py-2.5 text-sm max-w-[85%]"
                  style={{
                    background: `${ex.accent}1F`,
                    color: "var(--text)",
                  }}
                >
                  {ex.user}
                </div>
              </div>

              {/* Bot bubble */}
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-tl-md px-4 py-2.5 text-sm max-w-[85%] leading-relaxed"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {ex.bot}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 px-6 text-center"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "220px",
            background:
              "linear-gradient(180deg, rgba(69,97,232,0.05) 0%, rgba(69,97,232,0.02) 50%, transparent 100%)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(69,97,232,0.20) 35%, rgba(69,97,232,0.30) 50%, rgba(69,97,232,0.20) 65%, transparent 100%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
            style={{ color: "var(--text)" }}
          >
            {t.finalCtaH}
          </h2>
          <p className="mb-8 max-w-md mx-auto text-sm" style={{ color: "var(--text-muted)" }}>
            {t.finalCtaSub}
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
              boxShadow:
                "0 8px 28px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(255,255,255,0.08) inset",
            }}
          >
            {t.finalCtaBtn}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
