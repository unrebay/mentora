import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import BuyProButton from "@/components/BuyProButton";
import PricingFAQ from "@/components/PricingFAQ";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const FREE_FEATURES = [
  "1 предмет на выбор",
  "20 сообщений в день",
  "XP, уровни и достижения",
  "Стрик и прогресс",
  "Без регистрации",
];

const PRO_FEATURES = [
  "Все предметы без ограничений",
  "Безлимитные сообщения",
  "Полная карта знаний",
  "Аналитика прогресса",
  "Приоритетная поддержка",
];

const ULTRA_FEATURES = [
  "Всё из Pro",
  "Распознавание фото и задач",
  "Генерация презентаций по теме",
  "Аудио-разборы и объяснения",
  "Ранний доступ к новым функциям",
];

export const metadata = {
  title: "Тарифы — Mentora AI-репетитор",
  description:
    "Начни бесплатно — 20 сообщений в день без карты. Pro за 399 ₽/мес открывает все 13 предметов без лимита. Ultima добавляет фото, презентации и аудио.",
  keywords: ["тарифы AI репетитора", "стоимость репетитора онлайн", "Pro план Mentora", "Ultima"],
  alternates: { canonical: "https://mentora.su/pricing" },
  openGraph: {
    title: "Тарифы Mentora — от 0 ₽",
    description: "Бесплатно, Pro 399 ₽/мес или Ultima 799 ₽/мес. Без договоров — отмени в любой момент.",
    url: "https://mentora.su/pricing",
  },
};

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

  const Check = ({ dark }: { dark?: boolean }) => (
    <svg
      className="w-4 h-4 shrink-0 mt-0.5"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="8" cy="8" r="7" fill={dark ? "rgba(255,255,255,0.12)" : "rgba(69,97,232,0.12)"} />
      <path
        d="M5 8l2 2 4-4"
        stroke={dark ? "rgba(255,255,255,0.7)" : "#4561E8"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="min-h-screen s-page t-primary">

      {/* NAV */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b px-6 py-4"
        style={{ background: "var(--bg-nav)", borderColor: "var(--border-light)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm" fontSize="1.44rem" />
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "var(--text-secondary)" }}>
            <Link href="/#subjects" className="hover:opacity-70 transition-opacity">Предметы</Link>
            <Link href="/#how" className="hover:opacity-70 transition-opacity">Как работает</Link>
            <Link href="/pricing" className="font-medium" style={{ color: "var(--text)" }}>Тарифы</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth"
              className="btn-glow px-5 py-2.5 text-sm font-semibold rounded-xl text-white"
            >
              Попробовать бесплатно →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
          style={{
            background: "rgba(69,97,232,0.1)",
            color: "var(--brand)",
            border: "1px solid rgba(69,97,232,0.2)",
          }}
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
          Простые, честные тарифы
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
          Начни бесплатно.<br />
          Расти{" "}
          <span
            style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontStyle: "italic",
            }}
          >
            без ограничений.
          </span>
        </h1>
        <p className="text-lg t-muted max-w-lg mx-auto leading-relaxed">
          Бесплатный план без карты. Pro открывает все предметы. Ultima добавляет фото, презентации и аудио.
        </p>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-5xl mx-auto px-6 pb-8">
        <div className="grid md:grid-cols-3 gap-4 items-stretch">

          {/* FREE */}
          <div
            className="rounded-2xl p-7 flex flex-col border"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="mb-6">
              <p className="text-[11px] font-bold t-muted tracking-[0.15em] uppercase mb-4">Бесплатно</p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-bold tracking-tight t-primary">0 ₽</span>
              </div>
              <p className="text-sm t-muted mt-2">Навсегда · без карты</p>
            </div>
            <Link
              href="/auth"
              className="block text-center py-3 px-5 font-semibold rounded-xl transition-all duration-200 mb-8 text-sm border"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              Начать бесплатно
            </Link>
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm t-secondary">
                  <Check />{f}
                </li>
              ))}
            </ul>
          </div>

          {/* PRO — gradient border wrapper */}
          <div
            className="relative rounded-[17px] p-[1.5px] flex flex-col"
            style={{
              background: "linear-gradient(145deg, #6B8FFF, #4561E8 45%, #9F7AFF)",
              boxShadow: "0 8px 40px rgba(69,97,232,0.25), 0 2px 8px rgba(69,97,232,0.15)",
            }}
          >
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span
                className="text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase"
                style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)" }}
              >
                Популярный
              </span>
            </div>

            {/* Inner card */}
            <div
              className="rounded-2xl p-7 flex flex-col flex-1"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="mb-6">
                <p
                  className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
                  style={{ color: "var(--brand)" }}
                >
                  Pro
                </p>
                <div className="flex items-end gap-1.5">
                  <span className="text-5xl font-bold tracking-tight t-primary">399 ₽</span>
                  <span className="t-muted text-sm mb-2">/мес</span>
                </div>
                <div
                  className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2.5"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <span className="text-sm font-semibold t-secondary">2 990 ₽ / год</span>
                  <span className="t-muted text-xs">·</span>
                  <span className="text-xs t-muted">249 ₽/мес</span>
                  <span
                    className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-lg"
                    style={{
                      color: "#15803d",
                      background: "rgba(21,128,61,0.1)",
                    }}
                  >
                    −37%
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-7">
                <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} plan="monthly" />
                <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} plan="annual" />
              </div>
              <ul className="space-y-3 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm t-secondary">
                    <Check />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ULTRA — ambient glow dark card */}
          <div
            className="relative rounded-2xl p-7 flex flex-col overflow-hidden"
            style={{ background: "#060610" }}
          >
            {/* Ambient glow overlays */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(255,122,0,0.28) 0%, transparent 65%)",
              }}
            />
            <div
              className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)",
              }}
            />
            <div
              className="absolute top-1/2 right-8 w-32 h-32 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(69,97,232,0.18) 0%, transparent 70%)",
              }}
            />
            {/* Grain overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
                opacity: 0.035,
                mixBlendMode: "overlay",
              }}
            />

            {/* New badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span
                className="text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase"
                style={{
                  background: "linear-gradient(135deg, rgba(255,122,0,0.6), rgba(124,58,237,0.6))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                НОВИНКА
              </span>
            </div>

            <div className="mb-6 relative z-10">
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
                style={{
                  background: "linear-gradient(90deg, #FF7A00, #9F7AFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ULTRA
              </p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-bold tracking-tight text-white">799 ₽</span>
                <span className="text-gray-400 text-sm mb-2">/мес</span>
              </div>
              <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-sm font-semibold text-white/80">5 990 ₽ / год</span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-xs text-white/40">499 ₽/мес</span>
                <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-lg">−37%</span>
              </div>
            </div>
            <div className="space-y-2 mb-7 relative z-10">
              <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} isUltima={isUltima} plan="ultima_monthly" />
              <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} isUltima={isUltima} plan="ultima_annual" />
            </div>
            <ul className="space-y-3 flex-1 relative z-10">
              {ULTRA_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check dark />{f}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* STREAK PROMO */}
        <div
          className="mt-4 flex items-center gap-4 rounded-2xl px-6 py-4 border"
          style={{
            background: "linear-gradient(135deg, rgba(255,122,0,0.06) 0%, rgba(255,80,0,0.04) 100%)",
            borderColor: "rgba(255,122,0,0.2)",
          }}
        >
          {/* SVG Flame */}
          <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,122,0,0.12)" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"
                fill="url(#flameGrad)"
              />
              <path
                d="M12 14.5c0 1.105-.895 2-2 2s-2-.895-2-2c0-1.5 2-3 2-3s2 1.5 2 3z"
                fill="rgba(255,200,80,0.9)"
              />
              <defs>
                <linearGradient id="flameGrad" x1="12" y1="2" x2="12" y2="17" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF4500" />
                  <stop offset="100%" stopColor="#FF9800" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "rgba(180,80,0,1)" }}>
              Стрик 7 дней → 3 дня Pro бесплатно
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(200,100,20,0.8)" }}>
              Учись 7 дней подряд и получи 3 дня Pro без карты. Один раз на аккаунт.
            </p>
          </div>
        </div>

        {/* SCHOOL CALLOUT */}
        <div
          className="mt-4 border rounded-2xl px-7 py-6"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--text)" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4.243-3.172L12 20l4.243-2.828" />
                </svg>
              </div>
              <p className="font-bold t-primary">Учебный тариф</p>
            </div>
            <p className="flex-1 text-sm t-muted leading-relaxed">
              Особая версия Pro для школ и учебных заведений. Включает расширенную аналитику и мониторинг прогресса каждого ученика в реальном времени.
            </p>
            <a
              href="mailto:hello@mentora.su?subject=Учебный тариф"
              className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
              style={{
                background: "var(--text)",
                color: "var(--bg)",
              }}
            >
              Подключить школу →
            </a>
          </div>
        </div>

      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-20">
        <div className="text-center mb-10">
          <p
            className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3"
            style={{ color: "var(--brand)" }}
          >
            Поддержка
          </p>
          <h2 className="text-3xl font-bold tracking-tight t-primary">Часто спрашивают</h2>
        </div>
        <PricingFAQ />
      </section>

      {/* FOOTER CTA */}
      <section
        className="relative overflow-hidden py-24 px-6 text-center"
        style={{ background: "#04060f" }}
      >
        {/* Ambient glows */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(69,97,232,0.2) 0%, transparent 70%)",
            top: "-40px",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,122,0,0.08) 0%, transparent 65%)" }}
        />
        <div className="relative z-10">
          <p
            className="text-[11px] font-bold tracking-[0.2em] uppercase mb-6"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Твой персональный AI-ментор
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight leading-tight text-white">
            Начни там, где<br />
            <span
              style={{
                background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontStyle: "italic",
              }}
            >
              остановился.
            </span>
          </h2>
          <p className="mb-10 max-w-sm mx-auto text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Без подписки, без карты.<br />20 сообщений в день — бесплатно навсегда.
          </p>
          <Link
            href="/auth"
            className="btn-glow inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl text-base"
          >
            Создать аккаунт бесплатно →
          </Link>
          <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
            Без карты. Без обязательств.
          </p>
        </div>
      </section>

      <footer
        className="py-8 border-t"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      >
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm t-muted">
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:t-secondary transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="hover:t-secondary transition-colors">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
