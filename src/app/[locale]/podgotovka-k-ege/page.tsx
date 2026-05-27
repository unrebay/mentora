import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ConditionalNav, ConditionalFooter } from "@/components/ConditionalShell";
import EgeWaitlistForm from "@/components/EgeWaitlistForm";
import { getLocale } from "next-intl/server";

export const dynamic = "force-static";

// SEO: piggyback страница под высокочастотный сезонный запрос
// «подготовка к егэ онлайн» (Wordstat: 13 934/мес РФ).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const url = isEn ? "https://mentora.su/en/podgotovka-k-ege" : "https://mentora.su/ru/podgotovka-k-ege";
  return {
    title: isEn
      ? "Russian SAT (ЕГЭ) prep — AI mentor free at Mentora"
      : "Подготовка к ЕГЭ онлайн — ИИ-ментор Mentora бесплатно",
    description: isEn
      ? "Prep for the Russian ЕГЭ/ОГЭ exams with an AI mentor — math, Russian, history, English, social studies and more. Free, no schedule, 24/7."
      : "Подготовка к ЕГЭ и ОГЭ онлайн с ИИ-ментором Mentora — математика, русский, история, английский, обществознание и др. Бесплатно, без расписания, 24/7.",
    keywords: isEn
      ? ["ЕГЭ prep online", "Russian SAT", "AI tutor exam prep", "Mentora"]
      : [
          "подготовка к ЕГЭ онлайн",
          "подготовка к ОГЭ онлайн",
          "ЕГЭ онлайн бесплатно",
          "ОГЭ онлайн бесплатно",
          "репетитор для подготовки к ЕГЭ",
          "ИИ репетитор ЕГЭ",
          "нейросеть для подготовки к ЕГЭ",
          "ЕГЭ 2026",
          "ОГЭ 2026",
          "Mentora",
        ],
    alternates: {
      canonical: url,
      languages: {
        ru: "https://mentora.su/ru/podgotovka-k-ege",
        en: "https://mentora.su/en/podgotovka-k-ege",
        "x-default": "https://mentora.su/ru/podgotovka-k-ege",
      },
    },
    openGraph: {
      title: isEn
        ? "ЕГЭ prep with AI mentor — Mentora"
        : "Подготовка к ЕГЭ онлайн с ИИ-ментором — Mentora",
      description: isEn
        ? "Free AI mentor across all main ЕГЭ subjects. Practice 24/7, no schedule, no card."
        : "Бесплатный ИИ-ментор по основным предметам ЕГЭ. Практика 24/7, без расписания и привязки карты.",
      url,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

const SUBJECTS_FOR_EGE = [
  { ru: "Математика",      en: "Mathematics",     url: "matematike" },
  { ru: "Русский язык",    en: "Russian Language",url: "russkomu-yazyku" },
  { ru: "История",         en: "History",         url: "istoriya-rossii" },
  { ru: "Обществознание",  en: "Social Studies",  url: "obschestvoznaniyu" },
  { ru: "Английский язык", en: "English",         url: "anglijskomu" },
  { ru: "Физика",          en: "Physics",         url: "fizike" },
  { ru: "Химия",           en: "Chemistry",       url: "himii" },
  { ru: "Биология",        en: "Biology",         url: "biologii" },
  { ru: "Информатика",     en: "Computer Sci.",   url: "informatike" },
  { ru: "Литература",      en: "Literature",      url: "literature" },
  { ru: "География",       en: "Geography",       url: "geografii" },
];

export default async function PodgotovkaKEgePage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  const t = isEn
    ? {
        backLink: "Back",
        h1Lead: "ЕГЭ prep online —",
        h1Accent: "free AI mentor",
        sub: "Practice across all ЕГЭ subjects with an AI mentor. 24/7, no tutor schedule, no card. Use the time you'd waste on commute to actually study.",
        ctaPrimary: "Start prep — free",
        ctaSecondary: "See pricing",
        howTitle: "How ЕГЭ prep with Mentora works",
        how1: "Ask any «dumb» question — Mentora doesn't judge.",
        how2: "Request a 5-question quiz on any topic — get instant feedback.",
        how3: "Replay a topic in 3 different formats: story, formal, by example.",
        how4: "Track progress across all subjects in a single dashboard.",
        subjectsTitle: "Subject prep pages",
        subjectsSub: "Each subject — its own AI-mentor page",
        finalCtaH: "ЕГЭ 2026 — at home. With an AI mentor.",
        finalCtaSub: "No card required. Free forever.",
        finalCtaBtn: "Start now →",
      }
    : {
        backLink: "Назад",
        h1Lead: "Подготовка к ЕГЭ онлайн —",
        h1Accent: "бесплатно, с ИИ-ментором",
        sub: "Готовься к ЕГЭ и ОГЭ по всем предметам с ИИ-ментором Mentora. 24/7, без расписания репетитора и привязки карты. Время на дорогу к репетитору — лучше потратить на учёбу.",
        ctaPrimary: "Начать подготовку",
        ctaSecondary: "Посмотреть тарифы",
        howTitle: "Как готовиться к ЕГЭ с Mentora",
        how1: "Задавай любые «глупые» вопросы — Mentora не осуждает.",
        how2: "Попроси квиз из 5 вопросов по любой теме — получи мгновенную обратную связь.",
        how3: "Перепрашивай тему в 3 разных форматах: как историю, формально, на примере.",
        how4: "Следи за прогрессом по всем предметам в одном дашборде.",
        subjectsTitle: "Страницы подготовки по предметам",
        subjectsSub: "Каждый предмет — отдельная страница с ИИ-ментором",
        finalCtaH: "ЕГЭ 2026 — дома. С ИИ-ментором.",
        finalCtaSub: "Без привязки карты. Бесплатно навсегда.",
        finalCtaBtn: "Начать сейчас →",
      };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <ConditionalNav />

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

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
        {/* Honest notice — ЕГЭ-режим не готов, но не теряем поисковый трафик: запись в wait-list. */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, rgba(255,180,0,0.12), rgba(255,140,0,0.06))",
            border: "1px solid rgba(255,180,0,0.35)",
            color: "#B47200",
          }}
        >
          <span style={{ fontSize: 14 }}>🎓</span>
          {isEn ? "ЕГЭ-mode launches autumn 2026" : "ЕГЭ-режим запускается осенью 2026"}
        </div>
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
          className="leading-relaxed mx-auto max-w-2xl mb-4"
          style={{ color: "var(--text-muted)", fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}
        >
          {t.sub}
        </p>
        <p
          className="leading-relaxed mx-auto max-w-xl mb-8 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {isEn
            ? "Full ЕГЭ-mode (timed practice, official problem bank, score predictor) opens with the new academic year. Get on the wait-list — we\u2019ll ping you on day 1."
            : "Полный ЕГЭ-режим (тренажёр по ФИПИ, прогноз балла, тайминг) запускаем к новому учебному году. Запишись — напишем в день старта."}
        </p>

        {/* Wait-list capture — preserves SEO traffic instead of losing it to a fake CTA */}
        <EgeWaitlistForm locale={locale} />

        {/* Secondary: try the general AI-mentor now */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              color: "var(--text)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            {isEn ? "Try the general AI-mentor for free →" : "Пока — попробуй обычный ИИ-ментор бесплатно →"}
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight" style={{ color: "var(--text)" }}>
          {t.howTitle}
        </h2>
        <div className="space-y-3">
          {[t.how1, t.how2, t.how3, t.how4].map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-2xl p-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderLeft: "2.5px solid #4561E8",
              }}
            >
              <div
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{
                  background: "rgba(69,97,232,0.12)",
                  color: "#4561E8",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subject grid ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight" style={{ color: "var(--text)" }}>
            {t.subjectsTitle}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t.subjectsSub}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SUBJECTS_FOR_EGE.map((s) => (
            <Link
              key={s.url}
              href={`/repetitor/${s.url}`}
              className="rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                color: "var(--text)",
              }}
            >
              <span style={{ color: "#4561E8" }}>→</span>{" "}
              {isEn ? s.en : s.ru}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 px-6 text-center"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "220px",
            background: "linear-gradient(180deg, rgba(69,97,232,0.05) 0%, rgba(69,97,232,0.02) 50%, transparent 100%)",
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ color: "var(--text)" }}>
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
