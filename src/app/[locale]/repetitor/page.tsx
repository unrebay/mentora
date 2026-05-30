import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ConditionalNav, ConditionalFooter } from "@/components/ConditionalShell";
import { getLocale } from "next-intl/server";
import { SUBJECT_LANDINGS } from "@/lib/repetitor-subjects";

export const dynamic = "force-static";

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
        h1Accent: "or an AI mentor?",
        sub: "Mentora answers 24/7 across 17 sciences. No schedule, no card. Try it before booking a tutor for $30/hour.",
        ctaPrimary: "Try Mentora free",
        ctaSecondary: "See pricing",
        comparisonTitle: "Tutor vs Mentora AI mentor",
        comparisonSub: "Side-by-side, no marketing fluff",
        examplesTitle: "Three real conversations",
        examplesSub: "Mentora doesn't lecture. It explains the way that works for you.",
        ex1Title: "«English — chat with a native speaker»",
        ex1User: "Hi! Can you talk to me only in English today? I want to practice my speaking.",
        ex1Bot: "Sure thing — let's go English-only today. What did you do this weekend? Tell me in 3-4 sentences and I'll help you sound more natural.",
        ex2Title: "«Explain recursion with code»",
        ex2User: "Explain recursion using factorial.",
        ex2Bot: "Sure. Here's Python:\n\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n```\n\nThe function calls itself until n=1 (the «base case»). Want to trace it by hand for n=4?",
        ex3Title: "«Tell me a story about Napoleon»",
        ex3User: "Tell me about Napoleon like a story, not a textbook.",
        ex3Bot: "1769, Corsica. A short kid with a sharp eye for maps is born to a struggling lawyer. Twenty years later he commands an army. Thirty — he rewrites European law. Want me to focus on his rise, his fall, or both?",
        finalCtaH: "Stop scheduling. Start learning.",
        finalCtaSub: "Free forever — 10 messages every 8 hours. No card.",
        finalCtaBtn: "Try Mentora",
      }
    : {
        backLink: "Назад",
        h1Lead: "Репетитор онлайн —",
        h1Accent: "или ИИ-ментор?",
        sub: "Mentora отвечает 24/7 по 17 наукам, без расписания и привязки карты. Попробуй до того как платить 2000 ₽/час репетитору.",
        ctaPrimary: "Попробовать бесплатно",
        ctaSecondary: "Посмотреть тарифы",
        comparisonTitle: "Репетитор vs ИИ-ментор Mentora",
        comparisonSub: "Без маркетинговых сказок — как есть",
        examplesTitle: "Три реальных диалога",
        examplesSub: "Mentora не читает лекций — объясняет так, как тебе понятно.",
        ex1Title: "«Английский — разговор как с носителем»",
        ex1User: "Hi! Can you talk to me only in English today? Я хочу прокачать speaking.",
        ex1Bot: "Sure thing! Let's chat in English only today. What did you do this weekend? Tell me in 3-4 sentences and I'll help you sound more natural.",
        ex2Title: "«Объясни рекурсию через код»",
        ex2User: "Объясни рекурсию через факториал.",
        ex2Bot: "Окей. Вот пример на Python:\n\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n```\n\nФункция вызывает саму себя пока не дойдёт до n=1 (это «база рекурсии»). Прогоним вручную для n=4?",
        ex3Title: "«Расскажи про Наполеона как историю»",
        ex3User: "Расскажи про Наполеона как историю, не учебником.",
        ex3Bot: "1769 год, Корсика. У небогатого юриста рождается невысокий мальчик с острым взглядом на карты. Через двадцать лет он командует армией. Через тридцать — переписывает законы Европы. Сосредоточиться на восхождении, падении или всём целиком?",
        finalCtaH: "Хватит расписаний. Начни учиться.",
        finalCtaSub: "Бесплатно навсегда — 10 сообщений каждые 8 часов. Без карты.",
        finalCtaBtn: "Попробовать Mentora",
      };

  const rows: Row[] = isEn
    ? [
        { criterion: "Price",          tutor: "From $30/hour",       mentora: "Free forever\n(Pro from $5/mo)",   mentoraWin: true },
        { criterion: "Availability",   tutor: "1-2 lessons / week",  mentora: "24/7, instant reply",              mentoraWin: true },
        { criterion: "Subjects",       tutor: "One per tutor",       mentora: "17 in one chat",                    mentoraWin: true },
        { criterion: "Age",            tutor: "Mostly students",     mentora: "Any age, kids to adults",           mentoraWin: true },
        { criterion: "Personalization",tutor: "Slow, weeks to settle", mentora: "Adapts every message",            mentoraWin: true },
        { criterion: "Emotional contact", tutor: "Real human",       mentora: "Patient AI, no judgment",            mentoraWin: true  },
        { criterion: "Hands-on practice", tutor: "Real-time feedback", mentora: "Quizzes, photo problems (Ultra)",   mentoraWin: true  },
      ]
    : [
        { criterion: "Цена",            tutor: "От 2000 ₽/час",       mentora: "Бесплатно навсегда\n(Pro от 499 ₽/мес)", mentoraWin: true },
        { criterion: "Доступность",     tutor: "1-2 урока/неделя",    mentora: "24/7, ответ мгновенно",              mentoraWin: true },
        { criterion: "Предметы",        tutor: "Один на репетитора",  mentora: "17 в одном чате",                     mentoraWin: true },
        { criterion: "Возраст",         tutor: "В основном школьники",mentora: "Любой возраст — от детей до взрослых",mentoraWin: true },
        { criterion: "Персонализация",  tutor: "Медленная, недели на адаптацию", mentora: "Адаптируется с каждым сообщением", mentoraWin: true },
        { criterion: "Эмоциональный контакт", tutor: "Живой человек",  mentora: "Терпеливый ИИ без осуждения",          mentoraWin: true  },
        { criterion: "Практика руками", tutor: "Реал-тайм обратная связь", mentora: "Квизы, фото задач (Ultra)",        mentoraWin: true  },
      ];

  const baseUrl = isEn ? "https://mentora.su/en" : "https://mentora.su";
  const repetitorUrl = `${baseUrl}/repetitor`;
  // JSON-LD: CollectionPage + BreadcrumbList + ItemList со всеми 17 subjects
  // даёт SERP-карточку и rich-snippet ссылок на конкретные предметы.
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isEn ? "Home" : "Главная", item: baseUrl },
          { "@type": "ListItem", position: 2, name: isEn ? "Tutors" : "Репетиторы", item: repetitorUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: isEn ? "AI tutors at Mentora — 17 subjects" : "ИИ-репетиторы Mentora — 17 предметов",
        description: isEn
          ? "Free AI tutor instead of a traditional tutor: 17 school and university subjects, 24/7, no schedule."
          : "Бесплатный ИИ-репетитор вместо обычного: 17 школьных и университетских предметов, 24/7, без расписания.",
        url: repetitorUrl,
        inLanguage: isEn ? "en" : "ru-RU",
      },
      {
        "@type": "ItemList",
        name: isEn ? "Subjects with AI tutor" : "Предметы с ИИ-репетитором",
        itemListElement: SUBJECT_LANDINGS.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: isEn ? s.en.title : s.ru.title,
          url: `${baseUrl}/repetitor/${s.url}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <ConditionalNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

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
          style={{ color: "var(--text)", fontSize: "clamp(1.7rem, 4.2vw, 2.8rem)", letterSpacing: "-0.02em" }}
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
                style={{ color: r.mentoraWin ? "#4561E8" : "var(--text-secondary)", whiteSpace: "pre-line" }}
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

              {/* Bot bubble — supports ```code blocks``` */}
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-tl-md px-4 py-2.5 text-sm max-w-[85%] leading-relaxed"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {ex.bot.split("```").map((chunk, i) => {
                    const isCode = i % 2 === 1;
                    if (isCode) {
                      const firstNl = chunk.indexOf("\n");
                      const code = firstNl >= 0 ? chunk.slice(firstNl + 1) : chunk;
                      return (
                        <pre key={i} className="my-2 rounded-lg overflow-x-auto" style={{
                          background: "rgba(0,0,0,0.06)",
                          border: "1px solid var(--border-light)",
                          padding: "10px 12px",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: "12.5px",
                          lineHeight: 1.5,
                          color: "var(--text)",
                        }}><code>{code.trim()}</code></pre>
                      );
                    }
                    return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{chunk}</span>;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Все предметы (внутренняя перелинковка SEO) ─────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-center" style={{ color: "var(--text)" }}>
          {isEn ? "Tutor for every subject" : "Репетитор по каждому предмету"}
        </h2>
        <p className="text-center text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          {isEn ? "17 sciences — pick yours and try free" : "17 наук — выбери свою и попробуй бесплатно"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUBJECT_LANDINGS.map((s) => (
            <Link
              key={s.url}
              prefetch={false}
              href={`/repetitor/${s.url}`}
              className="px-4 py-3 rounded-xl border text-sm font-medium transition-colors hover:border-[var(--brand)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              {isEn ? s.en.title : s.ru.title}
            </Link>
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

      <ConditionalFooter />
    </div>
  );
}
