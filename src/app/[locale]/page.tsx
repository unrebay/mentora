import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale, getMessages } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import DemoChat from "@/components/DemoChat";
import { createClient } from "@/lib/supabase/server";
import NeuralNetworkCanvas from "@/components/NeuralNetworkCanvas";
import SphereBlobScene, { SUBTLE_SPHERES } from "@/components/SphereBlobScene";
import SubjectGrid from "@/components/SubjectGrid";
import DemoScrollButton from "@/components/DemoScrollButton";
import LandingNav from "@/components/LandingNav";
import BuyProButton from "@/components/BuyProButton";
import FadeUp from "@/components/FadeUp";
import nextDynamic from "next/dynamic";
const LandingStarsCanvas = nextDynamic(() => import("@/components/LandingStarsCanvas"), { ssr: false });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentora — AI-репетитор | История, Математика, Физика и ещё 10 предметов",
  description:
    "Персональный AI-репетитор для школьников и студентов. 13 предметов: история, математика, физика, химия, биология, русский язык, литература, английский и др. Подготовка к ЕГЭ/ОГЭ в живом диалоге. Начни бесплатно — без карты.",
  keywords: [
    "AI репетитор", "ИИ репетитор", "персональный ментор", "школьный репетитор онлайн",
    "подготовка к ЕГЭ", "подготовка к ОГЭ", "ЕГЭ история", "ОГЭ математика",
    "учить историю с ИИ", "история России ЕГЭ", "математика онлайн репетитор",
    "физика онлайн", "химия репетитор", "биология онлайн", "английский с AI",
    "обществознание ЕГЭ", "mentora", "mentora.su",
  ],
  alternates: { canonical: "https://mentora.su" },
  openGraph: {
    type: "website",
    url: "https://mentora.su",
    title: "Mentora — AI-репетитор по 13 школьным предметам",
    description:
      "История, математика, физика, химия, биология и ещё 8 предметов. Диалог с AI-ментором — живо, персонально, бесплатно.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mentora AI-репетитор" }],
  },
};

const SUBJECT_EMOJIS: Record<string, string> = {
  "russian-history": "🏰",
  "world-history": "🌍",
  "mathematics": "📐",
  "physics": "⚡",
  "chemistry": "🧪",
  "biology": "🧬",
  "russian-language": "📝",
  "literature": "📚",
  "english": "🇬🇧",
  "social-studies": "🏛️",
  "geography": "🗺️",
  "computer-science": "💻",
  "astronomy": "🔭",
  "discovery": "🌐",
  "suggest": "+",
};

const SUBJECT_LIVE: Record<string, boolean> = {
  "russian-history": true, "world-history": true, "mathematics": true, "physics": true,
  "chemistry": true, "biology": true, "russian-language": true, "literature": true,
  "english": true, "social-studies": true, "geography": true, "computer-science": true,
  "astronomy": true, "discovery": true,
};

const SUBJECT_IDS = [
  "russian-history", "world-history", "mathematics", "physics", "chemistry", "biology",
  "russian-language", "literature", "english", "social-studies", "geography",
  "computer-science", "astronomy", "discovery", "suggest",
];

const STEP_NUMS = ["01", "02", "03", "04", "05"];
const STEP_BADGE_IDX = 2; // step 03 gets the badge

