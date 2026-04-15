import Link from "next/link";
import Logo from "@/components/Logo";
import BuyProButton from "@/components/BuyProButton";
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

const ULTIMA_FEATURES = [
  "Всё из Pro",
  "Распознавание фото и задач",
  "Генерация презентаций по теме",
  "Аудио-разборы и объяснения",
  "Ранний доступ к новым функциям",
];

const FAQ = [
  { q: "Можно ли попробовать без оплаты?",
    a: "Да. Бесплатный план не требует карты — регистрируйся и начинай сразу. Даже без аккаунта можно попробовать демо-чат на главной." },
  { q: "Что значит «безлимитные сообщения»?",
    a: "На Pro нет ограничений на количество сообщений в день. Учись столько, сколько хочешь." },
  { q: "Когда появятся новые предметы?",
    a: "Математика, биология и английский выйдут в первую очередь. Подписчики Pro получат доступ сразу при релизе." },
  { q: "Как работает Ultima?",
    a: "Ultima добавляет к Pro три новые возможности: сфотографируй задачу — Mentora объяснит решение, создай презентацию по любой теме, получи аудио-разбор сложного раздела." },
  { q: "Как отменить подписку?",
    a: "В любой момент в настройках аккаунта — без звонков и объяснений." },
];

export const metadata = {
  title: "Тарифы — Mentora AI-репетитор",
  description: "Начни бесплатно — 20 сообщений в день без карты. Pro за 399 ₽/мес снимает все лимиты. Ultima открывает фото, презентации и аудио.",
  alternates: { canonical: "https://mentora.su/pricing" },
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

  const Check = ({ color }: { color: "gray" | "brand" | "white" }) => (
    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${
      color === "gray" ? "text-gray-400" :
      color === "brand" ? "text-brand-500" :
      "text-white/60"
    }`} viewBox="0 0 16 16" fill="currentColor">
      <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/>
    </svg>
  );

  return (
    <div className="min-h-screen s-page t-primary">

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b px-6 py-4" style={{background:"var(--bg-nav)",borderColor:"var(--border-light)"}}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm" fontSize="1.44rem" />
          <div className="hidden md:flex items-center gap-8 text-sm t-secondary">
            <Link href="/#subjects" className="hover:t-primary transition-colors">Предметы</Link>
            <Link href="/#how" className="hover:t-primary transition-colors">Как работает</Link>
            <Link href="/pricing" className="t-primary font-medium">Тарифы</Link>
          </div>
          <Link href="/auth" className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{background:"var(--text)",color:"var(--bg)"}}>
            Попробовать бесплатно →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-600 text-xs font-semibold rounded-full mb-8 tracking-widest uppercase">
          Простые, честные тарифы
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
          Начни бесплатно.<br />
          Расти{" "}
          <span className="text-brand-600 italic">без ограничений.</span>
        </h1>
        <p className="text-lg t-muted max-w-lg mx-auto leading-relaxed">
          Бесплатный план без карты. Pro открывает все предметы. Ultima добавляет фото, презентации и аудио.
        </p>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-5xl mx-auto px-6 pb-8">
        <div className="grid md:grid-cols-3 gap-4 items-stretch">

          {/* FREE */}
          <div className="s-raised border rounded-2xl p-7 flex flex-col" style={{borderColor:"var(--border)"}}>
            <div className="mb-6">
              <p className="text-[11px] font-bold t-muted tracking-[0.15em] uppercase mb-4">Бесплатно</p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-bold tracking-tight t-primary">0 ₽</span>
              </div>
              <p className="text-sm t-muted mt-2">Навсегда · без карты</p>
            </div>
            <Link href="/auth" className="block text-center py-3 px-5 border t-secondary font-semibold rounded-xl hover:s-input transition-colors mb-8 text-sm" style={{borderColor:"var(--border)"}}>
              Начать бесплатно
            </Link>
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm t-secondary">
                  <Check color="gray" />{f}
                </li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div className="relative s-raised border-2 border-brand-500 rounded-2xl p-7 flex flex-col shadow-xl shadow-brand-100/20 dark:shadow-brand-900/20">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-brand-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">Популярный</span>
            </div>
            <div className="mb-6">
              <p className="text-[11px] font-bold text-brand-500 tracking-[0.15em] uppercase mb-4">Pro</p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-bold tracking-tight">399 ₽</span>
                <span className="t-muted text-sm mb-2">/мес</span>
              </div>
              <div className="flex items-center gap-2 mt-3 s-input rounded-xl px-3 py-2.5">
                <span className="text-sm font-semibold t-secondary">2 990 ₽ / год</span>
                <span className="t-muted text-xs">·</span>
                <span className="text-xs t-muted">249 ₽/мес</span>
                <span className="ml-auto text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">−37%</span>
              </div>
            </div>
            <div className="space-y-2 mb-7">
              <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} plan="monthly" />
              <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} plan="annual" />
            </div>
            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm t-secondary">
                  <Check color="brand" />{f}
                </li>
              ))}
            </ul>
          </div>

          {/* ULTIMA */}
          <div className="relative bg-gray-900 rounded-2xl p-7 flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-gray-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">Новинка</span>
            </div>
            <div className="mb-6">
              <p className="text-[11px] font-bold text-gray-400 tracking-[0.15em] uppercase mb-4">Ultima</p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-bold tracking-tight text-white">799 ₽</span>
                <span className="text-gray-400 text-sm mb-2">/мес</span>
              </div>
              <div className="flex items-center gap-2 mt-3 bg-white/5 rounded-xl px-3 py-2.5">
                <span className="text-sm font-semibold text-white/80">5 990 ₽ / год</span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-xs text-white/40">499 ₽/мес</span>
                <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-lg">−37%</span>
              </div>
            </div>
            <div className="space-y-2 mb-7">
              <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} isUltima={isUltima} plan="ultima_monthly" />
              <BuyProButton isLoggedIn={isLoggedIn} isPro={isPro} isUltima={isUltima} plan="ultima_annual" />
            </div>
            <ul className="space-y-3 flex-1">
              {ULTIMA_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check color="white" />{f}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* STREAK PROMO */}
        <div className="mt-4 flex items-center gap-4 bg-orange-50 border border-orange-100 rounded-2xl px-6 py-4">
          <span className="text-2xl shrink-0">🔥</span>
          <div>
            <p className="font-semibold text-orange-900 text-sm">Стрик 7 дней → 3 дня Pro бесплатно</p>
            <p className="text-xs text-orange-500 mt-0.5">Учись 7 дней подряд и получи 3 дня Pro без карты. Один раз на аккаунт.</p>
          </div>
        </div>

        {/* SCHOOL CALLOUT */}
        <div className="mt-4 border s-raised rounded-2xl px-7 py-6" style={{borderColor:"var(--border)"}}>
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4.243-3.172L12 20l4.243-2.828" />
                </svg>
              </div>
              <p className="font-bold text-gray-900">Учебный тариф</p>
            </div>
            <p className="flex-1 text-sm text-gray-500 leading-relaxed">
              Особая версия Pro для школ и учебных заведений. Подключается по числовому коду после договора. Включает расширенную аналитику и мониторинг прогресса каждого ученика в реальном времени.
            </p>
            <a href="mailto:hello@mentora.su?subject=Учебный тариф"
              className="shrink-0 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors whitespace-nowrap">
              Подключить школу →
            </a>
          </div>
        </div>

      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pt-12 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10 tracking-tight">Часто спрашивают</h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
              <p className="font-semibold text-gray-900 mb-2 text-sm">{q}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-gray-900 text-white py-20 px-6 text-center">
        <p className="text-gray-500 text-[11px] font-bold tracking-[0.2em] uppercase mb-6">Твой персональный AI-ментор</p>
        <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
          Начни там, где<br />
          <span className="text-brand-400 italic">остановился.</span>
        </h2>
        <p className="text-gray-400 mb-10 max-w-sm mx-auto text-base leading-relaxed">
          Без подписки, без карты.<br />20 сообщений в день — бесплатно навсегда.
        </p>
        <Link href="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
          Создать аккаунт бесплатно →
        </Link>
        <p className="text-gray-600 text-xs mt-5">Без карты. Без обязательств.</p>
      </section>

      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
