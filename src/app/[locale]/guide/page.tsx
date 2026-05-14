import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import LandingNav from "@/components/LandingNav";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  const url = locale === "en" ? "https://mentora.su/en/guide" : "https://mentora.su/ru/guide";
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: {
      canonical: url,
      languages: { ru: "https://mentora.su/ru/guide", en: "https://mentora.su/en/guide", "x-default": "https://mentora.su/ru/guide" },
    },
    openGraph: {
      type: "article",
      url,
      title: t("metaTitle"),
      description: t("metaDesc"),
      images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    },
  };
}

/* ── SVG icons per tip — pure data, no localization ─────────── */
const TIP_META = [
  { n: "01", accent: "#4561E8", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  )},
  { n: "02", accent: "#7C3AED", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  )},
  { n: "03", accent: "#0EA5E9", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )},
  { n: "04", accent: "#10B981", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )},
  { n: "05", accent: "#F59E0B", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  )},
  { n: "06", accent: "#FF7A00", icon: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#FF7A00" />
      <path d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z" fill="rgba(255,200,80,0.9)" />
    </svg>
  )},
  { n: "07", accent: "#9F7AFF", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  )},
];

const TIP_KEYS = ["tip1","tip2","tip3","tip4","tip5","tip6","tip7"] as const;

export default async function GuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("guide");
  const isEn = locale === "en";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* Унифицированный лендинг-навбар (glass pill, как на главной) */}
      <LandingNav alwaysLight />

      <main className="max-w-4xl mx-auto px-6 pt-4 pb-16">

        {/* ── Back button — отдельная, не часть hero ─────────── */}
        <div className="mb-8 mt-2">
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
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {isEn ? "Back" : "Назад"}
          </Link>
        </div>

        {/* ── Hero — пилла убрана; Mentora крупнее; подзаголовок в одну строку на desktop ── */}
        <div className="mb-16 text-center">
          <h1
            className="font-bold mb-5 leading-[1.05] tracking-tight inline-flex flex-wrap items-baseline gap-x-3 sm:gap-x-4 justify-center"
            style={{ color: "var(--text)", fontSize: "clamp(2.25rem, 5.5vw, 3.75rem)" }}
          >
            <span>{t("heroTitle")}</span>
            {/* Mentora — увеличили относительно остального заголовка. Logo сохраняет M+курсив-e+ntora. */}
            <Logo href="" fontSize="clamp(2.6rem, 6.5vw, 4.5rem)" />
          </h1>
          <p
            className="leading-relaxed mx-auto whitespace-normal md:whitespace-nowrap"
            style={{ color: "var(--text-muted)", fontSize: "clamp(0.95rem, 1.6vw, 1.125rem)" }}
          >
            {t("heroSubtitle")}
          </p>
        </div>

        {/* ── Tips ─────────────────────────────────────────── */}
        <div className="space-y-4 mb-16">
          {TIP_KEYS.map((key, idx) => {
            const meta = TIP_META[idx];
            return (
              <div key={key}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "var(--bg-nav)",
                  backdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                  WebkitBackdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                  border: "1px solid var(--border-light)",
                  borderLeft: `2.5px solid ${meta.accent}`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                }}
              >
                {/* Color spotlight — top-right, intensifies on hover */}
                <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none transition-opacity duration-500 opacity-30 group-hover:opacity-90"
                  style={{ background: `radial-gradient(circle, ${meta.accent}26 0%, transparent 65%)` }} />

                <div className="flex items-center gap-5 p-6 md:p-7 relative z-10">
                  {/* Icon badge with gradient + colored border */}
                  <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${meta.accent}33, ${meta.accent}0F)`,
                      border: `1px solid ${meta.accent}40`,
                      color: meta.accent,
                      boxShadow: `0 4px 14px ${meta.accent}22, 0 1px 0 rgba(255,255,255,0.08) inset`,
                    }}>
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-2xl font-black tracking-tight leading-none"
                        style={{ color: meta.accent }}>
                        {meta.n}
                      </span>
                      <h2 className="font-bold text-[17px] leading-snug" style={{ color: "var(--text)" }}>{t(`${key}.title`)}</h2>
                    </div>
                    <p className="leading-relaxed mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>{t(`${key}.body`)}</p>
                    <div className="inline-flex items-start gap-2 px-3 py-2 rounded-xl text-sm italic"
                      style={{
                        background: `linear-gradient(135deg, ${meta.accent}1A, ${meta.accent}08)`,
                        color: "var(--text-muted)",
                        borderLeft: `2px solid ${meta.accent}66`,
                        boxShadow: `0 2px 8px ${meta.accent}14`,
                      }}>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={meta.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      {t(`${key}.example`)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Limit note ───────────────────────────────────── */}
        <div className="relative rounded-2xl p-6 mb-16 overflow-hidden"
          style={{
            background: "rgba(245,158,11,0.10)",
            backdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
            WebkitBackdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
            border: "1px solid rgba(245,158,11,0.30)",
            borderLeft: "2.5px solid #f59e0b",
            boxShadow: "0 4px 20px rgba(245,158,11,0.10)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(245,158,11,0.18)" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1" style={{ color: "#d97706" }}>{t("limitTitle")}</div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("limitDesc")}{" "}
                <Link href="/pricing" className="font-semibold hover:underline" style={{ color: "#f59e0b" }}>
                  {t("limitLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6 text-center"
        style={{ background: "var(--bg)" }}>
        <div className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "220px",
            background: "linear-gradient(180deg, rgba(69,97,232,0.05) 0%, rgba(69,97,232,0.02) 50%, transparent 100%)",
          }} />
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(69,97,232,0.20) 35%, rgba(69,97,232,0.30) 50%, rgba(69,97,232,0.20) 65%, transparent 100%)",
          }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ color: "var(--text)" }}>
            {t("footerCtaTitle")}
          </h2>
          <p className="mb-8 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            {t("footerCtaDesc")}
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
              boxShadow: "0 8px 28px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(255,255,255,0.08) inset",
            }}
          >
            {t("ctaShortBtn")}
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t" style={{ background: "var(--bg)", borderColor: "var(--border-light)" }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7 }}>{t("footerPrivacy")}</Link>
            <Link href="/pricing" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7 }}>{t("footerPricing")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
