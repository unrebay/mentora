import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ConditionalNav, ConditionalFooter } from "@/components/ConditionalShell";
import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { findSubject, SUBJECT_LANDINGS } from "@/lib/repetitor-subjects";

type Props = { params: Promise<{ locale: string; subject: string }> };

// SSR on each request — generateStaticParams in nested dynamic routes was crashing prod
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, subject } = await params;
  const s = findSubject(subject);
  if (!s) return {};
  const isEn = locale === "en";
  const data = isEn ? s.en : s.ru;
  const url = isEn
    ? `https://mentora.su/en/repetitor/${s.url}`
    : `https://mentora.su/ru/repetitor/${s.url}`;
  return {
    title: isEn
      ? `${data.title} tutor — try AI mentor free at Mentora`
      : `Репетитор по ${data.title.toLowerCase()} — попробуй ИИ-ментора бесплатно`,
    description: isEn
      ? `Try an AI mentor instead of a $30/hour tutor in ${data.title}. ${data.topics}. 24/7, free, no card.`
      : `Попробуй ИИ-ментора Mentora вместо репетитора за 2000 ₽/час по ${data.title.toLowerCase()}. ${data.topics}. 24/7, бесплатно, без карты.`,
    keywords: [
      data.kw,
      isEn ? `learn ${data.title.toLowerCase()} online` : `учить ${data.title.toLowerCase()} онлайн`,
      isEn ? `${data.title.toLowerCase()} free online` : `${data.title.toLowerCase()} онлайн бесплатно`,
      isEn ? "AI tutor" : "ИИ репетитор",
      isEn ? "neural network for learning" : "нейросеть для учёбы",
      "Mentora",
    ],
    alternates: {
      canonical: url,
      languages: {
        ru: `https://mentora.su/ru/repetitor/${s.url}`,
        en: `https://mentora.su/en/repetitor/${s.url}`,
        "x-default": `https://mentora.su/ru/repetitor/${s.url}`,
      },
    },
    openGraph: {
      title: isEn
        ? `${data.title} tutor — Mentora AI mentor`
        : `Репетитор по ${data.title.toLowerCase()} — ИИ-ментор Mentora`,
      description: isEn
        ? `${data.title} with an AI mentor: ${data.topics}. Free, 24/7, no card.`
        : `${data.title} с ИИ-ментором: ${data.topics}. Бесплатно, 24/7, без карты.`,
      url,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function SubjectRepetitorPage({ params }: Props) {
  const { subject } = await params;
  const s = findSubject(subject);
  if (!s) notFound();

  const locale = await getLocale();
  const isEn = locale === "en";
  const d = isEn ? s.en : s.ru;

  const t = isEn
    ? {
        backLink: "Back",
        h1Lead: `${d.title} tutor —`,
        h1Accent: "or AI mentor that's free?",
        sub: `Try Mentora before paying $30/hour for a ${d.title.toLowerCase()} tutor. ${d.topics}. Available 24/7, no schedule, no card.`,
        ctaPrimary: "Try Mentora free",
        ctaSecondary: "See pricing",
        exTitle: `${d.title} — a real conversation`,
        finalCtaH: `Stop scheduling ${d.title.toLowerCase()} lessons. Start learning.`,
        finalCtaSub: "Free forever — 10 messages every 8 hours. No card.",
        finalCtaBtn: "Try Mentora now →",
        breadcrumbHome: "Home",
        breadcrumbRepetitor: "Tutors",
      }
    : {
        backLink: "Назад",
        h1Lead: `Репетитор по ${d.title.toLowerCase()} —`,
        h1Accent: "или ИИ-ментор, который бесплатно?",
        sub: `Попробуй Mentora до того как платить 2000 ₽/час репетитору по ${d.title.toLowerCase()}. ${d.topics}. 24/7, без расписания и привязки карты.`,
        ctaPrimary: "Попробовать бесплатно",
        ctaSecondary: "Посмотреть тарифы",
        exTitle: `${d.title} — реальный диалог`,
        finalCtaH: `Хватит подстраиваться под расписание репетитора по ${d.title.toLowerCase()}.`,
        finalCtaSub: "Бесплатно навсегда — 10 сообщений каждые 8 часов. Без карты.",
        finalCtaBtn: "Попробовать Mentora →",
        breadcrumbHome: "Главная",
        breadcrumbRepetitor: "Репетиторы",
      };

  const nonce = headers().get("x-nonce") ?? undefined;
  const subjectUrl = isEn
    ? `https://mentora.su/en/repetitor/${s.url}`
    : `https://mentora.su/repetitor/${s.url}`;
  const repetitorListUrl = isEn ? "https://mentora.su/en/repetitor" : "https://mentora.su/repetitor";
  const homeUrl = isEn ? "https://mentora.su/en" : "https://mentora.su";

  // JSON-LD: BreadcrumbList + Course — даёт rich snippets в Google/Yandex
  // и подсаживает SERP-карточку «Course» на subject-страницы (тёплый трафик
  // «репетитор по математике онлайн» и т.п.)
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: homeUrl },
          { "@type": "ListItem", position: 2, name: t.breadcrumbRepetitor, item: repetitorListUrl },
          { "@type": "ListItem", position: 3, name: d.title, item: subjectUrl },
        ],
      },
      {
        "@type": "Course",
        name: isEn ? `${d.title} with AI mentor` : `${d.title} с ИИ-ментором`,
        description: isEn
          ? `Free AI tutor for ${d.title.toLowerCase()}. ${d.topics}. 24/7, no schedule.`
          : `Бесплатный ИИ-репетитор по ${d.title.toLowerCase()}. ${d.topics}. 24/7, без расписания.`,
        provider: {
          "@type": "Organization",
          name: "Mentora",
          sameAs: "https://mentora.su",
        },
        inLanguage: isEn ? "en" : "ru-RU",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: isEn ? "USD" : "RUB",
          category: "Free",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          inLanguage: isEn ? "en" : "ru-RU",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <ConditionalNav />

      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      {/* Breadcrumb + back chip */}
      <div className="max-w-4xl mx-auto px-6 pt-4 flex items-center gap-3 flex-wrap">
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

        <nav className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "var(--text-muted)" }}>
          <Link href="/" className="hover:underline" style={{ opacity: 0.7 }}>
            {t.breadcrumbHome}
          </Link>
          <span aria-hidden>›</span>
          <Link href="/repetitor" className="hover:underline" style={{ opacity: 0.7 }}>
            {t.breadcrumbRepetitor}
          </Link>
          <span aria-hidden>›</span>
          <span style={{ color: "var(--text)" }}>{d.title}</span>
        </nav>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-16 text-center">
        <h1
          className="font-bold leading-[1.05] tracking-tight mb-6"
          style={{ color: "var(--text)", fontSize: "clamp(1.8rem, 4.8vw, 3.2rem)" }}
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
          style={{ color: "var(--text-muted)", fontSize: "clamp(0.95rem, 1.7vw, 1.15rem)" }}
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

      {/* ── Example dialog ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#4561E8" }}>
          {t.exTitle}
        </h2>
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            borderLeft: "2.5px solid #4561E8",
          }}
        >
          <div className="flex justify-end mb-3">
            <div
              className="rounded-2xl rounded-tr-md px-4 py-2.5 text-sm max-w-[85%]"
              style={{
                background: "rgba(69,97,232,0.12)",
                color: "var(--text)",
              }}
            >
              {d.exQ}
            </div>
          </div>
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-tl-md px-4 py-2.5 text-sm max-w-[85%] leading-relaxed"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              {d.exA}
            </div>
          </div>
        </div>
      </section>

      {/* ── Other subjects (internal-linking for SEO) ────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: "var(--text-muted)" }}>
          {isEn ? "Other subjects" : "Другие предметы"}
        </h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {SUBJECT_LANDINGS.filter((x) => x.url !== s.url).slice(0, 10).map((x) => (
            <Link
              key={x.url}
              href={`/repetitor/${x.url}`}
              className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-100"
              style={{
                color: "var(--text-secondary)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                opacity: 0.8,
              }}
            >
              {isEn ? `${x.en.title} →` : `${x.ru.title} →`}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
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
