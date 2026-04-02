import Link from "next/link";
import DemoChat from "@/components/DemoChat";
import Logo from "@/components/Logo";

const SUBJECTS = [
  { id: "russian-history", emoji: "📜", title: "История России", desc: "51 тема · 5 уровней", live: true },
  { id: "world-history", emoji: "🌍", title: "История мира", desc: "60 тем · 5 уровней", live: true, comingSoon: true },
  { id: "math", emoji: "🧮", title: "Математика", desc: "Алгебра, геометрия", comingSoon: true },
  { id: "bio", emoji: "🌿", title: "Биология", desc: "Клетка до экосистем", comingSoon: true },
  { id: "english", emoji: "💬", title: "Английский", desc: "A1 — C2, разговорный", comingSoon: true },
  { id: "chemistry", emoji: "⚗️", title: "Химия", desc: "В разработке", comingSoon: true },
  { id: "physics", emoji: "⚡", title: "Физика", desc: "В разработке", comingSoon: true },
  { id: "suggest", emoji: "+", title: "Предложить тему", desc: "Голосуй за предмет", suggest: true },
];

const STEPS = [
  { n: "01", title: "Лендинг", desc: "Анимированный демо-диалог прямо на главной. Без регистрации — попробуй сейчас." },
  { n: "02", title: "Выбор предмета", desc: "Визуальные карточки с анимацией. Не список — галерея." },
  { n: "03", title: "Настройка ментора", desc: "3 вопроса: стиль общения, уровень, цель. Ментор сразу отвечает в выбранном тоне.", badge: true },
  { n: "04", title: "Первый урок", desc: "Начинается мгновенно. Регистрация предлагается чтобы сохранить прогресс." },
  { n: "05", title: "Профиль", desc: "XP, карта прогресса, стрик. Пользователь видит себя внутри системы." },
];

const STATS = [
  { value: "8+", label: "предметов в разработке" },
  { value: "90%", label: "точность ответов AI" },
  { value: "24/7", label: "доступен без VPN" },
  { value: "∞", label: "терпения у ментора" },
];

