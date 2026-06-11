import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ConditionalNav, ConditionalFooter } from "@/components/ConditionalShell";
import { getTranslations } from "next-intl/server";
import AbroadWaitlistForm from "@/components/AbroadWaitlistForm";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "abroad" });
  const url = locale === "en" ? "https://mentora.su/en/abroad" : "https://mentora.su/ru/abroad";
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: {
      canonical: url,
      languages: { ru: "https://mentora.su/ru/abroad", en: "https://mentora.su/en/abroad", "x-default": "https://mentora.su/ru/abroad" },
    },
    openGraph: {
      type: "website",
      url,
      title: t("metaTitle"),
      description: t("metaDesc"),
      images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    },
  };
}

const POINT_ACCENTS = ["#4561E8", "#7C3AED", "#0E9F6E"];

const POINT_ICONS = [
  <svg key="globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>,
  <svg key="puzzle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>,
  <svg key="wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
  </svg>,
];

export default async function AbroadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "abroad" });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <ConditionalNav />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-28 md:pt-36 pb-12 text-center">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-6"
          style={{ background: "rgba(69,97,232,0.12)", color: "#5575FF", border: "1px solid rgba(69,97,232,0.25)" }}
        >
          {t("badge")}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">{t("heroTitle")}</h1>
        <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
          {t("heroDesc")}
        </p>
      </section>

      {/* Points */}
      <section className="max-w-4xl mx-auto px-5 pb-14 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((n, i) => (
          <div
            key={n}
            className="rounded-2xl p-6 text-left"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${POINT_ACCENTS[i]}1A`, color: POINT_ACCENTS[i] }}
            >
              {POINT_ICONS[i]}
            </div>
            <h3 className="font-semibold mb-2">{t(`point${n}Title`)}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {t(`point${n}Desc`)}
            </p>
          </div>
        ))}
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="max-w-2xl mx-auto px-5 pb-16">
        <div
          className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="absolute inset-x-0 -top-24 h-48 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(69,97,232,0.18), transparent 70%)" }}
          />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{t("formTitle")}</h2>
            <p className="text-sm md:text-base mb-2 max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
              {t("formDesc")}
            </p>
            <p className="text-xs font-medium mb-7" style={{ color: "#5575FF" }}>
              {t("priceNote")}
            </p>
            <AbroadWaitlistForm locale={locale} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">{t("faqTitle")}</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <details
              key={n}
              className="group rounded-2xl px-6 py-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <summary className="cursor-pointer list-none font-semibold flex items-center justify-between gap-3">
                {t(`faq${n}q`)}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--text-muted)" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t(`faq${n}a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Try now CTA */}
      <section className="max-w-2xl mx-auto px-5 pb-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{t("tryNowTitle")}</h2>
        <p className="mb-8 max-w-md mx-auto text-sm md:text-base" style={{ color: "var(--text-muted)" }}>
          {t("tryNowDesc")}
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
            boxShadow: "0 8px 28px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(255,255,255,0.08) inset",
          }}
        >
          {t("tryNowBtn")}
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </section>

      <ConditionalFooter />
    </div>
  );
}
