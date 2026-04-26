"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import DemoChat from "@/components/DemoChat";
import AmbientHero from "@/components/AmbientHero";
import LandingNav from "@/components/LandingNav";

/* ── Motion helpers ─────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const fadeUpInView = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/* ── Data ──────────────────────────────────────────────────────────── */

const SUBJECTS = [
  { id: "russian-history",  emoji: "🏰", title: "История России",     desc: "51 тема · 5 уровней",             color: "#4561E8" },
  { id: "world-history",    emoji: "🌍", title: "Всемирная история",  desc: "60 тем · 5 уровней",             color: "#6366F1" },
  { id: "mathematics",      emoji: "📐", title: "Математика",         desc: "Алгебра, геометрия, анализ",     color: "#3B82F6" },
  { id: "physics",          emoji: "⚡", title: "Физика",             desc: "Механика до квантового мира",    color: "#06B6D4" },
  { id: "chemistry",        emoji: "🧪", title: "Химия",              desc: "Вещества, реакции, законы",      color: "#10B981" },
  { id: "biology",          emoji: "🧬", title: "Биология",           desc: "Клетка до экосистем",            color: "#22C55E" },
  { id: "russian-language", emoji: "📝", title: "Русский язык",       desc: "Грамматика и орфография",        color: "#8B5CF6" },
  { id: "literature",       emoji: "📚", title: "Литература",         desc: "Классика и современная проза",   color: "#A78BFA" },
  { id: "english",          emoji: "🇬🇧", title: "Английский язык",   desc: "A1 — C2, разговорный",           color: "#F59E0B" },
  { id: "social-studies",   emoji: "🏛️", title: "Обществознание",    desc: "Право, экономика, социология",   color: "#FF7A00" },
  { id: "geography",        emoji: "🗺️", title: "География",         desc: "Природа, страны, климат",        color: "#14B8A6" },
  { id: "computer-science", emoji: "💻", title: "Информатика",        desc: "Алгоритмы, программирование",    color: "#6B7280" },
  { id: "astronomy",        emoji: "🔭", title: "Астрономия",         desc: "Звёзды, планеты, вселенная",     color: "#7C3AED" },
  { id: "discovery",        emoji: "🌐", title: "Кругозор",           desc: "Факты, открытия, феномены",      color: "#EC4899" },
];

const STATS = [
  { value: "14", label: "предметов уже доступны", color: "#4561E8" },
  { value: "90%", label: "точность ответов AI", color: "#10B981" },
  { value: "24/7", label: "доступен без VPN", color: "#FF7A00" },
  { value: "0 ₽", label: "чтобы начать учиться", color: "#A78BFA" },
];

const STEPS = [
  {
    n: "01",
    title: "Открываешь — и сразу пробуешь",
    desc: "Никакой регистрации сначала. Задай первый вопрос и получи развёрнутый ответ за секунду.",
  },
  {
    n: "02",
    title: "Выбираешь свой предмет",
    desc: "14 тем от школьной программы до подготовки к ЕГЭ. Меняй в любое время — прогресс сохраняется.",
  },
  {
    n: "03",
    title: "Ментора запоминает тебя",
    desc: "Стиль, уровень, темп. Не нужно объяснять себя заново — Ментора уже знает, как с тобой говорить.",
    badge: "ВАУ",
  },
  {
    n: "04",
    title: "Прогресс становится видимым",
    desc: "Менты, стрики, уровни по каждому предмету. Видно насколько далеко ты продвинулся — это мотивирует.",
  },
  {
    n: "05",
    title: "Готовишься к главному",
    desc: "Режим ЕГЭ/ОГЭ с реальными заданиями и трекером готовности. Старт — лето 2026.",
  },
];

type Feature = {
  icon: string;
  title: string;
  desc: string;
  color: string;
  tag?: string;
  comparison?: { label: string; value: string; sub: string; highlight?: boolean }[];
};