const TESTIMONIALS = [
  {
    name: "Алина Соколова",
    role: "Школьница, 10 класс",
    avatar: "А",
    avatarBg: "bg-pink-100 text-pink-600",
    text: "Готовлюсь к ЕГЭ по истории — Mentora объясняет лучше любого репетитора. Особенно нравится, что она помнит, что я уже прошла, и не повторяется.",
    stars: 5,
    xp: "⚡ 340 XP · 🔥 12 дней подряд",
  },
  {
    name: "Дмитрий Власов",
    role: "Студент, 2-й курс",
    avatar: "Д",
    avatarBg: "bg-blue-100 text-blue-600",
    text: "Думал, что история — это зубрёжка. Оказалось, можно просто разговаривать и всё запоминается само. Прошёл тему Смутного времени за один вечер.",
    stars: 5,
    xp: "⚡ 780 XP · 🔥 21 день подряд",
  },
  {
    name: "Марина Захарова",
    role: "Взрослый, учусь для себя",
    avatar: "М",
    avatarBg: "bg-green-100 text-green-600",
    text: "Всю жизнь хотела разобраться в истории России — читала книги, но засыпала. Здесь за 20 минут в диалоге узнаю больше, чем за час с учебником.",
    stars: 5,
    xp: "⚡ 520 XP · 🔥 8 дней подряд",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <Logo size="sm" fontSize="1.44rem" />
          <div className="hidden md:flex items-center justify-center gap-8 text-sm text-gray-500">
            <a href="#subjects" className="hover:text-gray-900 transition-colors">Предметы</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Как работает</a>
            <Link href="/pricing" className="hover:text-gray-900 transition-colors">Тарифы</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="px-4 py-2 text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors">
              Войти
            </Link>
            <Link
              href="/auth"
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
            >
              Попробовать бесплатно →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Уже доступно · История России и мира
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
              Забудь про{" "}
              <span className="line-through text-gray-300">скучные</span>{" "}
              учебники.<br />
              Учись в{" "}
              <span className="text-brand-600 italic">диалоге.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              AI-ментор, который знает твой уровень, помнит тебя и объясняет так, как тебе удобно. По истории, математике, биологии и многому другому.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="px-6 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors"
              >
                Начать учиться →
              </Link>
              <a
                href="#demo"
                className="px-6 py-3.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 transition-colors"
              >
                Посмотреть демо
              </a>
            </div>
          </div>

          {/* Live demo chat */}
          <div id="demo">
            <DemoChat />
          </div>
        </div>

        {/* CTA after demo */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-gray-100">
          <p className="text-gray-500 text-sm">Понравилось? Начни учиться бесплатно — без карты.</p>
          <Link
            href="/auth"
            className="px-6 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            Создать аккаунт →
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gray-900 text-white py-14 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.value}>
              <div className="text-4xl font-bold mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-3 text-xs font-semibold text-gray-400 tracking-widest uppercase">Библиотека знаний</div>
        <h2 className="text-4xl font-bold mb-10 leading-tight">
          Выбери, что хочешь<br />
          изучить <span className="text-brand-600 italic">сегодня</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map((s) => (
            <div
              key={s.id}
              className={`relative p-4 rounded-2xl border transition-all ${
                s.suggest
                  ? "border-dashed border-gray-200 text-gray-400 hover:border-gray-300 cursor-pointer flex flex-col items-center justify-center min-h-[100px]"
                  : s.comingSoon && !s.live
                  ? "bg-gray-50 border-gray-100 opacity-70"
                  : "bg-white border-gray-200 hover:border-brand-300 hover:shadow-md cursor-pointer"
              }`}
            >
              {s.live && (
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">LIVE</span>
              )}
              {!s.live && s.comingSoon && (
                <span className="absolute top-3 right-3 text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">СКОРО</span>
              )}
              {s.suggest ? (
                <div className="text-center">
                  <div className="text-2xl mb-1">+</div>
                  <div className="text-xs">{s.title}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
              ) : (
                <>
                  <div className="text-2xl mb-2">{s.emoji}</div>
                  <div className="font-semibold text-sm text-gray-900">{s.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-gray-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-3 text-xs font-semibold text-gray-400 tracking-widest uppercase">Как это работает</div>
          <h2 className="text-4xl font-bold mb-12 leading-tight">
            От первого клика<br />
            до <span className="text-brand-600 italic">реального знания</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white rounded-2xl p-5 border border-gray-100 relative">
                {s.badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">ВАУ</span>
                )}
                <div className="text-xs font-bold text-gray-300 mb-3">{s.n}</div>
                <div className="font-semibold text-sm mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-3 text-xs font-semibold text-gray-400 tracking-widest uppercase">Отзывы</div>
        <h2 className="text-4xl font-bold mb-3 leading-tight">
          Уже учатся с Mentora
        </h2>
        <p className="text-gray-400 mb-10 text-lg">Реальные результаты реальных учеников</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
              {/* XP badge */}
              <div className="text-xs font-medium text-gray-400">{t.xp}</div>
              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${t.avatarBg}`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Social proof bar */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">4.9 / 5</div>
            <div className="text-sm text-gray-400 mt-1">средняя оценка</div>
          </div>
          <div className="w-px bg-gray-100 hidden md:block" />
          <div>
            <div className="text-3xl font-bold text-gray-900">51</div>
            <div className="text-sm text-gray-400 mt-1">тема по истории России</div>
          </div>
          <div className="w-px bg-gray-100 hidden md:block" />
          <div>
            <div className="text-3xl font-bold text-gray-900">0 ₽</div>
            <div className="text-sm text-gray-400 mt-1">чтобы начать</div>
          </div>
          <div className="w-px bg-gray-100 hidden md:block" />
          <div>
            <div className="text-3xl font-bold text-gray-900">🔥</div>
            <div className="text-sm text-gray-400 mt-1">стрик с первого дня</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white px-6 py-16 text-center">
        <h2 className="text-4xl font-bold mb-2">Начни прямо сейчас.</h2>
        <p className="text-3xl font-bold text-brand-400 italic mb-4">Регистрация не нужна.</p>
        <p className="text-gray-400 mb-8">Первые уроки — бесплатно. Навсегда.</p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm"
        >
          Начать учиться →
        </Link>
      </section>

      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Условия использования</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
