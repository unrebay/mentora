import { getTranslations, getLocale, getMessages } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LandingNav from "@/components/LandingNav";
import BuyProButton from "@/components/BuyProButton";
import PricingFAQ from "@/components/PricingFAQ";
import TelegramSupportButton from "@/components/TelegramSupportButton";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const url = isEn ? "https://mentora.su/en/pricing" : "https://mentora.su/ru/pricing";
  return {
    title: isEn ? "Pricing — Mentora AI tutor" : "Тарифы — Mentora AI-репетитор",
    description: isEn
      ? "Start free — 10 messages per 8 hours, no card. Pro for ~$5/mo unlocks all 17 sciences with no limit. Ultra adds PDF summaries, priority, and extended memory."
      : "Начни бесплатно — 10 сообщений за 8 часов без карты. Pro за 499 ₽/мес открывает все 17 наук без лимита. Ultra добавляет PDF-конспекты, приоритет и расширенную память.",
    keywords: isEn
      ? ["AI tutor pricing", "online tutor cost", "Mentora Pro", "Ultra", "AI education price"]
      : ["тарифы AI репетитора", "стоимость репетитора онлайн", "Pro план Mentora", "Ultra", "AI обучение цена"],
    alternates: {
      canonical: url,
      languages: { ru: "https://mentora.su/ru/pricing", en: "https://mentora.su/en/pricing", "x-default": "https://mentora.su/ru/pricing" },
    },
    openGraph: {
      title: isEn ? "Mentora pricing — from $0" : "Тарифы Mentora — от 0 ₽",
      description: isEn
        ? "Free, Pro $5/mo or Ultra $9/mo. No contracts — cancel anytime."
        : "Бесплатно, Pro 499 ₽/мес или Ultra 799 ₽/мес. Без договоров — отмени в любой момент.",
      url,
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: isEn ? "Mentora pricing — from $0" : "Тарифы Mentora — от 0 ₽",
      description: isEn
        ? "AI tutor across 17 sciences. Free / Pro / Ultra. Start without a card."
        : "AI-репетитор по 17 наукам. Free / Pro / Ultra. Начни без карты.",
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function PricingPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  let isPro = false;
  let isUltima = false;
  if (user) {
    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    isUltima = profile?.plan === "ultima";
    isPro = isUltima || profile?.plan === "pro";
  }

  const locale = await getLocale();
  const t = await getTranslations();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = await getMessages() as any;
  const pricingMsg = messages.pricing;
  const freeFeatures: string[] = pricingMsg.free.features;
  const proFeatures: string[] = pricingMsg.pro.features;
  const ultraFeatures: string[] = pricingMsg.ultra.features;

  const Check = () => (
    <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="rgba(107,143,255,0.15)" />
      <path d="M5 8l2 2 4-4" stroke="#6B8FFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="min-h-screen" style={{ background: "#04060f", color: "#fff" }}>

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute" style={{
          top: "-15%", left: "20%", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(69,97,232,0.18) 0%, transparent 65%)",
          filter: "blur(40px)",
        }} />
        <div className="absolute" style={{
          top: "40%", right: "-10%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(159,122,255,0.12) 0%, transparent 65%)",
          filter: "blur(50px)",
        }} />
        <div className="absolute" style={{
          bottom: "10%", left: "-5%", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,122,0,0.07) 0%, transparent 65%)",
          filter: "blur(40px)",
        }} />
      </div>

      {/* NAV */}
      <div className="relative z-10">
        <LandingNav isLoggedIn={isLoggedIn} activePage="pricing" />
      </div>

      {/* HERO */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
          style={{ background: "rgba(69,97,232,0.15)", border: "1px solid rgba(69,97,232,0.25)", color: "rgba(107,143,255,0.9)" }}>
          {t("pricing.faqLabel")}
        </div>
        {/* Decorative orbital ring */}
        <div className="absolute pointer-events-none hidden md:block" aria-hidden style={{
          top: 60, right: "10%", width: 220, height: 220,
          borderRadius: "50%",
          background: "conic-gradient(from 90deg, transparent 0deg, rgba(124,58,237,0.18) 90deg, transparent 180deg, rgba(69,97,232,0.14) 270deg, transparent 360deg)",
          filter: "blur(24px)", opacity: 0.7, zIndex: 1,
        }} />
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1] relative z-10" style={{
          background: "linear-gradient(135deg, #ffffff 30%, #B4C7FF 70%, #C9B5FF 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {t("pricing.hero.title")}<br />
          <span style={{
            background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontStyle: "italic",
          }}>
            {t("pricing.hero.titleGradient")}
          </span>
        </h1>
        <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
          {t("pricing.hero.subtitle")}
        </p>
      </section>

      {/* PROMO BANNER — Russian only */}
      {locale === "ru" && (
        <section className="relative z-10 max-w-5xl mx-auto px-6 pb-6">
          <div className="relative overflow-hidden rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(69,97,232,0.18) 0%, rgba(159,122,255,0.12) 100%)",
              border: "1px solid rgba(107,143,255,0.2)",
              backdropFilter: "blur(12px)",
            }}>
            <div className="absolute -top-6 left-8 w-32 h-16 rounded-full pointer-events-none"
              style={{ background: "rgba(69,97,232,0.18)", filter: "blur(24px)" }} />
            <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.15)" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#f59e0b" />
              </svg>
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <span className="font-bold text-sm text-white">Только до 1 июня —</span>{" "}
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                при покупке годового плана <strong style={{ color: "#9BB4FF" }}>+3 месяца в подарок</strong>.
                Платишь за 12 месяцев — пользуешься 15.
              </span>
            </div>
            <div className="relative z-10 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(107,143,255,0.2)", border: "1px solid rgba(107,143,255,0.3)", color: "#9BB4FF" }}>
                <svg viewBox="0 0 12 12" width="9" height="9" fill="currentColor">
                  <circle cx="6" cy="6" r="2.5" />
                  <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                </svg>
                Успей до 1 июня
              </span>
            </div>
          </div>
        </section>
      )}

      {/* PRICING CARDS */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-8">
        <div className="grid md:grid-cols-3 gap-6 md:gap-4 items-stretch">

          {/* FREE */}
          <div data-tilt data-tilt-strength="4" className="rounded-2xl p-7 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
            }}>
            <div className="mb-6">
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>{t("pricing.free.name")}</p>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">{t("pricing.free.price")}</span>
              </div>
              <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>{t("pricing.freeDesc")}</p>
            </div>
            <Link
              href="/auth"
              className="block text-center py-3 px-5 font-semibold rounded-xl transition-all duration-200 mb-8 text-sm"
              style={{
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {t("pricing.free.cta")}
            </Link>
            <ul className="space-y-3 flex-1">
              {freeFeatures.map((f: string) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <Check />{f}
                </li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div data-tilt data-tilt-strength="4" className="relative rounded-[17px] p-[1.5px] flex flex-col mt-3 md:mt-0"
            style={{
              background: "linear-gradient(145deg, #6B8FFF, #4561E8 45%, #9F7AFF)",
              boxShadow: "0 8px 48px rgba(69,97,232,0.35), 0 2px 8px rgba(69,97,232,0.2)",
            }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase"
                style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)" }}>
                {t("pricing.pro.badge")}
              </span>
            </div>
            <div className="rounded-2xl p-7 flex flex-col flex-1" style={{ background: "#080d1e" }}>
              <div className="mb-6">
                <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4" style={{ color: "#6B8FFF" }}>
                  {t("pricing.pro.name")}
                </p>
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">{t("pricing.pro.price")}</span>
                  <span className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{t("pricing.pro.period")}</span>
                </div>
                {locale === "ru" && (
                  <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-sm font-semibold text-white/80">2 990 ₽ / год</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-xs text-white/40">249 ₽/мес</span>
                    <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-lg">−37%</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 mb-7">
                <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} plan="monthly" />
                <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} plan="annual" />
              </div>
              <ul className="space-y-3 flex-1">
                {proFeatures.map((f: string) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <Check />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ULTRA — outer wrapper without overflow-hidden so НОВИНКА pill is visible */}
          <div data-tilt data-tilt-strength="4" className="relative flex flex-col mt-3 md:mt-0">
            {/* НОВИНКА pill — lives on outer wrapper, never clipped */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
              <span className="text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase"
                style={{
                  background: "linear-gradient(135deg, rgba(255,122,0,0.75), rgba(124,58,237,0.75))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 2px 12px rgba(255,122,0,0.25)",
                }}>
                {t("common.new").toUpperCase()}
              </span>
            </div>
            {/* Inner card — overflow-hidden only here to clip decorative blobs */}
            <div className="relative rounded-2xl p-7 flex flex-col flex-1 overflow-hidden"
              style={{ background: "#060610" }}>
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,122,0,0.28) 0%, transparent 65%)" }} />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)" }} />
              <div className="absolute top-1/2 right-8 w-32 h-32 -translate-y-1/2 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(69,97,232,0.18) 0%, transparent 70%)" }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
                  opacity: 0.035, mixBlendMode: "overlay",
                }} />
              <div className="mb-6 relative z-10">
                <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
                  style={{ background: "linear-gradient(90deg, #FF7A00, #9F7AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {t("pricing.ultra.name")}
                </p>
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">{t("pricing.ultra.price")}</span>
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
                <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} isUltima={isUltima} plan="ultima_monthly" />
                <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} isUltima={isUltima} plan="ultima_annual" />
              </div>
              <ul className="space-y-3 flex-1 relative z-10">
                {ultraFeatures.map((label: string, i: number) => {
                  const isSoon = locale === "ru" ? (i === 2 || i === 3) : false;
                  return (
                    <li key={label} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check />
                      <span className="flex items-center gap-2 flex-wrap">
                        {label}
                        {isSoon && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
                              style={{ background: "rgba(255,122,0,0.18)", color: "#FF9A3C", border: "1px solid rgba(255,122,0,0.25)" }}>
                              {t("pricing.soon")}
                            </span>
                            {/* 8-pointed star asterisk */}
                            <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden style={{ flexShrink: 0 }}>
                              <path d="M6 0.5L7.1 4.1L10.5 2.5L8.9 5.9L12.5 6L8.9 6.1L10.5 9.5L7.1 7.9L6 11.5L4.9 7.9L1.5 9.5L3.1 6.1L-0.5 6L3.1 5.9L1.5 2.5L4.9 4.1Z"
                                fill="#FF9A3C" opacity="0.75" />
                            </svg>
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {/* Ultra dev disclaimer */}
              {locale === "ru" && (
                <p className="mt-5 text-[10px] text-white/30 leading-relaxed relative z-10">
                  <svg viewBox="0 0 12 12" width="8" height="8" style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }}>
                    <path d="M6 0.5L7.1 4.1L10.5 2.5L8.9 5.9L12.5 6L8.9 6.1L10.5 9.5L7.1 7.9L6 11.5L4.9 7.9L1.5 9.5L3.1 6.1L-0.5 6L3.1 5.9L1.5 2.5L4.9 4.1Z"
                      fill="currentColor" />
                  </svg>
                  Отмечено «скоро» — функции в активной разработке, появятся в ближайшие месяцы.
                </p>
              )}
            </div>
          </div>

        </div>


        {/* COMPARISON TABLE — Russian only */}
        {locale === "ru" && (
          <div className="mt-8 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0" style={{
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
          }}>
            <div className="rounded-2xl overflow-hidden" style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(16px)",
              minWidth: 480,
            }}>
              {/* Table header */}
              <div className="grid grid-cols-4 px-5 py-3 text-xs font-bold tracking-widest uppercase"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
                <div className="col-span-2">Возможности</div>
                <div className="text-center">Pro</div>
                <div className="text-center">Ultra</div>
              </div>
              {[
                { label: "Все 17 наук", free: true,  pro: true,  ultra: true  },
                { label: "Безлимитные сообщения", free: false, pro: true,  ultra: true  },
                { label: "Галактика знаний", free: false, pro: true,  ultra: true  },
                { label: "Аналитика прогресса", free: false, pro: true,  ultra: true  },
                { label: "PDF-конспекты по темам", free: false, pro: true,  ultra: true  },
                { label: "Распознавание фото", free: false, pro: false, ultra: true  },
                { label: "Генерация презентаций", free: false, pro: false, ultra: true  },
                { label: "Ранний доступ к фичам", free: false, pro: false, ultra: true  },
              ].map((row, i) => (
                <div key={row.label} className="grid grid-cols-4 px-5 py-3 text-sm items-center"
                  style={{
                    borderBottom: i < 7 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                  }}>
                  <div className="col-span-2" style={{ color: "rgba(255,255,255,0.6)" }}>{row.label}</div>
                  <div className="text-center">
                    {row.pro
                      ? <svg className="w-4 h-4 inline" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="rgba(107,143,255,0.15)" />
                          <path d="M5 8l2 2 4-4" stroke="#6B8FFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
                    }
                  </div>
                  <div className="text-center">
                    {row.ultra
                      ? <svg className="w-4 h-4 inline" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="rgba(255,122,0,0.12)" />
                          <path d="M5 8l2 2 4-4" stroke="#FF9A3C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STREAK PROMO — Russian only */}
        {locale === "ru" && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl px-6 py-4"
            style={{
              background: "linear-gradient(135deg, rgba(255,122,0,0.1) 0%, rgba(255,80,0,0.06) 100%)",
              border: "1px solid rgba(255,122,0,0.2)",
              backdropFilter: "blur(12px)",
            }}>
            <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,122,0,0.15)" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="url(#flameGrad2)" />
                <path d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z" fill="rgba(255,200,80,0.9)" />
                <defs>
                  <linearGradient id="flameGrad2" x1="12" y1="2" x2="12" y2="17" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF4500" />
                    <stop offset="100%" stopColor="#FF9800" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "rgba(255,160,60,1)" }}>Стрик 7 дней → 3 дня Pro бесплатно</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,140,40,0.65)" }}>
                Учись 7 дней подряд и получи 3 дня Pro без карты. Один раз на аккаунт.
              </p>
            </div>
          </div>
        )}

        {/* SCHOOL CALLOUT — Russian only */}
        {locale === "ru" && (
          <div className="mt-4 rounded-2xl px-7 py-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
            }}>
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(107,143,255,0.15)", border: "1px solid rgba(107,143,255,0.2)" }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#6B8FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4.243-3.172L12 20l4.243-2.828" />
                  </svg>
                </div>
                <p className="font-bold text-white">Учебный тариф</p>
              </div>
              <p className="flex-1 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Особая версия Pro для школ и учебных заведений. Включает расширенную аналитику и мониторинг прогресса каждого ученика в реальном времени.
              </p>
              <a href="mailto:hello@mentora.su?subject=Учебный тариф"
                className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap"
                style={{
                  background: "rgba(107,143,255,0.15)",
                  border: "1px solid rgba(107,143,255,0.25)",
                  color: "#9BB4FF",
                }}>
                Подключить школу <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginLeft: 2 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        )}

      </section>

      {/* FAQ — Russian only */}
      {locale === "ru" && (
        <section className="relative z-10 max-w-2xl mx-auto px-6 pt-16 pb-20">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: "rgba(107,143,255,0.7)" }}>
              {t("pricing.faqLabel")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white">{t("pricing.faqTitle")}</h2>
          </div>
          <PricingFAQ />
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{t("pricing.supportQuestion")}</p>
            <div className="flex gap-2 flex-wrap justify-center items-start">
              <TelegramSupportButton label="Написать в поддержку" />
            </div>
          </div>
        </section>
      )}

      {/* FOOTER CTA */}
      <section className="relative z-10 overflow-hidden py-24 px-6 text-center" style={{ background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(69,97,232,0.2) 0%, transparent 70%)", top: "-40px" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,122,0,0.08) 0%, transparent 65%)" }} />
        <div className="relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
            {t("pricing.footerCtaTagline")}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight leading-tight text-white">
            {t("pricing.footerCtaTitle1")}<br />
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontStyle: "italic",
            }}>
              {t("pricing.footerCtaTitle2")}
            </span>
          </h2>
          <p className="mb-10 max-w-sm mx-auto text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            {t("pricing.footerCtaSub1")}<br />{t("pricing.footerCtaSub2")}
          </p>
          <Link href="/auth" className="btn-glow inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl text-base">
            {t("pricing.footerCtaBtn")}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
            {t("landing.ctaNoCard")}
          </p>
        </div>
      </section>

      <footer className="relative z-10 py-8" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <span>{t("landing.footerRights")}</span>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:t-secondary transition-colors">{t("landing.footerPrivacy")}</Link>
              <Link href="/terms" className="hover:t-secondary transition-colors">{t("landing.footerTerms")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