const FEATURES: Feature[] = [
  {
    icon: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>`,
    title: "Спрашивай без страха",
    desc: "Диалоги шифруются по стандарту AES-256 — тому же, что используют банки и Apple Pay. Задай вопрос, который не стал бы вводить в Google.",
    color: "#4561E8",
    tag: "AES-256",
  },
  {
    icon: `<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>`,
    title: "Учится вместе с тобой",
    desc: "Контекстная память Менторы запоминает каждый диалог: уровень, пробелы, стиль. Персонализированное обучение эффективнее стандартного на 76%.*",
    color: "#10B981",
    tag: "+76% эффективность",
  },
  {
    icon: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" fill="none"/>`,
    title: "Всегда на твоей стороне",
    desc: "Не осудит, не устанет, не раздражится. Объяснит в третий раз с другого угла, поддержит и искренне порадуется успеху. Так должен работать настоящий ментор.",
    color: "#FF7A00",
  },
  {
    icon: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>`,
    title: "Уровень топовых AI-лабораторий",
    desc: "Mentora работает на frontier-моделях — той же архитектуре, что лежит в основе продуктов ведущих AI-компаний. RAG-retrieval и многоуровневый контекст делают ответы точнее любого поисковика.",
    color: "#A78BFA",
    tag: "Frontier AI",
  },
  {
    icon: `<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>`,
    title: "Знания — без границ",
    desc: "Учиться можно из любой точки, без учителя и расписания. Стрики, уровни и менты превращают ежедневную учёбу в привычку, а не обязанность.",
    color: "#06B6D4",
  },
  {
    icon: `<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>`,
    title: "Считаем вместе",
    desc: "8 занятий с репетитором в месяц или неограниченный доступ к Менторе — выбор очевиден.",
    color: "#F59E0B",
    comparison: [
      { label: "Репетитор", value: "12–24 000 ₽", sub: "8 занятий × 1 500–3 000 ₽/час" },
      { label: "Mentora Pro", value: "499 ₽", sub: "месяц, безлимит, 24/7", highlight: true },
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Алина Соколова",
    role: "Школьница, 10 класс",
    avatar: "А",
    color: "#4561E8",
    text: "Готовлюсь к ЕГЭ по истории. Раньше зазубривала даты — теперь просто разговариваю с Менторой, и всё складывается само. За две недели прошла больше, чем за всю четверть с учителем.",
    stars: 5,
    xp: "340 мент · 14 дней подряд",
  },
  {
    name: "Кирилл Носов",
    role: "Школьник, 8 класс",
    avatar: "К",
    color: "#FF7A00",
    text: "Зашёл спросить про уравнения, задержался на час — оказывается, математика может быть интересной. Попросил объяснить три раза по-разному, Ментора ни разу не раздражалась.",
    stars: 5,
    xp: "210 мент · 7 дней подряд",
  },
  {
    name: "Марина Захарова",
    role: "Взрослая, учусь для себя",
    avatar: "М",
    color: "#10B981",
    text: "Очень нравится — давно хотела разобраться в истории для себя, не для экзамена. Ставлю 4 звезды, потому что хочется мобильное приложение. Но сам продукт — огонь.",
    stars: 4,
    xp: "520 мент · 8 дней подряд",
  },
];

/* ── Component ─────────────────────────────────────────────────────── */

export default function LandingPageClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ background: "#080814", minHeight: "100vh", color: "white" }}>

      <LandingNav />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">

        <AmbientHero
          variant="hero"
          splineUrl="https://my.spline.design/retrofuturismbganimation-HFdvtQ5oOt2HeV1VdNeILLtN/"
          iframeStyle={{
            /* 80vh tall, anchored to right — beams sit behind the chat card */
            top: "10%",
            left: "auto",
            right: "-10%",
            width: "85%",
            height: "80vh",
          }}
        />

        {/* Blue tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(69,97,232,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20 w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* Left — headline */}
            <motion.div {...fadeUp(0)}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-7 tracking-widest uppercase"
                style={{
                  background: "rgba(69,97,232,0.15)",
                  border: "1px solid rgba(69,97,232,0.35)",
                  color: "#6b87ff",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#4561E8", boxShadow: "0 0 6px #4561E8" }}
                />
                AI-ментор · 14 предметов · бесплатно
              </div>

              <h1
                className="font-black leading-[1.05] mb-7 tracking-tight text-white"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)" }}
              >
                Учись с AI.
                <br />
                <span
                  style={{
                    background: "linear-gradient(120deg, #9ca3ff 0%, #6b87ff 40%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Быстрее. Глубже.
                </span>
              </h1>

              <p
                className="text-lg leading-relaxed mb-9"
                style={{ color: "rgba(255,255,255,0.55)", maxWidth: "28rem" }}
              >
                AI-ментор, который знает твой уровень, помнит тебя и объясняет так, как тебе удобно. История, математика, физика и ещё 11 предметов.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white text-sm transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
                    boxShadow: "0 4px 24px rgba(69,97,232,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = "0 8px 32px rgba(69,97,232,0.65), inset 0 1px 0 rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "0 4px 24px rgba(69,97,232,0.45), inset 0 1px 0 rgba(255,255,255,0.15)";
                  }}
                >
                  Начать бесплатно
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>

                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(255,255,255,0.10)";
                    el.style.color = "white";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(255,255,255,0.06)";
                    el.style.color = "rgba(255,255,255,0.75)";
                  }}
                >
                  Попробовать демо
                </a>
              </div>

              {/* Floating questions */}
              <div className="mt-12 space-y-4">
                <p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Подожди, а почему именно 1941-й?
                </p>
                <p className="text-sm ml-10" style={{ color: "rgba(255,255,255,0.22)" }}>
                  Это вообще базово знать или нет?
                </p>
                <p className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
                  Объясни ещё раз, другими словами.
                </p>
              </div>
            </div>

            {/* Right — demo chat */}
            <motion.div id="demo" {...fadeUp(0.18)}>
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  backdropFilter: "blur(24px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <DemoChat />
              </div>
              <p
                className="text-sm text-center mt-4 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Задай вопрос, который не решался{" "}
                <span style={{ color: "#6b87ff" }}>произнести вслух</span>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #080814)" }}
        />
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.value}
                {...fadeUpInView(i * 0.08)}
                className="flex flex-col items-center text-center gap-3 rounded-2xl px-4 py-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="text-3xl font-black" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ──────────────────────────────────────────────── */}
      <section id="subjects" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Библиотека знаний
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white">
              Выбери предмет
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)" }}>
              14 предметов · от школьной программы до университета
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {SUBJECTS.map((s, i) => (
              <motion.div key={s.id} {...fadeUpInView(i * 0.04)}>
              <Link
                href="/auth"
                className="flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = `${s.color}12`;
                  el.style.borderColor = `${s.color}40`;
                  el.style.transform = "translateY(-3px) scale(1.02)";
                  el.style.boxShadow = `0 12px 32px ${s.color}20`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.06)";
                  el.style.transform = "translateY(0) scale(1)";
                  el.style.boxShadow = "none";
                }}
              >
                <span className="text-3xl">{s.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-white leading-tight mb-1">
                    {s.title}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {s.desc}
                  </div>
                </div>
              </Link>
              </motion.div>
            ))}

            {/* Suggest tile */}
            <Link
              href="/auth"
              className="flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.1)",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "rgba(69,97,232,0.5)";
                el.style.background = "rgba(69,97,232,0.06)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "rgba(255,255,255,0.1)";
                el.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-light"
                style={{ background: "rgba(69,97,232,0.12)", color: "#6b87ff" }}
              >
                +
              </span>
              <div>
                <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Предложить тему
                </div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Голосуй за предмет
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Почему Mentora
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white">
              Совершенно другой подход
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", maxWidth: "28rem", margin: "0 auto" }}>
              Не очередной учебник онлайн. Живой ментор, который работает только для тебя.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUpInView(i * 0.07)}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 cursor-default"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(16px)",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(-3px)";
                  el.style.borderColor = `${f.color}35`;
                  el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${f.color}20`;
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(0)";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                  el.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${f.color}18`, color: f.color }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" dangerouslySetInnerHTML={{ __html: f.icon }} />
                  </div>
                  {f.tag && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-1"
                      style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}40` }}
                    >
                      {f.tag}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-1.5 text-white">{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {f.desc}
                  </p>
                </div>

                {f.comparison && (
                  <div className="mt-1 space-y-2">
                    {f.comparison.map(c => (
                      <div
                        key={c.label}
                        className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
                        style={c.highlight
                          ? { background: `${f.color}18`, border: `1px solid ${f.color}40` }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }
                        }
                      >
                        <div>
                          <div
                            className="text-[11px] font-semibold"
                            style={{ color: c.highlight ? f.color : "rgba(255,255,255,0.4)" }}
                          >
                            {c.label}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {c.sub}
                          </div>
                        </div>
                        <div
                          className="text-sm font-bold shrink-0"
                          style={{
                            color: c.highlight ? f.color : "rgba(255,255,255,0.3)",
                            textDecoration: c.highlight ? "none" : "line-through",
                          }}
                        >
                          {c.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Как это работает
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white">
              От первого вопроса
              <br />
              до{" "}
              <span
                style={{
                  background: "linear-gradient(120deg, #6b87ff 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontStyle: "italic",
                }}
              >
                реального знания
              </span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", maxWidth: "28rem", margin: "0 auto" }}>
              Никаких лекций и скучных тестов. Только живой диалог — ты спрашиваешь, Ментора объясняет.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                {...fadeUpInView(i * 0.08)}
                className="relative rounded-2xl p-5 transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = "rgba(69,97,232,0.08)";
                  el.style.borderColor = "rgba(69,97,232,0.3)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                  el.style.transform = "translateY(0)";
                }}
              >
                {s.badge && (
                  <span
                    className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(69,97,232,0.2)", color: "#6b87ff" }}
                  >
                    {s.badge}
                  </span>
                )}
                <div
                  className="text-3xl font-black mb-3 leading-none"
                  style={{ color: "rgba(69,97,232,0.4)" }}
                >
                  {s.n}
                </div>
                <div className="font-semibold text-sm mb-2 text-white leading-tight">
                  {s.title}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {s.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ЕГЭ/ОГЭ TEASER ───────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="relative overflow-hidden rounded-3xl p-8 md:p-12"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(69,97,232,0.2)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(69,97,232,0.12) 0%, transparent 60%)" }}
            />

            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 tracking-widest uppercase"
                  style={{ background: "rgba(69,97,232,0.15)", border: "1px solid rgba(69,97,232,0.3)", color: "#6b87ff" }}
                >
                  Скоро — июнь 2026
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-white">
                  Режим подготовки
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(120deg, #6b87ff, #a78bfa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontStyle: "italic",
                    }}
                  >
                    к ЕГЭ и ОГЭ
                  </span>
                </h2>
                <p className="leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Специальный режим с реальными заданиями, трекером готовности и прогнозом результата.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span className="flex items-center gap-2">
                    <span style={{ color: "#6b87ff" }}>✓</span> Реальные задания ЕГЭ/ОГЭ
                  </span>
                  <span className="flex items-center gap-2">
                    <span style={{ color: "#6b87ff" }}>✓</span> Трекер готовности
                  </span>
                  <span className="flex items-center gap-2">
                    <span style={{ color: "#6b87ff" }}>✓</span> Прогноз результата
                  </span>
                  <span className="flex items-center gap-2">
                    <span style={{ color: "#6b87ff" }}>✓</span> Все 14 предметов
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Пример: трекер готовности
                  </div>
                  <div className="text-xl font-bold mb-3 text-white">60% программы пройдено</div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: "60%", background: "linear-gradient(90deg, #4561E8, #6b87ff)" }}
                    />
                  </div>
                  <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    До экзамена: 40 дней · История России · ЕГЭ 2026
                  </div>
                </div>

                <Link
                  href="/auth"
                  className="block text-center py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, #4561E8, #6b87ff)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
                >
                  Начать готовиться уже сейчас
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Отзывы
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white">
              Уже учатся с Mentora
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)" }}>
              Реальные истории реальных учеников
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                {...fadeUpInView(i * 0.1)}
                className="relative rounded-2xl p-6 flex flex-col gap-4 overflow-hidden transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(16px)",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(-3px)";
                  el.style.borderColor = `${t.color}35`;
                  el.style.boxShadow = "0 16px 48px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(0)";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: t.color }}
                />

                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                  {Array.from({ length: 5 - t.stars }).map((_, j) => (
                    <span key={`e-${j}`} className="text-sm" style={{ color: "rgba(255,255,255,0.15)" }}>★</span>
                  ))}
                </div>

                <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {t.text}
                </p>

                <div
                  className="text-xs font-semibold px-2 py-1 rounded-md w-fit"
                  style={{ background: `${t.color}15`, color: t.color }}
                >
                  {t.xp}
                </div>

                <div
                  className="flex items-center gap-3 pt-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: `${t.color}20`, color: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(69,97,232,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 40% 40% at 50% 80%, rgba(107,135,255,0.12) 0%, transparent 60%)" }}
        />

        <div className="relative z-10">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-8"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Твой персональный AI-ментор
          </p>
          <h2
            className="font-black mb-6 leading-tight text-white"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
          >
            Учись так,
            <br />
            как тебе{" "}
            <span
              style={{
                background: "linear-gradient(120deg, #6b87ff, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontStyle: "italic",
              }}
            >
              удобно.
            </span>
          </h2>
          <p
            className="text-lg mb-12 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)", maxWidth: "24rem", margin: "0 auto 3rem" }}
          >
            В своём темпе. Задавай любые вопросы.
            <br />
            Твои вопросы видишь только ты.
          </p>

          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold text-base text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
              boxShadow: "0 8px 40px rgba(69,97,232,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 14px 56px rgba(69,97,232,0.7), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "0 8px 40px rgba(69,97,232,0.5), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
          >
            Начать бесплатно
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Без карты. Без обязательств.
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer
        className="py-8 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            © 2026 Mentora
          </span>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)"; }}
            >
              Конфиденциальность
            </Link>
            <Link
              href="/terms"
              className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)"; }}
            >
              Условия использования
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
