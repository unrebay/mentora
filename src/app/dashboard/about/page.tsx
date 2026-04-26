import Link from "next/link";

export const metadata = { title: "О проекте — Mentora" };

// ── Mini components ───────────────────────────────────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`max-w-4xl mx-auto px-5 sm:px-8 ${className}`}>
      {children}
    </section>
  );
}

function Card({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? "rgba(69,97,232,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${accent ? "rgba(69,97,232,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 20,
        padding: "28px 28px",
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, color = "#4561E8" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const,
        padding: "3px 10px", borderRadius: 99,
        background: `${color}20`, color, border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}

function IconBox({ path, color = "#4561E8" }: { path: string; color?: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </div>
  );
}

export default function AboutPage() {
  const STACK = [
    { label: "Frontend", items: ["Next.js 14", "TypeScript", "Tailwind CSS", "Motion (Framer)"], color: "#4561E8" },
    { label: "AI-ядро", items: ["Claude Haiku 4.5", "RAG + pgvector", "OpenAI Embeddings", "Contextual memory"], color: "#A78BFA" },
    { label: "Backend", items: ["Supabase (Auth + DB)", "Edge Functions", "YooKassa payments", "Resend Email"], color: "#10B981" },
    { label: "Инфра", items: ["Vercel (EU + CDN)", "VPS (Россия)", "Anthropic Proxy", "PostHog Analytics"], color: "#FF7A00" },
  ];

  const TIMELINE = [
    { q: "Q1 2026", label: "Запуск платформы", done: true, desc: "14 предметов, Auth, Pro/Ultima тарифы, реферальная система" },
    { q: "Q2 2026", label: "Режим ЕГЭ/ОГЭ", done: false, desc: "Тесты с реальными заданиями, трекер готовности, аналитика ошибок" },
    { q: "Q3 2026", label: "B2B: школы и классы", done: false, desc: "Дашборд учителя, групповые лицензии, интеграция с дневниками" },
    { q: "Q4 2026", label: "Мобильное приложение", done: false, desc: "iOS и Android, push-уведомления, офлайн-режим для конспектов" },
    { q: "2027", label: "Языки и страны", done: false, desc: "Английская версия, Казахстан, другие языки обучения" },
  ];

  const VALUES = [
    {
      path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      color: "#4561E8",
      title: "Спрашивай без страха",
      desc: "Ментора не осудит, не расскажет родителям, не поставит оценку. Каждый диалог шифруется — как в банке.",
    },
    {
      path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
      color: "#10B981",
      title: "Учёба для всех",
      desc: "Репетитор за 2 000 ₽/час — не у каждого семья может себе позволить. Pro за 499 ₽ в месяц — может каждый.",
    },
    {
      path: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
      color: "#FF7A00",
      title: "Честные ответы",
      desc: "Если Ментора не знает — скажет об этом. Мы не генерируем уверенную чушь ради красивого ответа.",
    },
    {
      path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
      color: "#A78BFA",
      title: "Frontier AI, русские данные",
      desc: "Под капотом — Claude от Anthropic. Контекст адаптирован под российскую школьную программу.",
    },
  ];

  return (
    <div style={{ background: "#080814", minHeight: "100vh", color: "white", paddingBottom: 80 }}>

      {/* ── Ambient background ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-15%", left: "10%",
          width: "60%", height: "55%",
          background: "radial-gradient(ellipse, rgba(69,97,232,0.14) 0%, transparent 70%)",
          filter: "blur(50px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "5%",
          width: "45%", height: "40%",
          background: "radial-gradient(ellipse, rgba(167,139,250,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <Section className="pt-14 pb-16">
          <div style={{ maxWidth: 680 }}>
            <Tag color="#4561E8">Наша история</Tag>
            <h1
              className="mt-5 mb-5"
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
                color: "white",
              }}
            >
              Мы строим репетитора,<br />
              <span style={{ color: "#6b87ff" }}>которого у нас никогда не было</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", maxWidth: 560 }}>
              Хороший учитель знает, как ты мыслишь. Помнит, где ты застрял в прошлый раз. Объясняет по-новому, если не понял. Не устаёт. Не осуждает. Mentora — наша попытка сделать такого учителя доступным каждому.
            </p>
          </div>
        </Section>

        {/* ── PROBLEM ───────────────────────────────────────────────────── */}
        <Section className="pb-16">
          <div className="grid md:grid-cols-2 gap-5">
            <Card>
              <Tag color="#FF7A00">Проблема</Tag>
              <h3 className="mt-4 mb-3 text-xl font-black text-white leading-tight">
                Репетитор — это роскошь
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                Средняя цена занятия в Москве — 2 500 ₽. Восемь занятий в месяц = 20 000 ₽. Для большинства семей это непозволительная роскошь. Тем временем AI достиг уровня, при котором он объясняет не хуже — а иногда лучше — живого педагога.
              </p>
            </Card>
            <Card accent>
              <Tag color="#4561E8">Решение</Tag>
              <h3 className="mt-4 mb-3 text-xl font-black text-white leading-tight">
                AI-ментор без компромиссов
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                Mentora помнит тебя. Знает твой уровень, стиль мышления и пробелы. Объяснит три раза разными словами, не раздражаясь. 14 предметов, 24/7, без VPN — доступно для всей России за 499 ₽ в месяц.
              </p>
            </Card>
          </div>
        </Section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <Section className="pb-16">
          <Tag color="#A78BFA">Под капотом</Tag>
          <h2 className="mt-4 mb-8 text-2xl font-black text-white tracking-tight">Как это устроено</h2>

          <div className="space-y-3">
            {[
              {
                n: "01",
                title: "Контекстная память",
                desc: "Каждое твоё сообщение векторизируется и сохраняется. Ментора строит профиль твоего знания — что ты понял, где застрял, какой стиль объяснений тебе подходит. RAG-retrieval достаёт нужный контекст при каждом ответе.",
                color: "#4561E8",
              },
              {
                n: "02",
                title: "Frontier AI модели",
                desc: "Мы работаем на Claude Haiku 4.5 от Anthropic — одной из самых точных языковых моделей на рынке. Промпты настроены под российскую школьную программу, ЕГЭ и ОГЭ. Ответы проходят post-processing для форматирования формул и структуры.",
                color: "#A78BFA",
              },
              {
                n: "03",
                title: "Безопасность данных",
                desc: "Вся инфраструктура разделена: данные российских пользователей хранятся на VPS в России, API-запросы идут через EU-прокси. Диалоги шифруются AES-256. Мы не передаём данные третьим лицам и не обучаем модели на переписке пользователей.",
                color: "#10B981",
              },
            ].map((item) => (
              <div
                key={item.n}
                className="flex gap-5 p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="flex-shrink-0 text-xs font-black"
                  style={{ color: item.color, minWidth: 28, paddingTop: 2 }}
                >
                  {item.n}
                </div>
                <div>
                  <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.48)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── STACK ─────────────────────────────────────────────────────── */}
        <Section className="pb-16">
          <Tag color="#10B981">Технологии</Tag>
          <h2 className="mt-4 mb-8 text-2xl font-black text-white tracking-tight">Стек</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {STACK.map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Tag color={s.color}>{s.label}</Tag>
                <ul className="mt-3 space-y-1.5">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ── VALUES ────────────────────────────────────────────────────── */}
        <Section className="pb-16">
          <Tag color="#FF7A00">Ценности</Tag>
          <h2 className="mt-4 mb-8 text-2xl font-black text-white tracking-tight">Во что мы верим</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <IconBox path={v.path} color={v.color} />
                <div>
                  <div className="font-bold text-white text-sm mb-1">{v.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.48)" }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── ROADMAP ───────────────────────────────────────────────────── */}
        <Section className="pb-16">
          <Tag color="#6366F1">Дорожная карта</Tag>
          <h2 className="mt-4 mb-8 text-2xl font-black text-white tracking-tight">Куда мы движемся</h2>
          <div className="relative pl-6" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
            {TIMELINE.map((item, i) => (
              <div key={item.q} className="relative mb-6 last:mb-0">
                {/* dot */}
                <div
                  className="absolute -left-8 top-1 w-3 h-3 rounded-full"
                  style={{
                    background: item.done ? "#4561E8" : "rgba(255,255,255,0.12)",
                    border: item.done ? "none" : "1px solid rgba(255,255,255,0.2)",
                    boxShadow: item.done ? "0 0 10px rgba(69,97,232,0.6)" : "none",
                  }}
                />
                <div className="flex items-start gap-3 flex-wrap">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: item.done ? "rgba(69,97,232,0.2)" : "rgba(255,255,255,0.06)",
                      color: item.done ? "#6b87ff" : "rgba(255,255,255,0.35)",
                      flexShrink: 0,
                    }}
                  >
                    {item.q}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">
                      {item.label}
                      {item.done && (
                        <span className="ml-2 text-xs font-normal" style={{ color: "#4561E8" }}>
                          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: "inline", marginBottom: 1 }}>
                            <path d="M2 6l3 3 5-5"/>
                          </svg>
                          {" "}готово
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── B2B ───────────────────────────────────────────────────────── */}
        <Section className="pb-16">
          <Card accent>
            <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
              <div className="flex-1">
                <Tag color="#4561E8">Для бизнеса</Tag>
                <h3 className="mt-4 mb-3 text-xl font-black text-white leading-tight">
                  Mentora для школ и корпораций
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
                  Групповые лицензии, дашборд учителя с аналитикой по каждому ученику, интеграция с журналами и системами обучения. Если вы ищете AI-решение для образовательного учреждения — напишите нам.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <a
                    href="mailto:hello@mentora.su"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm"
                    style={{ background: "rgba(69,97,232,0.3)", border: "1px solid rgba(69,97,232,0.45)" }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    hello@mentora.su
                  </a>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                    style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Тарифы →
                  </Link>
                </div>
              </div>
              <div className="shrink-0 hidden md:block">
                <div className="text-right">
                  <div className="text-3xl font-black" style={{ color: "#4561E8" }}>B2B</div>
                  <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>запуск Q3 2026</div>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <Section className="pb-4">
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              Вопросы, предложения, партнёрство — пиши напрямую
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="mailto:hello@mentora.su"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.45)", textDecoration: "underline", textDecorationStyle: "dotted" as const }}
              >
                hello@mentora.su
              </a>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <Link href="/dashboard" className="text-sm font-medium" style={{ color: "#6b87ff" }}>
                Вернуться к учёбе →
              </Link>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
