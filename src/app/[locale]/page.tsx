import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import DemoChat from "@/components/DemoChat";
import { createClient } from "@/lib/supabase/server";
import NeuralNetworkCanvas from "@/components/NeuralNetworkCanvas";
import SphereBlobScene, { SUBTLE_SPHERES } from "@/components/SphereBlobScene";
import SubjectGrid from "@/components/SubjectGrid";
import { LATEST } from "@/lib/changelog";
import DemoScrollButton from "@/components/DemoScrollButton";
import LandingNav from "@/components/LandingNav";

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

const TESTIMONIALS = [
  {
    name: "Алина Соколова",
    role: "Школьница, 10 класс",
    avatar: "А",
    avatarBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    text: "Готовлюсь к ЕГЭ по истории. Раньше зазубривала даты — теперь просто разговариваю с Менторой, и всё складывается само. За две недели прошла больше, чем за всю четверть с учителем.",
    stars: 5,
    xp: "340 мент · 14 дней подряд",
  },
  {
    name: "Кирилл Носов",
    role: "Школьник, 8 класс",
    avatar: "К",
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    text: "Зашёл спросить про уравнения, задержался на час — оказывается, математика может быть интересной. Попросил объяснить три раза по-разному, Ментора ни разу не раздражалась.",
    stars: 5,
    xp: "210 мент · 7 дней подряд",
  },
  {
    name: "Марина Захарова",
    role: "Взрослая, учусь для себя",
    avatar: "М",
    avatarBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    text: "Очень нравится — давно хотела разобраться в истории для себя, не для экзамена. Ставлю 4 звезды, потому что хочется мобильное приложение: иногда неудобно открывать браузер на телефоне. Но сам продукт — огонь.",
    stars: 4,
    xp: "520 мент · 8 дней подряд",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const locale = await getLocale();
  const t = await getTranslations();

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

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <NeuralNetworkCanvas className="absolute inset-0 w-full h-full" />
        </div>
        <SphereBlobScene spheres={SUBTLE_SPHERES} intensity={0.45} />

        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" aria-hidden
          style={{ background: "linear-gradient(to bottom, transparent, #111827)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold tracking-widest uppercase"
                style={{ background: "rgba(69,97,232,0.15)", color: "#6B8FFF", border: "1px solid rgba(69,97,232,0.25)" }}>
                {t("landing.heroBadge")}
              </div>
              <h1 className="text-[2.1rem] sm:text-[2.8rem] md:text-[3.2rem] lg:text-[4rem] font-black leading-[1.05] mb-6 tracking-tight text-white">
                {locale === "en" ? (
                  <>
                    Forget boring{" "}
                    <span className="line-through text-gray-600 font-bold">textbooks</span>.<br />
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
              <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-md">
                {t("landing.heroSubtitle")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/auth"
                  className="px-7 py-3.5 font-semibold rounded-full text-white transition-all hover:scale-[1.03] active:scale-95"
                  style={{ background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)", boxShadow: "0 4px 20px rgba(69,97,232,0.45), 0 1px 0 rgba(255,255,255,0.2) inset" }}>
                  {t("landing.heroCtaStart")}
                </Link>
                <DemoScrollButton />
              </div>
            </div>

            <div id="demo" className="flex flex-col gap-4">
              <DemoChat />
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
            </div>
          </div>

          {/* Floating questions — Russian only */}
          {locale === "ru" && (
            <div className="relative z-10 mt-20 max-w-4xl mx-auto px-4">
              <div className="mb-24 space-y-10">
                <p className="text-xl sm:text-2xl font-semibold text-white w-fit">Подожди, а почему именно 1941-й?</p>
                <p className="text-base sm:text-lg font-medium text-gray-400 w-fit ml-auto mr-[8%]">Это вообще базово знать или нет?</p>
                <p className="text-2xl sm:text-3xl font-bold text-white w-fit sm:ml-[14%]">Объясни ещё раз, другими словами.</p>
                <p className="text-base sm:text-xl font-medium text-gray-500 w-fit ml-[28%] sm:ml-[52%]">А зачем это вообще учить?</p>
              </div>
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
            </div>
          )}

          {/* English CTA mid-hero */}
          {locale === "en" && (
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
          )}
        </div>
      </section>

      {/* DARK BAND: STATS + FEATURES */}
      <div style={{ background: "#080d1a" }}>

        {/* STATS */}
        <section className="text-white pt-14 pb-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS_DATA.map((s) => (
              <div key={s.value} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${s.color}25`, color: s.color }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" dangerouslySetInnerHTML={{ __html: s.icon }} />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-sm text-gray-400 mt-0.5 leading-tight">{t(`stats.${s.key}`)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Thin divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* FEATURES */}
        <section className="text-white px-6 pt-16 pb-24">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold tracking-[0.22em] uppercase mb-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
              {t("landing.featuresLabel")}
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-3 leading-tight text-center text-white">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-center text-base mb-12 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              {t("landing.featuresSubtitle")}
            </p>
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
                  <div key={key}
                    className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.01]"
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
                );
              })}
            </div>
          </div>
        </section>

        {/* SVG Wave transition to light section */}
        <div aria-hidden style={{ display: "block", lineHeight: 0 }}>
          <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "72px" }}>
            <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z"
              style={{ fill: "var(--bg)" }} />
          </svg>
        </div>
      </div>

      {/* SUBJECTS */}
      {/* ── What's new ── */}
      <section className="max-w-6xl mx-auto px-6 pb-4">
        <a href="/auth" className="flex items-center gap-3 group rounded-2xl px-4 py-3 border transition-all hover:border-[#4561E8]/40"
          style={{ background: "linear-gradient(135deg, rgba(69,97,232,0.05), rgba(107,143,255,0.03))", borderColor: "rgba(69,97,232,0.15)" }}>
          <span className="text-2xl shrink-0">{LATEST.badge}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(69,97,232,0.12)", color: "#4561E8" }}>
                v{LATEST.version} · {t("landing.newBadge")}
              </span>
              <span className="text-xs font-semibold text-[var(--text)]">{LATEST.title}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{LATEST.description}</p>
          </div>
          <svg className="w-4 h-4 shrink-0 text-[var(--text-muted)] group-hover:text-[#4561E8] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </a>
      </section>

      <section id="subjects" className="max-w-6xl mx-auto px-6 py-16">
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
        <SubjectGrid subjects={subjects} />
      </section>

      {/* HOW TO LEARN */}
      <section className="max-w-6xl mx-auto px-6 py-16">
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
              <Link href="/guide" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-500 text-sm font-medium hover:underline">
                {t("landing.howLearnGuide")}
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
      </section>

      {/* ЕГЭ/ОГЭ COMING SOON — Russian only */}
      {locale === "ru" && (
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
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
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-20" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-6xl mx-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {STEP_NUMS.map((n, i) => (
              <div key={n} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] relative">
                {i === STEP_BADGE_IDX && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded">{t("landing.stepBadge")}</span>
                )}
                <div className="text-xs font-bold text-[var(--text-muted)] mb-3">{n}</div>
                <div className="font-semibold text-sm mb-1.5 text-[var(--text)]">{t(`steps.${n}.title`)}</div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{t(`steps.${n}.desc`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">{t("landing.testimonialsLabel")}</div>
        <h2 className="text-4xl font-bold mb-3 leading-tight">{t("landing.testimonialsTitle")}</h2>
        <p className="text-[var(--text-secondary)] mb-10 text-lg">{t("landing.testimonialsSub")}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => {
            const accentColors = ["#4561E8", "#FF7A00", "#10B981"];
            const accent = accentColors[i % accentColors.length];
            return (
              <div key={testimonial.name} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 dark:bg-[#04040c] text-white px-6 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 120%, #4561E840 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10">
          <p className="text-gray-500 text-xs font-semibold tracking-[0.2em] uppercase mb-8">{t("landing.ctaTagline")}</p>
          <h2 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight">
            {t("landing.ctaHero1")}<br />
            {locale === "en" ? (
              t("landing.ctaHero2")
            ) : (
              <>как тебе{" "}<span className="text-[#4561E8] italic">удобно.</span></>
            )}
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
            {t("landing.ctaLine1")}<br />
            {t("landing.ctaLine2")}
          </p>
          <Link href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all hover:scale-[1.03] active:scale-95 text-sm">
            {t("landing.ctaButton")}
          </Link>
          <p className="text-gray-600 text-xs mt-5">{t("landing.ctaNoCard")}</p>
        </div>
      </section>

      <footer className="py-8 border-t border-[var(--border)]" style={{ background: "var(--bg)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-4 text-xs text-[var(--text-muted)]">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <span>{t("landing.footerRights")}</span>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">{t("landing.footerPrivacy")}</Link>
              <Link href="/terms" className="hover:text-[var(--text)] transition-colors">{t("landing.footerTerms")}</Link>
            </div>
          </div>
          {locale === "ru" && (
            <p className="text-center" style={{ fontSize: "10px", opacity: 0.4, maxWidth: 480, lineHeight: 1.4 }}>
              Instagram — продукт компании Meta Platforms Inc. Деятельность организации Meta Platforms признана экстремистской и запрещена на территории Российской Федерации.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
