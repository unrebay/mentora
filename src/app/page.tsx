import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import Link from "next/link";
import DemoChat from "@/components/DemoChat";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import ParticleHero from "@/components/ParticleHero";
import ThemeToggle from "@/components/ThemeToggle";

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
  { n: "05", title: "Профиль", desc: "Менты, карта прогресса, стрик. Пользователь видит себя внутри системы." },
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
    avatarBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    text: "Готовлюсь к ЕГЭ по истории — Mentora объясняет лучше любого репетитора. Особенно нравится, что она помнит, что я уже прошла, и не повторяется.",
    stars: 5,
    xp: "⚡ 340 ментов · 🔥 12 дней подряд",
  },
  {
    name: "Дмитрий Власов",
    role: "Студент, 2-й курс",
    avatar: "Д",
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    text: "Думал, что история — это зубрёжка. Оказалось, можно просто разговаривать и всё запоминается само. Прошёл тему Смутного времени за один вечер.",
    stars: 5,
    xp: "⚡ 780 ментов · 🔥 21 день подряд",
  },
  {
    name: "Марина Захарова",
    role: "Взрослый, учусь для себя",
    avatar: "М",
    avatarBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    text: "Всю жизнь хотела разобраться в истории России — читала книги, но засыпала. Здесь за 20 минут в диалоге узнаю больше, чем за час с учебником.",
    stars: 5,
    xp: "⚡ 520 ментов · 🔥 8 дней подряд",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)]"
        style={{ background: "var(--bg-nav)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
          <Logo size="sm" fontSize="1.44rem" />
          <div className="hidden md:flex items-center justify-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#subjects" className="hover:text-[var(--text)] transition-colors">Предметы</a>
            <a href="#how" className="hover:text-[var(--text)] transition-colors">Как работает</a>
            <Link href="/pricing" className="hover:text-[var(--text)] transition-colors">Тарифы</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <>
              <Link href="/auth"
                className="px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:text-[var(--text)] transition-colors">
                Войти
              </Link>
              <Link href="/auth"
                className="px-5 py-2.5 bg-brand-600 dark:bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors">
                Попробовать бесплатно →
              </Link>
            </>
          </div>
        </div>
      </nav>

      {/* HERO — with particle background */}
      <section className="relative overflow-hidden max-w-6xl mx-auto px-6 pt-16 pb-12">
        {/* Particle layer — behind content, screen blend */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <ParticleHero />
        </div>

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Уже доступно · История России и мира
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
              Забудь про{" "}
              <span className="line-through text-[var(--text-muted)]">скучные</span>{" "}
              учебники.<br />
              Учись в{" "}
              <span className="text-brand-600 dark:text-brand-500 italic">диалоге.</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
              AI-ментор, который знает твой уровень, помнит тебя и объясняет так, как тебе удобно. По истории, математике, биологии и многому другому.
            </p>
            <div className="flex justify-end mb-8 mt-1">
              <p className="text-sm text-[var(--text-muted)] italic text-right leading-relaxed max-w-[260px]">
                Задай вопрос, который ты<br />
                не решаешься{" "}
                <span className="text-brand-600 dark:text-brand-500 not-italic font-medium">произнести вслух</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth"
                className="px-6 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors">
                Начать учиться →
              </Link>
              <a href="#demo"
                className="px-6 py-3.5 border border-[var(--border)] text-[var(--text-secondary)] font-medium rounded-xl hover:border-brand-300 transition-colors">
                Посмотреть демо
              </a>
            </div>
          </div>
          <div id="demo">
            <DemoChat />
          </div>
        </div>

        {/* Floating questions */}
        <div className="relative z-10 mt-20 max-w-4xl mx-auto px-4">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] tracking-[0.2em] uppercase mb-16 text-center">Например, вот так</p>
          <div className="mb-24 space-y-10">
            <p className="text-2xl font-semibold text-[var(--text)] w-fit">Подожди, а почему именно 1941-й?</p>
            <p className="text-lg font-medium text-[var(--text-secondary)] w-fit ml-auto mr-[8%]">Это вообще базово знать или нет?</p>
            <p className="text-3xl font-bold text-[var(--text)] w-fit ml-[14%]">Объясни ещё раз, другими словами.</p>
            <p className="text-xl font-medium text-[var(--text-muted)] w-fit ml-[52%]">А зачем это вообще учить?</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[var(--text)] mb-1">Учитель объясняет классу.</p>
            <p className="text-2xl font-semibold text-brand-600 dark:text-brand-500 mb-12">Mentora — только тебе.</p>
            <Link href="/auth"
              className="inline-flex px-7 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors">
              Начать бесплатно →
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gray-900 dark:bg-[#0a0a18] text-white py-14 px-6 border-y border-white/5">
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
        <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">Библиотека знаний</div>
        <h2 className="text-4xl font-bold mb-10 leading-tight">
          Выбери, что хочешь<br />
          изучить <span className="text-brand-600 dark:text-brand-500 italic">сегодня</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map((s) => (
            <div key={s.id}
              className={`relative p-4 rounded-2xl border transition-all ${
                s.suggest
                  ? "border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-brand-300 cursor-pointer flex flex-col items-center justify-center min-h-[100px]"
                  : s.comingSoon && !s.live
                  ? "bg-[var(--bg-secondary)] border-[var(--border)] opacity-70"
                  : "bg-[var(--bg-card)] border-[var(--border)] hover:border-brand-300 hover:shadow-md cursor-pointer"
              }`}>
              {s.live && (
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-md">LIVE</span>
              )}
              {!s.live && s.comingSoon && (
                <span className="absolute top-3 right-3 text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md">СКОРО</span>
              )}
              {s.suggest ? (
                <div className="text-center">
                  <div className="text-2xl mb-1">+</div>
                  <div className="text-xs">{s.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{s.desc}</div>
                </div>
              ) : (
                <>
                  <div className="text-2xl mb-2">{s.emoji}</div>
                  <div className="font-semibold text-sm text-[var(--text)]">{s.title}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{s.desc}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-20" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">Как это работает</div>
          <h2 className="text-4xl font-bold mb-12 leading-tight">
            От первого клика<br />
            до <span className="text-brand-600 dark:text-brand-500 italic">реального знания</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] relative">
                {s.badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded">ВАУ</span>
                )}
                <div className="text-xs font-bold text-[var(--text-muted)] mb-3">{s.n}</div>
                <div className="font-semibold text-sm mb-1 text-[var(--text)]">{s.title}</div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">Отзывы</div>
        <h2 className="text-4xl font-bold mb-3 leading-tight">Уже учатся с Mentora</h2>
        <p className="text-[var(--text-secondary)] mb-10 text-lg">Реальные результаты реальных учеников</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
              <div className="text-xs font-medium text-[var(--text-muted)]">{t.xp}</div>
              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-light)]">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${t.avatarBg}`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">{t.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          {[
            { v: "4.9 / 5", l: "средняя оценка" },
            { v: "51", l: "тема по истории России" },
            { v: "0 ₽", l: "чтобы начать" },
            { v: "🔥", l: "стрик с первого дня" },
          ].map(({ v, l }) => (
            <div key={l}>
              <div className="text-3xl font-bold text-[var(--text)]">{v}</div>
              <div className="text-sm text-[var(--text-secondary)] mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 dark:bg-[#04040c] text-white px-6 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 120%, #4561E840 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10">
          <p className="text-gray-500 text-xs font-semibold tracking-[0.2em] uppercase mb-8">Твой персональный AI-ментор</p>
          <h2 className="text-5xl font-bold mb-5 leading-tight">
            Учись так,<br />
            как тебе{" "}
            <span className="text-brand-400 italic">удобно.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
            В своём темпе. Задавай любые вопросы.<br />
            Твои вопросы видишь только ты.
          </p>
          <Link href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">
            Начать бесплатно →
          </Link>
          <p className="text-gray-600 text-xs mt-5">Без карты. Без обязательств.</p>
        </div>
      </section>

      <footer className="py-8 border-t border-[var(--border)]" style={{ background: "var(--bg)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Условия использования</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
