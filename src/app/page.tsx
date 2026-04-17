import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import DemoChat from "@/components/DemoChat";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import NeuralNetworkCanvas from "@/components/NeuralNetworkCanvas";
import SphereBlobScene, { SUBTLE_SPHERES } from "@/components/SphereBlobScene";
import ThemeToggle from "@/components/ThemeToggle";
import SubjectGrid from "@/components/SubjectGrid";

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

const SUBJECTS = [
  { id: "russian-history", emoji: "🏰", title: "История России", desc: "51 тема · 5 уровней", live: true },
  { id: "world-history", emoji: "🌍", title: "Всемирная история", desc: "60 тем · 5 уровней", live: true },
  { id: "mathematics", emoji: "📐", title: "Математика", desc: "Алгебра, геометрия, анализ", live: true },
  { id: "physics", emoji: "⚡", title: "Физика", desc: "Механика до квантового мира", live: true },
  { id: "chemistry", emoji: "🧪", title: "Химия", desc: "Вещества, реакции, законы", live: true },
  { id: "biology", emoji: "🧬", title: "Биология", desc: "Клетка до экосистем", live: true },
  { id: "russian-language", emoji: "📝", title: "Русский язык", desc: "Грамматика и орфография", live: true },
  { id: "literature", emoji: "📚", title: "Литература", desc: "Классика и современная проза", live: true },
  { id: "english", emoji: "🇬🇧", title: "Английский язык", desc: "A1 — C2, разговорный", live: true },
  { id: "social-studies", emoji: "🏛️", title: "Обществознание", desc: "Право, экономика, социология", live: true },
  { id: "geography", emoji: "🗺️", title: "География", desc: "Природа, страны, климат", live: true },
  { id: "computer-science", emoji: "💻", title: "Информатика", desc: "Алгоритмы, программирование", live: true },
  { id: "astronomy", emoji: "🔭", title: "Астрономия", desc: "Звёзды, планеты, вселенная", live: true },
  { id: "discovery", emoji: "🌐", title: "Кругозор", desc: "Факты, открытия, феномены", live: true },
  { id: "suggest", emoji: "+", title: "Предложить тему", desc: "Голосуй за предмет", suggest: true },
];

const STEPS = [
  { n: "01", title: "Лендинг", desc: "Анимированный демо-диалог прямо на главной. Без регистрации — попробуй сейчас." },
  { n: "02", title: "Выбор предмета", desc: "Визуальные карточки. Не список — галерея." },
  { n: "03", title: "Настройка ментора", desc: "3 вопроса: стиль общения, уровень, цель. Ментор сразу отвечает в выбранном тоне.", badge: true },
  { n: "04", title: "Первый урок", desc: "Начинается мгновенно. Регистрация предлагается чтобы сохранить прогресс." },
  { n: "05", title: "Профиль", desc: "Менты, карта прогресса, стрик. Пользователь видит себя внутри системы." },
];