const STATS_DATA = [
  { value: "13", key: "subjects" as const, color: "#4561E8", icon: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>` },
  { value: "90%", key: "accuracy" as const, color: "#10B981", icon: `<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" fill="none"/><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>` },
  { value: "24/7", key: "availability" as const, color: "#FF7A00", icon: `<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none"/>` },
  { value: "0 ₽", key: "free" as const, color: "#A78BFA", icon: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>` },
];

const FEATURE_ICONS = [
  `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>`,
  `<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>`,
  `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>`,
  `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>`,
  `<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>`,
  `<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>`,
];

const FEATURE_COLORS = ["#4561E8", "#10B981", "#FF7A00", "#A78BFA", "#06B6D4", "#F59E0B"];
const FEATURE_KEYS = ["security", "memory", "supportive", "ai", "global", "price"] as const;

// Static non-localizable per-testimonial data (avatarBg CSS classes)
const TESTIMONIAL_META = [
  { avatarBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
  { avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { avatarBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const locale = await getLocale();
  const t = await getTranslations();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = await getMessages() as any;
  const pricingMsg = messages.pricing;
  const freeFeatures: string[] = pricingMsg.free.features;
  const proFeatures: string[] = pricingMsg.pro.features;
  const ultraFeatures: string[] = pricingMsg.ultra.features;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TESTIMONIALS = (t.raw("landing.testimonials") as any[]).map((item, idx) => ({
    ...item,
    avatarBg: TESTIMONIAL_META[idx]?.avatarBg ?? "",
  }));

  const subjects = SUBJECT_IDS.map((id) => ({
    id,
    emoji: SUBJECT_EMOJIS[id],
    title: t(`subjects.${id}.title`),
    desc: t(`subjects.${id}.desc`),
    live: SUBJECT_LIVE[id] ?? false,
    suggest: id === "suggest",
  }));

  return (
    <div className="min-h-screen text-[var(--text)]" style={{ background: "var(--bg)" }}>

      {/* NAV — scroll-aware dark/light */}
      <LandingNav />

      {/* ── DARK UNIVERSE: nav gap + hero + stats + features in one seamless block ── */}
      <div className="relative" style={{ background: "#060912", marginTop: "-76px" }}>
        {/* Star field — spans the entire dark section, reacts to cursor */}
        <LandingStarsCanvas className="absolute inset-0 w-full h-full z-0" />

      {/* HERO — padding-top compensates for the negative margin */}
      <section className="relative overflow-hidden" style={{ paddingTop: "76px" }}>
        <div className="absolute inset-0 pointer-events-none z-[1]" aria-hidden>
          <NeuralNetworkCanvas className="absolute inset-0 w-full h-full" />
        </div>
        <SphereBlobScene spheres={SUBTLE_SPHERES} intensity={0.45} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <FadeUp>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold tracking-widest uppercase"
                  style={{ background: "rgba(69,97,232,0.15)", color: "#6B8FFF", border: "1px solid rgba(69,97,232,0.25)" }}>
                  {t("landing.heroBadge")}
                </div>
              </FadeUp>
              <FadeUp delay={0.08}>
              <h1 className="text-[2.1rem] sm:text-[2.8rem] md:text-[3.2rem] lg:text-[4rem] font-black leading-[1.05] mb-6 tracking-tight text-white">
                {locale === "en" ? (
                  <>
                    Forget <span className="line-through text-gray-600 font-bold">boring</span>{" "}
                    textbooks.<br />
                    Learn in{" "}
                    <span style={{
                      background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontStyle: "italic",
                    }}>dialogue.</span>
                  </>
                ) : (
                  <>
                    Забудь про{" "}
                    <span className="line-through text-gray-600 font-bold">скучные</span>{" "}
                    учебники.<br />
                    Учись в{" "}
                    <span style={{
                      background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontStyle: "italic",
                    }}>диалоге.</span>
                  </>
                )}
              </h1>
              </FadeUp>
              <FadeUp delay={0.16}>
                <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-md">
                  {t("landing.heroSubtitle")}
                </p>
              </FadeUp>
              <FadeUp delay={0.24}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/auth"
                    className="px-7 py-3.5 font-semibold rounded-full text-white transition-all hover:scale-[1.03] active:scale-95"
                    style={{ background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)", boxShadow: "0 4px 20px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.2) inset" }}>
                    {t("landing.heroCtaStart")}
                  </Link>
                  <DemoScrollButton />
                </div>
              </FadeUp>
            </div>

            <FadeUp delay={0.18} className="flex flex-col gap-4" id="demo">
              <DemoChat />
              <FadeUp delay={0.28} fade>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                {locale === "en" ? (
                  <>Ask the question you couldn&apos;t{" "}
                    <span className="text-[#4561E8] font-medium">say out loud</span>
                  </>
                ) : (
                  <>Задай вопрос, который не решался{" "}
                    <span className="text-[#4561E8] font-medium">произнести вслух</span>
                  </>
                )}
              </p>
              </FadeUp>
            </FadeUp>
          </div>

          {/* Floating questions — Russian only */}
          {locale === "ru" && (
            <div className="relative z-10 mt-20 max-w-4xl mx-auto px-4">
              <div className="mb-24 space-y-10">
                <FadeUp delay={0}><p className="text-xl sm:text-2xl font-semibold text-white w-fit">Подожди, а почему именно 1941-й?</p></FadeUp>
                <FadeUp delay={0.1} className="ml-auto mr-[8%] w-fit"><p className="text-base sm:text-lg font-medium text-gray-400">Это вообще базово знать или нет?</p></FadeUp>
                <FadeUp delay={0.2} className="w-fit sm:ml-[14%]"><p className="text-2xl sm:text-3xl font-bold text-white">Объясни ещё раз, другими словами.</p></FadeUp>
                <FadeUp delay={0.3} className="w-fit ml-[28%] sm:ml-[52%]"><p className="text-base sm:text-xl font-medium text-gray-500">А зачем это вообще учить?</p></FadeUp>
              </div>
              <FadeUp delay={0.1}>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-semibold text-white mb-1">{t("landing.teacherLine1")}</p>
                <p className="text-xl sm:text-2xl font-semibold mb-12 text-white">
                  <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 700 }}>
                    M<span style={{ color: "#4561E8", fontStyle: "italic", marginRight: "0.05em" }}>e</span>ntora
                  </span>
                  {" "}{locale === "ru" ? "— только тебе." : "— only for you."}
                </p>
                <Link href="/auth"
                  className="inline-flex px-7 py-3.5 bg-[#4561E8] text-white font-medium rounded-full hover:bg-[#3651d8] transition-all hover:scale-[1.03] active:scale-95">
                  {t("landing.heroCta2")}
                </Link>
              </div>
              </FadeUp>
            </div>
          )}

          {/* English CTA mid-hero */}
          {locale === "en" && (
            <FadeUp delay={0.1}>
            <div className="relative z-10 mt-16 text-center">
              <p className="text-xl sm:text-2xl font-semibold text-white mb-1">{t("landing.teacherLine1")}</p>
              <p className="text-xl sm:text-2xl font-semibold mb-8 text-white">
                <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 700 }}>
                  M<span style={{ color: "#4561E8", fontStyle: "italic", marginRight: "0.05em" }}>e</span>ntora
                </span>
                {" "}{t("landing.teacherLine2")}
              </p>
              <Link href="/auth"
                className="inline-flex px-7 py-3.5 bg-[#4561E8] text-white font-medium rounded-full hover:bg-[#3651d8] transition-all hover:scale-[1.03] active:scale-95">
                {t("landing.heroCtaStart")}
              </Link>
            </div>
            </FadeUp>
          )}
        </div>
      </section>

      {/* STATS + FEATURES — same dark universe, no separate background */}
      <div className="relative z-10">

        {/* STATS */}
        <section className="text-white pt-14 pb-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS_DATA.map((s, i) => (
              <FadeUp key={s.value} delay={i * 0.08}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${s.color}25`, color: s.color }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" dangerouslySetInnerHTML={{ __html: s.icon }} />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-sm text-gray-400 mt-0.5 leading-tight">{t(`stats.${s.key}`)}</div>
                </div>
              </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* Thin divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* FEATURES */}
        <section className="text-white px-6 pt-16 pb-10">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <p className="text-xs font-bold tracking-[0.22em] uppercase mb-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                {t("landing.featuresLabel")}
              </p>
              <h2 className="text-4xl md:text-5xl font-black mb-3 leading-tight text-center text-white">
                {t("landing.featuresTitle")}
              </h2>
              <p className="text-center text-base mb-12 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
                {t("landing.featuresSubtitle")}
              </p>
            </FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURE_KEYS.map((key, i) => {
                const color = FEATURE_COLORS[i];
                const icon = FEATURE_ICONS[i];
                const title = t(`features.${key}.title`);
                const desc = t(`features.${key}.desc`);
                const tag = key === "security" ? t("features.security.tag")
                  : key === "memory" ? t("features.memory.tag")
                  : key === "ai" ? t("features.ai.tag")
                  : undefined;
                const isPrice = key === "price";
                return (
                  <FadeUp key={key} delay={i * 0.07} className="h-full">
                  <div
                    className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.01] h-full"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${color}22`, color }}>
                        <svg viewBox="0 0 24 24" className="w-5 h-5" dangerouslySetInnerHTML={{ __html: icon }} />
                      </div>
                      {tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-1"
                          style={{ background: `${color}22`, color, border: `1px solid ${color}40` }}>
                          {tag}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1.5 text-white">{title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
                    </div>
                    {isPrice && (
                      <div className="mt-1 space-y-2">
                        {[
                          { label: t("features.price.tutorLabel"), value: t("features.price.tutorValue"), sub: t("features.price.tutorSub"), highlight: false },
                          { label: t("features.price.proLabel"), value: t("features.price.proValue"), sub: t("features.price.proSub"), highlight: true },
                        ].map((c) => (
                          <div key={c.label}
                            className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
                            style={c.highlight
                              ? { background: `${color}18`, border: `1px solid ${color}40` }
                              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }
                            }>
                            <div>
                              <div className="text-[11px] font-semibold" style={{ color: c.highlight ? color : "rgba(255,255,255,0.4)" }}>{c.label}</div>
                              <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{c.sub}</div>
                            </div>
                            <div className="text-sm font-bold shrink-0"
                              style={{ color: c.highlight ? color : "rgba(255,255,255,0.35)", textDecoration: c.highlight ? "none" : "line-through" }}>
                              {c.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>

      </div>

      </div>{/* /DARK UNIVERSE */}

      {/* SVG wave: outside the dark div so transparency shows light page bg */}
      <div aria-hidden style={{ marginTop: -2, position: "relative", zIndex: 1, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: 90 }}>
          <path
            d="M0,0 C120,70 280,90 480,55 C640,25 800,75 960,50 C1120,25 1300,65 1440,40 L1440,0 Z"
            fill="#060912"
          />
        </svg>
      </div>

      <section id="subjects" className="max-w-6xl mx-auto px-6 py-16">
        <FadeUp>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs font-bold text-[var(--text-muted)] tracking-[0.2em] uppercase">{t("landing.libraryLabel")}</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-3 leading-tight text-center">
            {t("landing.subjectsHeading")}
          </h2>
          <p className="text-center text-[var(--text-muted)] text-base mb-10">
            {t("landing.subjectsDesc")}
          </p>
        </FadeUp>
        <SubjectGrid subjects={subjects} />
      </section>

      {/* HOW TO LEARN */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <FadeUp>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 sm:p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">{t("landing.howLearnTitle")}</div>
              <h2 className="text-3xl font-bold mb-4 leading-tight">
                {locale === "en" ? (
                  <>3 techniques that make<br /><span className="text-brand-600 dark:text-brand-500 italic">learning effective</span></>
                ) : (
                  <>3 приёма, которые делают<br /><span className="text-brand-600 dark:text-brand-500 italic">учёбу эффективной</span></>
                )}
              </h2>
              <Link href="/guide" className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-500 text-sm font-medium hover:underline">
                {t("landing.howLearnGuide")}
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8zm3.5-1.5L8 9l2.5-2.5"/>
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">{t("landing.tip1Title")}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{t("landing.tip1Desc")}</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M13 4H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM3 7h10"/>
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">{t("landing.tip2Title")}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{t("landing.tip2Desc")}</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M8 2v4M8 10v4M2 8h4M10 8h4"/>
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">{t("landing.tip3Title")}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{t("landing.tip3Desc")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </FadeUp>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-24">
        {/* Section header */}
        <FadeUp>
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: "var(--brand)" }}>
            {t("nav.pricing")}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
            {t("pricing.hero.title")}<br />
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "italic",
            }}>
              {t("pricing.hero.titleGradient")}
            </span>
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>{t("pricing.hero.subtitle")}</p>
        </div>
        </FadeUp>

        {/* Promo banner — Russian only */}
        {locale === "ru" && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl px-5 py-4 border"
            style={{ background: "linear-gradient(135deg,rgba(69,97,232,0.06) 0%,rgba(159,122,255,0.04) 100%)", borderColor: "rgba(69,97,232,0.18)" }}>
            <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#f59e0b" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm" style={{ color: "var(--text)" }}>Только до 1 июня —</span>{" "}
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                при покупке годового плана <strong style={{ color: "var(--brand)" }}>+3 месяца в подарок</strong>. Платишь за 12 — пользуешься 15.
              </span>
            </div>
          </div>
        )}

        {/* Pricing cards */}
        {(() => {
          const Check = ({ dark }: { dark?: boolean }) => (
            <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill={dark ? "rgba(255,255,255,0.12)" : "rgba(69,97,232,0.12)"} />
              <path d="M5 8l2 2 4-4" stroke={dark ? "rgba(255,255,255,0.7)" : "#4561E8"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          );
          return (
            <div className="grid md:grid-cols-3 gap-6 md:gap-4 items-stretch">
              {/* FREE */}
              <FadeUp delay={0}>
              <div className="rounded-2xl p-7 flex flex-col border h-full"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="mb-6">
                  <p className="text-[11px] font-bold t-muted tracking-[0.15em] uppercase mb-4">{t("pricing.free.name")}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-bold tracking-tight t-primary">{t("pricing.free.price")}</span>
                  </div>
                  <p className="text-sm t-muted mt-2">{t("pricing.freeDesc")}</p>
                </div>
                <Link href="/auth" className="block text-center py-3 px-5 font-semibold rounded-xl transition-all duration-200 mb-8 text-sm border"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                  {t("pricing.free.cta")}
                </Link>
                <ul className="space-y-3 flex-1">
                  {freeFeatures.map((f: string) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm t-secondary"><Check />{f}</li>
                  ))}
                </ul>
              </div>
              </FadeUp>

              {/* PRO */}
              <FadeUp delay={0.12}>
              <div className="relative rounded-[17px] p-[1.5px] flex flex-col mt-3 md:mt-0"
                style={{ background: "linear-gradient(145deg, #6B8FFF, #4561E8 45%, #9F7AFF)", boxShadow: "0 8px 40px rgba(69,97,232,0.25), 0 2px 8px rgba(69,97,232,0.15)" }}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase"
                    style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)" }}>
                    {t("pricing.pro.badge")}
                  </span>
                </div>
                <div className="rounded-2xl p-7 flex flex-col flex-1" style={{ background: "var(--bg-card)" }}>
                  <div className="mb-6">
                    <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4" style={{ color: "var(--brand)" }}>{t("pricing.pro.name")}</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-5xl font-bold tracking-tight t-primary">{t("pricing.pro.price")}</span>
                      <span className="t-muted text-sm mb-2">{t("pricing.pro.period")}</span>
                    </div>
                    {locale === "ru" && (
                      <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2.5" style={{ background: "var(--bg-secondary)" }}>
                        <span className="text-sm font-semibold t-secondary">2 990 ₽ / год</span>
                        <span className="t-muted text-xs">·</span>
                        <span className="text-xs t-muted">249 ₽/мес</span>
                        <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ color: "#15803d", background: "rgba(21,128,61,0.1)" }}>−37%</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 mb-7">
                    <BuyProButton isLoggedIn={false} isPro={false} plan="monthly" />
                    <BuyProButton isLoggedIn={false} isPro={false} plan="annual" />
                  </div>
                  <ul className="space-y-3 flex-1">
                    {proFeatures.map((f: string) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm t-secondary"><Check />{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
              </FadeUp>

              {/* ULTRA */}
              <FadeUp delay={0.24}>
              <div className="relative flex flex-col mt-3 md:mt-0">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <span className="text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase"
                    style={{ background: "linear-gradient(135deg, rgba(255,122,0,0.75), rgba(124,58,237,0.75))", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(255,122,0,0.25)" }}>
                    {t("common.new").toUpperCase()}
                  </span>
                </div>
                <div className="relative rounded-2xl p-7 flex flex-col flex-1 overflow-hidden" style={{ background: "#060610" }}>
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(255,122,0,0.28) 0%, transparent 65%)" }} />
                  <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)" }} />
                  <div className="mb-6 relative z-10">
                    <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
                      style={{ background: "linear-gradient(90deg, #FF7A00, #9F7AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {t("pricing.ultra.name")}
                    </p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-5xl font-bold tracking-tight text-white">{t("pricing.ultra.price")}</span>
                      <span className="text-gray-400 text-sm mb-2">{t("pricing.ultra.period")}</span>
                    </div>
                    {locale === "ru" && (
                      <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span className="text-sm font-semibold text-white/80">5 990 ₽ / год</span>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-xs text-white/40">499 ₽/мес</span>
                        <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-lg">−37%</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 mb-7 relative z-10">
                    <BuyProButton isLoggedIn={false} isPro={false} isUltima={false} plan="ultima_monthly" />
                    <BuyProButton isLoggedIn={false} isPro={false} isUltima={false} plan="ultima_annual" />
                  </div>
                  <ul className="space-y-3 flex-1 relative z-10">
                    {ultraFeatures.map((label: string, i: number) => {
                      const isSoon = locale === "ru" ? (i === 2 || i === 3) : false;
                      return (
                        <li key={label} className="flex items-start gap-2.5 text-sm text-white/70">
                          <Check dark />
                          <span className="flex items-center gap-2 flex-wrap">
                            {label}
                            {isSoon && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
                                style={{ background: "rgba(255,122,0,0.18)", color: "#FF9A3C", border: "1px solid rgba(255,122,0,0.25)" }}>
                                {t("pricing.soon")}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              </FadeUp>
            </div>
          );
        })()}

        {/* Ultima disclaimer */}
        <FadeUp delay={0.1} fade>
        <p className="mt-5 text-center text-xs leading-relaxed max-w-xl mx-auto" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
          <svg viewBox="0 0 12 12" width="9" height="9" style={{ display: "inline", verticalAlign: "middle", marginRight: 4, marginTop: -1 }}>
            <path d="M6 0.5L7.1 4.1L10.5 2.5L8.9 5.9L12.5 6L8.9 6.1L10.5 9.5L7.1 7.9L6 11.5L4.9 7.9L1.5 9.5L3.1 6.1L-0.5 6L3.1 5.9L1.5 2.5L4.9 4.1Z"
              fill="currentColor" />
          </svg>
          {locale === "ru"
            ? "Тариф Ultima сейчас включает все возможности Pro. Функции распознавания фото, презентаций и аудио находятся в активной разработке и будут добавлены в ближайшие месяцы."
            : "Ultima currently includes all Pro features. Photo recognition, presentation and audio generation are in active development and will be available soon."}
        </p>
        </FadeUp>
      </section>

      {/* ЕГЭ/ОГЭ COMING SOON — Russian only */}
      {locale === "ru" && (
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
            <div className="relative overflow-hidden rounded-3xl bg-gray-900 dark:bg-[#0a0a18] text-white p-8 md:p-12">
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, #4561E820 0%, transparent 60%)" }} />
              </div>
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600/20 text-brand-400 text-xs font-bold rounded-full mb-5 tracking-widest uppercase">
                    Скоро — июнь 2026
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Режим подготовки<br />
                    <span className="text-brand-400 italic">к ЕГЭ и ОГЭ</span>
                  </h2>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    Специальный режим с реальными заданиями, трекером готовности и прогнозом результата. Идеально к сезону экзаменов.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                    <span className="flex items-center gap-2"><span className="text-brand-400">✓</span> Реальные задания ЕГЭ/ОГЭ</span>
                    <span className="flex items-center gap-2"><span className="text-brand-400">✓</span> Трекер готовности к экзамену</span>
                    <span className="flex items-center gap-2"><span className="text-brand-400">✓</span> Прогноз результата</span>
                    <span className="flex items-center gap-2"><span className="text-brand-400">✓</span> Все 13 предметов</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Пример: трекер готовности</div>
                    <div className="text-xl font-bold mb-3">60% программы пройдено</div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: "60%" }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">До экзамена: 40 дней · История России · ЕГЭ 2026</div>
                  </div>
                  <Link href="/auth" className="block text-center py-3 px-6 bg-brand-600 text-white font-semibold rounded-full hover:bg-brand-700 transition-colors text-sm">
                    Начать готовиться уже сейчас
                  </Link>
                </div>
              </div>
            </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-20" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp>
          <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">{t("landing.howLabel")}</div>
          <h2 className="text-4xl font-bold mb-3 leading-tight">
            {t("landing.howHeading1")}<br />
            {locale === "en" ? (
              <span className="text-brand-600 dark:text-brand-500 italic">{t("landing.howHeading2")}</span>
            ) : (
              <>до <span className="text-brand-600 dark:text-brand-500 italic">{t("landing.howHeading2")}</span></>
            )}
          </h2>
          <p className="text-[var(--text-secondary)] mb-12 max-w-lg">
            {t("landing.howIntroSub")}
          </p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {STEP_NUMS.map((n, i) => (
              <FadeUp key={n} delay={i * 0.07} className="h-full">
              <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] relative h-full">
                {i === STEP_BADGE_IDX && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded">{t("landing.stepBadge")}</span>
                )}
                <div className="text-xs font-bold text-[var(--text-muted)] mb-3">{n}</div>
                <div className="font-semibold text-sm mb-1.5 text-[var(--text)]">{t(`steps.${n}.title`)}</div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{t(`steps.${n}.desc`)}</div>
              </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <FadeUp>
        <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">{t("landing.testimonialsLabel")}</div>
        <h2 className="text-4xl font-bold mb-3 leading-tight">{t("landing.testimonialsTitle")}</h2>
        <p className="text-[var(--text-secondary)] mb-10 text-lg">{t("landing.testimonialsSub")}</p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => {
            const accentColors = ["#4561E8", "#FF7A00", "#10B981"];
            const accent = accentColors[i % accentColors.length];
            return (
              <FadeUp key={testimonial.name} delay={i * 0.1} className="h-full">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }} />
                <div className="text-5xl leading-none font-black select-none -mt-1 -mb-2" style={{ color: accent, opacity: 0.2 }}>&quot;</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonial.stars }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                  {Array.from({ length: 5 - testimonial.stars }).map((_, j) => (
                    <span key={`e-${j}`} className="text-gray-300 dark:text-gray-700 text-sm">★</span>
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1">{testimonial.text}</p>
                <div className="text-xs font-semibold px-2 py-1 rounded-md w-fit" style={{ background: `${accent}15`, color: accent }}>{testimonial.xp}</div>
                <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-light)]">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${testimonial.avatarBg}`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{testimonial.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{testimonial.role}</div>
                  </div>
                </div>
              </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* Wave: light → dark CTA */}
      <div aria-hidden style={{ marginBottom: -2, position: "relative", zIndex: 1, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: 90 }}>
          <path
            d="M0,55 C180,20 360,80 560,42 C740,8 920,72 1120,38 C1260,18 1360,58 1440,44 L1440,90 L0,90 Z"
            fill="#111827"
          />
        </svg>
      </div>

      {/* CTA */}
      <section style={{ background: "#111827" }} className="text-white px-6 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 120%, #4561E840 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10">
          <FadeUp fade delay={0}>
          <p className="text-gray-500 text-xs font-semibold tracking-[0.2em] uppercase mb-8">{t("landing.ctaTagline")}</p>
          </FadeUp>
          <FadeUp delay={0.08}>
          <h2 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight">
            {t("landing.ctaHero1")}<br />
            {locale === "en" ? (
              t("landing.ctaHero2")
            ) : (
              <>как тебе{" "}<span className="text-[#4561E8] italic">удобно.</span></>
            )}
          </h2>
          </FadeUp>
          <FadeUp delay={0.16}>
          <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
            {t("landing.ctaLine1")}<br />
            {t("landing.ctaLine2")}
          </p>
          <Link href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all hover:scale-[1.03] active:scale-95 text-sm">
            {t("landing.ctaButton")}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <p className="text-gray-600 text-xs mt-5">{t("landing.ctaNoCard")}</p>
          </FadeUp>
        </div>
      </section>

      <footer className="py-8" style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <span>{t("landing.footerRights")}</span>
            <div className="flex gap-6">
              <Link href="/privacy" className="transition-colors hover:text-white/70">{t("landing.footerPrivacy")}</Link>
              <Link href="/terms" className="transition-colors hover:text-white/70">{t("landing.footerTerms")}</Link>
            </div>
          </div>
          {locale === "ru" && (
            <p className="text-center" style={{ fontSize: "10px", opacity: 0.3, maxWidth: 480, lineHeight: 1.4 }}>
              Instagram — продукт компании Meta Platforms Inc. Деятельность организации Meta Platforms признана экстремистской и запрещена на территории Российской Федерации.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
