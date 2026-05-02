import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guide");
  return { title: t("metaTitle"), description: t("metaDesc") };
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

export default async function GuidePage() {
  const t = await getTranslations("guide");

  return (
    <div className="min-h-screen" style={{ background: "#04060f", color: "#fff" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: "rgba(4,6,15,0.85)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/"><Logo size="sm" fontSize="1.44rem" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="btn-glow inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white">
              {t("startFreeBtn")}
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
              color: "#6B8FFF",
              border: "1px solid rgba(69,97,232,0.18)",
            }}>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
            {t("heroTitle")}{" "}
            <span style={{ fontStyle: "italic", fontFamily: "var(--font-playfair), Georgia, serif" }}>
              M<span style={{ color: "#4561E8", fontStyle: "italic", marginRight: "0.02em" }}>e</span>ntora
            </span>
          </h1>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
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
                  background: "rgba(6,6,18,0.42)",
                  backdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                  WebkitBackdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderLeft: `2.5px solid ${meta.accent}`,
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
                }}
              >
                {/* Color spotlight — top-right, intensifies on hover */}
                <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none transition-opacity duration-500 opacity-40 group-hover:opacity-95"
                  style={{ background: `radial-gradient(circle, ${meta.accent}26 0%, transparent 65%)` }} />

                <div className="flex items-start gap-5 p-6 md:p-7 relative z-10">
                  {/* Icon badge with gradient + colored border */}
                  <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center mt-0.5 transition-transform duration-300 group-hover:scale-105"
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
                        style={{
                          background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}AA)`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}>
                        {meta.n}
                      </span>
                      <h2 className="font-bold text-[17px] leading-snug" style={{ color: "rgba(255,255,255,0.92)" }}>{t(`${key}.title`)}</h2>
                    </div>
                    <p className="leading-relaxed mb-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{t(`${key}.body`)}</p>
                    <div className="inline-flex items-start gap-2 px-3 py-2 rounded-xl text-sm italic"
                      style={{
                        background: `linear-gradient(135deg, ${meta.accent}1A, ${meta.accent}08)`,
                        color: "rgba(255,255,255,0.55)",
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
        <div className="relative rounded-2xl p-6 mb-10 overflow-hidden"
          style={{
            background: "rgba(245,158,11,0.10)",
            backdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
            WebkitBackdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
            border: "1px solid rgba(245,158,11,0.30)",
            borderLeft: "2.5px solid #f59e0b",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.30), 0 1px 0 rgba(255,255,255,0.06) inset",
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
              <div className="font-semibold text-sm mb-1" style={{ color: "#d97706" }}>{t("limitTitle")}</div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("limitDesc")}{" "}
                <Link href="/pricing" className="font-semibold hover:underline" style={{ color: "#f59e0b" }}>
                  {t("limitLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────── */}
        <div className="text-center">
          <Link href="/auth" className="btn-glow inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl text-white text-base">
            {t("ctaBtn")}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>{t("ctaNote")}</p>
        </div>
      </main>

      {/* ── Footer CTA dark ──────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6 text-center mt-10"
        style={{ background: "#04060f" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-40 pointer-events-none rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(69,97,232,0.18) 0%, transparent 70%)", top: "-20px" }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            {t("footerCtaTitle")}
          </h2>
          <p className="mb-8 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t("footerCtaDesc")}
          </p>
          <Link href="/auth" className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white">
            {t("footerCtaBtn")}
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t" style={{ background: "#04060f", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">{t("footerPrivacy")}</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">{t("footerPricing")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
