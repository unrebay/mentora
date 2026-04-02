import Link from "next/link";
import Logo from "@/components/Logo";

const FREE_FEATURES = [
  "30 сообщений с ментором в день",
  "История России — 51 тема",
  "История мира (скоро)",
  "Персональный стиль обучения",
  "XP и уровни прогресса",
  "Стрик и статистика",
];

const PRO_FEATURES = [
  "Безлимитные сообщения",
  "Все предметы: история, математика, биология, английский и другие",
  "Приоритетный доступ к новым темам",
  "Расширенная история диалогов",
  "Поддержка в приоритете",
  "Скоро: мобильное приложение",
];

const FAQ = [
  {
    q: "Можно ли попробовать без оплаты?",
    a: "Да. Бесплатный план не требует карты — регистрируйся и начинай сразу. 30 сообщений в день хватит для полноценного урока.",
  },
  {
    q: "Что значит «безлимитные сообщения»?",
    a: "На Pro нет никаких ограничений на количество сообщений в день. Учись столько, сколько хочешь.",
  },
  {
    q: "Когда появятся новые предметы?",
    a: "Математика, биология и английский выйдут в первую очередь. Подписчики Pro получат доступ сразу при релизе.",
  },
  {
    q: "Как отменить подписку?",
    a: "В любой момент в настройках аккаунта — без звонков и объяснений. Деньги за текущий период не возвращаются.",
  },
];

export const metadata={title:"Тарифы",description:"Тарифы Mentora"};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm" fontSize="1.44rem" />
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <Link href="/#subjects" className="hover:text-gray-900 transition-colors">Предметы</Link>
            <Link href="/#how" className="hover:text-gray-900 transition-colors">Как работает</Link>
            <Link href="/pricing" className="text-gray-900 font-medium">Тарифы</Link>
          </div>
          <Link
            href="/auth"
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Попробовать бесплатно →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-600 text-xs font-semibold rounded-full mb-6">
          Простые, честные тарифы
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Начни бесплатно.<br />
          Расти <span className="text-brand-600 italic">без ограничений.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Бесплатный план даёт 30 сообщений в день — этого хватит для полноценного обучения. Pro снимает все лимиты и открывает все предметы.
        </p>
      </section>

      {/* PLANS */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free */}
          <div className="border border-gray-200 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Бесплатно</p>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-5xl font-bold tracking-tight">0 ₽</span>
                <span className="text-gray-400 text-sm mb-2">/месяц</span>
              </div>
              <p className="text-sm text-gray-500">Без карты. Навсегда бесплатно.</p>
            </div>

            <Link
              href="/auth"
              className="block text-center py-3 px-6 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors mb-8"
            >
              Начать бесплатно
            </Link>

            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative border-2 border-brand-600 rounded-2xl p-8 flex flex-col shadow-lg shadow-brand-100">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
                ПОПУЛЯРНЫЙ
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-2">Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold tracking-tight">499 ₽</span>
                <span className="text-gray-400 text-sm mb-2">/месяц</span>
              </div>
              <p className="text-sm text-gray-500">
                или <strong className="text-gray-700">3 990 ₽/год</strong> — экономия 34%
              </p>
            </div>

            <Link
              href="/auth"
              className="block text-center py-3 px-6 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors mb-8"
            >
              Попробовать Pro →
            </Link>

            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Streak reward callout */}
        <div className="max-w-3xl mx-auto mt-8 flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-2xl px-6 py-5">
          <div className="text-3xl shrink-0">🔥</div>
          <div>
            <p className="font-semibold text-orange-900 text-sm mb-1">Стрик 7 дней → 3 дня Pro бесплатно</p>
            <p className="text-xs text-orange-700 leading-relaxed">
              Учись 7 дней подряд — и получи 3 дня Pro без карты. Один раз на аккаунт. Это наш способ сказать «спасибо» за привычку.
            </p>
          </div>
        </div>

        {/* B2B note */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Нужна лицензия для школы или компании?{" "}
          <a href="mailto:hello@mentora.su" className="text-brand-600 hover:underline font-medium">
            Напишите нам
          </a>{" "}
          — обсудим корпоративный тариф.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Часто спрашивают</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="border border-gray-100 rounded-2xl p-6">
              <p className="font-semibold text-gray-900 mb-2">{q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">
            Начни учиться прямо сейчас
          </h2>
          <p className="text-gray-400 mb-8">
            Без подписки, без карты. 30 сообщений в день — бесплатно навсегда.
          </p>
          <Link
            href="/auth"
            className="inline-block px-8 py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-lg"
          >
            Создать аккаунт бесплатно →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-gray-100"><div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400"><span>© 2026 Mentora</span><div className="flex gap-6"><Link href="/privacy" className="hover:text-gray-700 transition-colors">Конфиденциальность</Link><Link href="/terms" className="hover:text-gray-700 transition-colors">Условия</Link></div></div></footer>
    </div>
  );
}
