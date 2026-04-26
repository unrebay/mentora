import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";

export const metadata = { title: "О проекте — Mentora" };

export default async function AboutPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const SUBJECTS = [
    { emoji: "🏰", title: "История России",    desc: "51 тема · 5 уровней",            color: "#4561E8" },
    { emoji: "🌍", title: "Всемирная история", desc: "60 тем · 5 уровней",             color: "#6366F1" },
    { emoji: "📐", title: "Математика",        desc: "Алгебра, геометрия, анализ",     color: "#3B82F6" },
    { emoji: "⚡", title: "Физика",            desc: "Механика до квантового мира",    color: "#06B6D4" },
    { emoji: "🧪", title: "Химия",             desc: "Вещества, реакции, законы",      color: "#10B981" },
    { emoji: "🧬", title: "Биология",          desc: "Клетка до экосистем",            color: "#22C55E" },
    { emoji: "📝", title: "Русский язык",      desc: "Грамматика и орфография",        color: "#8B5CF6" },
    { emoji: "📚", title: "Литература",        desc: "Классика и современная проза",   color: "#A78BFA" },
    { emoji: "🇬🇧", title: "Английский язык",  desc: "A1 — C2, разговорный",           color: "#F59E0B" },
    { emoji: "🏛️", title: "Обществознание",   desc: "Право, экономика, социология",   color: "#FF7A00" },
    { emoji: "🗺️", title: "География",        desc: "Природа, страны, климат",        color: "#14B8A6" },
    { emoji: "💻", title: "Информатика",       desc: "Алгоритмы, программирование",    color: "#6B7280" },
    { emoji: "🔭", title: "Астрономия",        desc: "Звёзды, планеты, вселенная",     color: "#7C3AED" },
    { emoji: "🌐", title: "Кругозор",          desc: "Факты, открытия, феномены",      color: "#EC4899" },
  ];

  return (
    <div style={{ background: "#080814", minHeight: "100vh", color: "white" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 20%, rgba(69,97,232,0.18) 0%, transparent 70%)",
        }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <AnimateIn>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-7 tracking-widest uppercase"
              style={{
                background: "rgba(69,97,232,0.15)",
                border: "1px solid rgba(69,97,232,0.35)",
                color: "#6b87ff",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4561E8", boxShadow: "0 0 6px #4561E8" }} />
              AI-ментор · 14 предметов · бесплатно
            </div>

            <h1
              className="font-black leading-[1.05] mb-6 tracking-tight text-white"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
            >
              Учись с AI.{" "}
              <span style={{
                background: "linear-gradient(120deg, #9ca3ff 0%, #6b87ff 40%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Быстрее. Глубже.
              </span>
            </h1>

            <p className="text-lg leading-relaxed mb-10 mx-auto" style={{ color: "rgba(255,255,255,0.55)", maxWidth: "32rem" }}>
              AI-ментор, который знает твой уровень, помнит тебя и объясняет так, как тебе удобно. История, математика, физика и ещё 11 предметов.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white text-sm"
              style={{
                background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
                boxShadow: "0 4px 24px rgba(69,97,232,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              К предметам
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <AnimateIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "14", label: "предметов уже доступны", color: "#4561E8" },
              { value: "90%", label: "точность ответов AI",   color: "#10B981" },
              { value: "24/7", label: "доступен без VPN",     color: "#FF7A00" },
              { value: "0 ₽", label: "чтобы начать учиться", color: "#A78BFA" },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-5 text-center" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div className="font-black text-3xl mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <AnimateIn>
          <h2 className="font-black text-3xl mb-2 tracking-tight text-center">Как это работает</h2>
          <p className="text-center mb-12" style={{ color: "rgba(255,255,255,0.45)" }}>Пять шагов от первого вопроса до полноценной подготовки</p>
        </AnimateIn>

        <div className="space-y-4">
          {[
            { n: "01", title: "Открываешь — и сразу пробуешь", desc: "Никакой регистрации сначала. Задай первый вопрос и получи развёрнутый ответ за секунду." },
            { n: "02", title: "Выбираешь свой предмет", desc: "14 тем от школьной программы до подготовки к ЕГЭ. Меняй в любое время — прогресс сохраняется." },
            { n: "03", title: "Ментора запоминает тебя", desc: "Стиль, уровень, темп. Не нужно объяснять себя заново — Ментора уже знает, как с тобой говорить.", badge: "ВАУ" },
            { n: "04", title: "Прогресс становится видимым", desc: "Менты, стрики, уровни по каждому предмету. Видно насколько далеко ты продвинулся — это мотивирует." },
            { n: "05", title: "Готовишься к главному", desc: "Режим ЕГЭ/ОГЭ с реальными заданиями и трекером готовности. Старт — лето 2026.", badge: "Скоро" },
          ].map((step, i) => (
            <AnimateIn key={step.n} delay={i * 0.06}>
              <div className="flex gap-5 p-5 rounded-2xl" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div className="font-black text-4xl shrink-0 leading-none" style={{ color: "rgba(69,97,232,0.3)" }}>{step.n}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{step.title}</span>
                    {step.badge && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                        background: "rgba(69,97,232,0.2)", color: "#6b87ff",
                        border: "1px solid rgba(69,97,232,0.3)",
                      }}>{step.badge}</span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{step.desc}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── SUBJECTS ──────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <AnimateIn>
          <h2 className="font-black text-3xl mb-2 tracking-tight text-center">14 предметов уже здесь</h2>
          <p className="text-center mb-12" style={{ color: "rgba(255,255,255,0.45)" }}>Школьная программа, ЕГЭ и не только</p>
        </AnimateIn>
        <AnimateIn delay={0.07}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SUBJECTS.map(s => (
              <div key={s.title} className="flex items-center gap-3 p-3 rounded-xl" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <span className="text-xl shrink-0">{s.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-white leading-tight">{s.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* ── WHY MENTORA ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <AnimateIn>
          <h2 className="font-black text-3xl mb-12 tracking-tight text-center">Почему Mentora</h2>
        </AnimateIn>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: "🔒", title: "Спрашивай без страха", desc: "Диалоги шифруются по стандарту AES-256 — тому же, что используют банки и Apple Pay. Задай вопрос, который не стал бы вводить в Google.", tag: "AES-256", color: "#4561E8" },
            { icon: "🧠", title: "Учится вместе с тобой", desc: "Контекстная память запоминает каждый диалог: уровень, пробелы, стиль. Персонализированное обучение эффективнее стандартного на 76%.", tag: "+76% эффективность", color: "#10B981" },
            { icon: "❤️", title: "Всегда на твоей стороне", desc: "Не осудит, не устанет, не раздражится. Объяснит в третий раз с другого угла, поддержит и искренне порадуется успеху.", color: "#FF7A00" },
            { icon: "⚡", title: "Уровень топовых AI-лабораторий", desc: "Mentora работает на frontier-моделях. RAG-retrieval и многоуровневый контекст делают ответы точнее любого поисковика.", tag: "Frontier AI", color: "#A78BFA" },
            { icon: "🌍", title: "Знания без границ", desc: "Учиться можно из любой точки, без учителя и расписания. Стрики, уровни и менты превращают ежедневную учёбу в привычку.", color: "#06B6D4" },
            { icon: "💰", title: "Считаем вместе", desc: "8 занятий с репетитором — 12 000–24 000 ₽. Mentora Pro — 499 ₽ в месяц, безлимит, 24/7. Выбор очевиден.", color: "#F59E0B" },
          ].map((f, i) => (
            <AnimateIn key={f.title} delay={i * 0.05}>
              <div className="p-5 rounded-2xl h-full" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{f.icon}</span>
                  <span className="font-semibold text-white text-sm">{f.title}</span>
                  {f.tag && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto shrink-0" style={{
                      background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}44`,
                    }}>{f.tag}</span>
                  )}
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{f.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <AnimateIn>
          <h2 className="font-black text-3xl mb-2 tracking-tight text-center">Тарифы</h2>
          <p className="text-center mb-12" style={{ color: "rgba(255,255,255,0.45)" }}>Начни бесплатно — переходи когда готов</p>
        </AnimateIn>
        <AnimateIn delay={0.07}>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: "Базовый",
                price: "0 ₽",
                sub: "навсегда",
                color: "#6B7280",
                features: ["20 сообщений в сутки", "1 активный предмет", "Базовая память", "Прогресс и стрики"],
              },
              {
                name: "Pro",
                price: "499 ₽",
                sub: "в месяц",
                color: "#4561E8",
                highlight: true,
                badge: "Популярный",
                features: ["Безлимитный чат", "Все 14 предметов", "Долгосрочная память", "Аналитика прогресса", "Приоритетные ответы"],
              },
              {
                name: "Ultima",
                price: "999 ₽",
                sub: "в месяц",
                color: "#A78BFA",
                features: ["Всё из Pro", "GPT-4o + Opus 4", "Режим ЕГЭ/ОГЭ (beta)", "Экспорт конспектов", "Ранний доступ к фичам"],
              },
            ].map(plan => (
              <div key={plan.name} className="rounded-2xl p-6 flex flex-col" style={{
                background: plan.highlight ? "rgba(69,97,232,0.12)" : "rgba(255,255,255,0.04)",
                border: plan.highlight ? "1px solid rgba(69,97,232,0.4)" : "1px solid rgba(255,255,255,0.07)",
              }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-black text-lg text-white">{plan.name}</span>
                  {plan.badge && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                      background: "rgba(69,97,232,0.25)", color: "#6b87ff",
                    }}>{plan.badge}</span>
                  )}
                </div>
                <div className="mb-5">
                  <span className="font-black text-3xl" style={{ color: plan.color }}>{plan.price}</span>
                  <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>{plan.sub}</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors" style={{
                  background: plan.highlight ? "rgba(69,97,232,0.3)" : "rgba(255,255,255,0.06)",
                  color: plan.highlight ? "#a0b4ff" : "rgba(255,255,255,0.6)",
                  border: plan.highlight ? "1px solid rgba(69,97,232,0.4)" : "1px solid rgba(255,255,255,0.1)",
                }}>
                  Подробнее
                </Link>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* ── REFERRAL PYRAMID ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <AnimateIn>
          <div className="rounded-3xl p-8 md:p-10" style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{
                background: "rgba(69,97,232,0.18)", border: "1px solid rgba(69,97,232,0.3)",
              }}>🎁</div>
              <div>
                <h2 className="font-black text-2xl text-white tracking-tight">Приглашай друзей — получай дни Pro</h2>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Никаких денег. Просто делись ссылкой.</p>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-8">
              {/* Left: explanation */}
              <div className="space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  У тебя есть личная реферальная ссылка. Когда по ней регистрируется новый пользователь, <strong className="text-white">вы оба</strong> получаете +3 дня Pro-доступа. Бесплатно и без условий.
                </p>

                {/* Chain levels */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{
                    background: "rgba(69,97,232,0.12)", border: "1px solid rgba(69,97,232,0.25)",
                  }}>
                    <span className="text-lg shrink-0">🟦</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Прямой реферал (уровень 1)</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Ты + твой друг получаете по <span className="font-bold text-blue-400">+3 дня Pro</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{
                    background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.2)",
                  }}>
                    <span className="text-lg shrink-0">🟪</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Друг твоего друга (уровень 2)</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Ты получаешь ещё <span className="font-bold text-indigo-400">+1 день</span>, когда твой реферал кого-то пригласит
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{
                    background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)",
                  }}>
                    <span className="text-lg shrink-0">🔮</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Уровни 3 и 4</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Цепочка работает до 4-го уровня — каждый раз <span className="font-bold text-purple-400">+1 день</span> за каждую регистрацию
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Бонусные дни прибавляются к текущему остатку Pro. Если ты уже на платном тарифе — дни засчитываются автоматически при следующем продлении.
                </p>
              </div>

              {/* Right: pyramid visual */}
              <div className="flex flex-col items-center justify-center gap-3">
                {[
                  { label: "Ты", people: 1, days: "+3 дня", color: "#4561E8", size: "w-16 h-16", textSize: "text-sm" },
                  { label: "Твои рефералы", people: 3, days: "+3 и +1 день", color: "#6366F1", size: "w-11 h-11", textSize: "text-xs" },
                  { label: "2-й уровень", people: 5, days: "+1 день", color: "#8B5CF6", size: "w-9 h-9", textSize: "text-xs" },
                  { label: "3-й и 4-й", people: 7, days: "+1 день", color: "#A78BFA", size: "w-7 h-7", textSize: "text-xs" },
                ].map((row, rowIdx) => (
                  <div key={rowIdx} className="flex flex-col items-center gap-1 w-full">
                    <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: row.people }).map((_, i) => (
                        <div key={i} className={`${row.size} rounded-full flex items-center justify-center font-black ${row.textSize}`} style={{
                          background: `${row.color}22`,
                          border: `2px solid ${row.color}55`,
                          color: row.color,
                        }}>
                          👤
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{row.label}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                        background: `${row.color}18`, color: row.color,
                      }}>{row.days}</span>
                    </div>
                    {rowIdx < 3 && (
                      <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-sm text-center sm:text-left" style={{ color: "rgba(255,255,255,0.5)" }}>
                Твоя личная ссылка и статистика — в профиле
              </p>
              <Link href="/profile" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white text-sm" style={{
                background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
                boxShadow: "0 4px 20px rgba(69,97,232,0.4)",
              }}>
                Перейти в профиль
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t py-10" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-xl tracking-tight text-white">Ment<span style={{ color: "#4561E8", fontStyle: "italic" }}>o</span>ra</span>
          <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href="/dashboard" className="hover:text-white transition-colors">Предметы</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Тарифы</Link>
            <Link href="/profile" className="hover:text-white transition-colors">Профиль</Link>
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>© 2025 Mentora. Все права защищены.</span>
        </div>
      </footer>

    </div>
  );
}