const STATS = [
  { value: "13", label: "предметов уже доступны", color: "#4561E8", icon: `<path d="M4 19V5a2 2 0 0 1 2-2h14M4 19a2 2 0 0 0 2 2h14M4 19V9l8-4 8 4v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>` },
  { value: "90%", label: "точность ответов AI", color: "#10B981", icon: `<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>` },
  { value: "24/7", label: "доступен без VPN", color: "#FF7A00", icon: `<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>` },
  { value: "0 ₽", label: "чтобы начать учиться", color: "#A78BFA", icon: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>` },
];

const TESTIMONIALS = [
  {
    name: "Алина Соколова",
    role: "Школьница, 10 класс",
    avatar: "А",
    avatarBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    text: "Готовлюсь к ЕГЭ по истории — Mentora объясняет лучше любого репетитора. Особенно нравится, что она помнит, что я уже прошла, и не повторяется.",
    stars: 5,
    xp: "340 ментов · 12 дней подряд",
  },
  {
    name: "Дмитрий Власов",
    role: "Студент, 2-й курс",
    avatar: "Д",
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    text: "Думал, что история — это зубрёжка. Оказалось, можно просто разговаривать и всё запоминается само. Прошёл тему Смутного времени за один вечер.",
    stars: 5,
    xp: "780 ментов · 21 день подряд",
  },
  {
    name: "Марина Захарова",
    role: "Взрослый, учусь для себя",
    avatar: "М",
    avatarBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    text: "Всю жизнь хотела разобраться в истории России — читала книги, но засыпала. Здесь за 20 минут в диалоге узнаю больше, чем за час с учебником.",
    stars: 5,
    xp: "520 ментов · 8 дней подряд",
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
            <Link href="/auth"
              className="hidden sm:inline px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:text-[var(--text)] transition-colors">
              Войти
            </Link>
            <Link href="/auth"
              className="inline-flex px-5 py-2.5 bg-brand-600 dark:bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors">
              Попробовать бесплатно →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — dark full-width with neural network */}
      <section className="relative overflow-hidden" style={{ background: "#04060f" }}>
        {/* Neural network canvas — fills entire hero */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <NeuralNetworkCanvas className="absolute inset-0 w-full h-full" />
        </div>
        {/* Large ambient spheres behind the canvas (lower z, more subtle) */}
        <SphereBlobScene spheres={SUBTLE_SPHERES} intensity={0.45} />

        {/* Gradient fade at bottom to blend with next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" aria-hidden
          style={{ background: "linear-gradient(to bottom, transparent, #111827)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/40 text-green-400 text-xs font-medium rounded-full mb-6 border border-green-700/40">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Уже доступно · История России и мира
              </div>
              <h1 className="text-[3.2rem] md:text-[4rem] font-black leading-[1.05] mb-6 tracking-tight text-white">
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
                }}>
                  диалоге.
                </span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed mb-6 max-w-md">
                AI-ментор, который знает твой уровень, помнит тебя и объясняет так, как тебе удобно. История, математика, физика и ещё 11 предметов.
              </p>
              <div className="flex justify-end mb-8 mt-1">
                <p className="text-sm text-gray-500 italic text-right leading-relaxed max-w-[260px]">
                  Задай вопрос, который ты<br />
                  не решаешься{" "}
                  <span className="text-[#4561E8] not-italic font-medium">произнести вслух</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mb-5">
                <Link href="/auth"
                  className="px-7 py-3.5 font-semibold rounded-xl text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #4561E8 0%, #6B8FFF 100%)", boxShadow: "0 4px 16px rgba(69,97,232,0.4)" }}>
                  Начать учиться →
                </Link>
                <a href="#demo"
                  className="px-7 py-3.5 border border-white/20 text-gray-300 font-medium rounded-xl hover:border-white/40 hover:text-white transition-colors backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  Посмотреть демо
                </a>
              </div>
              {/* Trust signals */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-amber-400" fill="currentColor"><path d="M6 1l1.5 3 3.5.5-2.5 2.4.6 3.4L6 9 2.9 10.3l.6-3.4L1 4.5l3.5-.5z"/></svg>
                  4.9 / 5 оценка
                </span>
                <span className="text-gray-700">·</span>
                <span>13 предметов</span>
                <span className="text-gray-700">·</span>
                <span>Без VPN · Без карты</span>
              </div>
            </div>
            <div id="demo">
              <DemoChat />
            </div>
          </div>

          {/* Floating questions */}
          <div className="relative z-10 mt-20 max-w-4xl mx-auto px-4">
            <p className="text-[11px] font-semibold text-gray-600 tracking-[0.2em] uppercase mb-16 text-center">Например, вот так</p>
            <div className="mb-24 space-y-10">
              <p className="text-2xl font-semibold text-white w-fit">Подожди, а почему именно 1941-й?</p>
              <p className="text-lg font-medium text-gray-400 w-fit ml-auto mr-[8%]">Это вообще базово знать или нет?</p>
              <p className="text-3xl font-bold text-white w-fit ml-[14%]">Объясни ещё раз, другими словами.</p>
              <p className="text-xl font-medium text-gray-500 w-fit ml-[52%]">А зачем это вообще учить?</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-white mb-1">Преподаватель объясняет всем.</p>
              <p className="text-2xl font-semibold text-[#4561E8] mb-12">Mentora — только тебе.</p>
              <Link href="/auth"
                className="inline-flex px-7 py-3.5 bg-[#4561E8] text-white font-medium rounded-xl hover:bg-[#3651d8] transition-colors">
                Начать бесплатно →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gray-900 dark:bg-[#0a0a18] text-white py-14 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((s) => (
            <div key={s.value} className="flex flex-col items-center text-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${s.color}20`, color: s.color }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" dangerouslySetInnerHTML={{ __html: s.icon }} />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs font-bold text-[var(--text-muted)] tracking-[0.2em] uppercase">Библиотека знаний</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black mb-3 leading-tight text-center">
          Выбери предмет
        </h2>
        <p className="text-center text-[var(--text-muted)] text-base mb-10">
          13 предметов · от школьной программы до университета
        </p>
        <SubjectGrid subjects={SUBJECTS} />
      </section>

      {/* ЕГЭ/ОГЭ COMING SOON */}
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
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <span className="flex items-center gap-2"><span className="text-brand-400">✓</span> Реальные задания ЕГЭ/ОГЭ</span>
                  <span className="flex items-center gap-2"><span className="text-brand-400">✓</span> Трекер: осталось N дней</span>
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
                <Link href="/auth" className="block text-center py-3 px-6 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-sm">
                  Начать готовиться уже сейчас →
                </Link>
              </div>
            </div>
          </div>
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
          {TESTIMONIALS.map((t, i) => {
            const accentColors = ["#4561E8", "#FF7A00", "#10B981"];
            const accent = accentColors[i % accentColors.length];
            return (
              <div key={t.name} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                {/* Colored top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }} />
                {/* Quote mark */}
                <div className="text-5xl leading-none font-black select-none -mt-1 -mb-2" style={{ color: accent, opacity: 0.2 }}>"</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1">{t.text}</p>
                <div className="text-xs font-semibold px-2 py-1 rounded-md w-fit" style={{ background: `${accent}15`, color: accent }}>{t.xp}</div>
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
            );
          })}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          {[
            { v: "4.9 / 5", l: "средняя оценка" },
            { v: "51", l: "тема по истории России" },
            { v: "0 ₽", l: "чтобы начать" },
            { v: "∞", l: "стрик с первого дня" },
          ].map(({ v, l }) => (
            <div key={l}>
              <div className="text-3xl font-bold text-[var(--text)]">{v}</div>
              <div className="text-sm text-[var(--text-secondary)] mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW TO LEARN */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">Как учиться</div>
              <h2 className="text-3xl font-bold mb-4 leading-tight">
                3 приёма, которые делают<br />
                <span className="text-brand-600 dark:text-brand-500 italic">учёбу эффективной</span>
              </h2>
              <Link href="/guide" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-500 text-sm font-medium hover:underline">
                Полный гайд →
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
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">Не понял — попроси объяснить иначе</div>
                  <div className="text-xs text-[var(--text-secondary)]">«Объясни как будто я школьник» — Ментора перестроит ответ</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M13 4H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM3 7h10"/>
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">Напиши «квиз» — получи 5 вопросов</div>
                  <div className="text-xs text-[var(--text-secondary)]">Ментора проверит, что ты знаешь, а что нет</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M8 2v4M8 10v4M2 8h4M10 8h4"/>
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">В конце — попроси «что я узнал»</div>
                  <div className="text-xs text-[var(--text-secondary)]">Ментора даст итог сессии в 3–5 тезисах</div>
                </div>
              </div>
            </div>
          </div>
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
            <span className="text-[#4561E8] italic">удобно.</span>
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
