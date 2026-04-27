"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AboutPage() {

  /* ── June 1 countdown ─────────────────────────────────────────── */
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0, done: false });

  useEffect(() => {
    const target = new Date("2026-06-01T00:00:00+03:00").getTime();
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown(c => ({ ...c, done: true })); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown({ days, hours, mins, secs, done: false });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Roadmap ─────────────────────────────────────────────────── */
  const TIMELINE = [
    {
      q: "Q1 2026", label: "Запуск платформы", done: true,
      desc: "14 предметов, персональный ментор, Pro и Ultima тарифы, реферальная система",
    },
    {
      q: "Q2 2026", label: "Учебные программы и треки", done: false,
      desc: "Структурированные курсы по темам, режим «Научи меня с нуля», трекер охваченных тем",
    },
    {
      q: "Q3 2026", label: "Мобильное приложение", done: false,
      desc: "iOS и Android — учись в дороге, push-уведомления, офлайн-конспекты",
    },
    {
      q: "Q4 2026", label: "B2B: школы и организации", done: false,
      desc: "После 1000+ активных пользователей: дашборд учителя, групповые лицензии",
    },
    {
      q: "2027", label: "Международная экспансия", done: false,
      desc: "Английская версия, Казахстан, другие языки и системы образования",
    },
  ];

  /* ── Values ───────────────────────────────────────────────────── */
  const VALUES = [
    {
      icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      color: "#4561E8",
      title: "Спрашивай без стыда",
      desc: "Ментора не осудит, не расскажет учителю, не посмеётся. Здесь нет «тупых» вопросов — есть только твой прогресс.",
    },
    {
      icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
      color: "#10B981",
      title: "Доступно каждому",
      desc: "Репетитор в Москве стоит от 2 000 ₽/час. Pro-план Mentora — 499 ₽ в месяц. Это не компромисс — это честный выбор.",
    },
    {
      icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
      color: "#F59E0B",
      title: "Занятия не отменяются",
      desc: "Ни праздники, ни болезни, ни плохое настроение. Ментора доступен в 3 часа ночи — ровно тогда, когда нужен.",
    },
    {
      icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
      color: "#A78BFA",
      title: "Честные ответы",
      desc: "Если чего-то не знает — скажет прямо. Мы не генерируем уверенную чушь для красоты — нам важен твой результат.",
    },
  ];

  /* ── Helpers ──────────────────────────────────────────────────── */
  function Tag({ children, color = "#4561E8" }: { children: React.ReactNode; color?: string }) {
    return (
      <span style={{
        display: "inline-block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase" as const,
        padding: "3px 10px", borderRadius: 99,
        background: `${color}18`, color, border: `1px solid ${color}38`,
      }}>
        {children}
      </span>
    );
  }

  function Card({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
    return (
      <div style={{
        background: accent ? "rgba(69,97,232,0.07)" : "var(--bg-secondary)",
        border: `1px solid ${accent ? "rgba(69,97,232,0.2)" : "var(--border-light)"}`,
        borderRadius: 20,
        padding: "28px",
      }}>
        {children}
      </div>
    );
  }

  const num = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="min-h-screen"
      style={{ color: "var(--text)", paddingBottom: 80 }}
    >
      {/* ── Ambient orbs — visible in both themes ───────────────── */}
      <div className="fixed inset-0 pointer-events-none dark:hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "5%",
          width: "55%", height: "50%",
          background: "radial-gradient(ellipse, rgba(69,97,232,0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "5%",
          width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(167,139,250,0.14) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
      </div>
      {/* Dark-mode ambient (kept from original) */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "5%",
          width: "55%", height: "50%",
          background: "radial-gradient(ellipse, rgba(69,97,232,0.16) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "5%",
          width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(167,139,250,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-14 pb-16">
          <Tag color="#4561E8">О нас</Tag>
          <h1 style={{
            fontSize: "clamp(30px, 5vw, 52px)",
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: "-1.5px", color: "var(--text)",
            margin: "20px 0 18px",
          }}>
            Ментор, которого<br />
            <span style={{ color: "#4561E8" }} className="dark:text-[#6b87ff]">ты всегда хотел иметь</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--text-secondary)", maxWidth: 580 }}>
            Хороший наставник знает, как ты мыслишь. Помнит, где ты застрял в прошлый раз.
            Объясняет по-новому, если с первого раза не понял. Не устаёт. Не осуждает.
            Mentora — наша попытка сделать такого учителя доступным каждому.
          </p>
        </section>

        {/* ── JUNE 1 COUNTDOWN ─────────────────────────────────── */}
        {!countdown.done && (
          <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
            <div style={{
              background: "rgba(69,97,232,0.07)",
              border: "1px solid rgba(69,97,232,0.18)",
              borderRadius: 20,
              padding: "24px 28px",
              display: "flex",
              flexWrap: "wrap" as const,
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4561E8", marginBottom: 4 }}>
                  Официальный запуск
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                  1 июня 2026 — открытие для всех
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                  Сейчас идёт бета — ты уже внутри. Поделись с другом, пока мест не стало меньше.
                </p>
                <div style={{
                  marginTop: 12,
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 10,
                  padding: "7px 14px",
                }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>
                    Каждому зарегистрированному пользователю — подарок: месяц Pro бесплатно
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                {[
                  { v: countdown.days,  l: "дней" },
                  { v: countdown.hours, l: "часов" },
                  { v: countdown.mins,  l: "минут" },
                  { v: countdown.secs,  l: "секунд" },
                ].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: "center" as const }}>
                    <div style={{
                      fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900,
                      color: "var(--text)", lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "ui-monospace, monospace",
                    }}>{num(v)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PROBLEM / SOLUTION ───────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <div className="grid md:grid-cols-2 gap-5">
            <Card>
              <Tag color="#FF7A00">Проблема</Tag>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "16px 0 10px", lineHeight: 1.25 }}>
                Репетитор — это роскошь
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                Средняя цена занятия в Москве — 2 500 ₽. Восемь занятий в месяц = 20 000 ₽.
                Для большинства семей это недостижимо. А хороший учитель нужен каждому ребёнку — не только тем, чьи родители могут себе это позволить.
              </p>
            </Card>
            <Card accent>
              <Tag color="#4561E8">Решение</Tag>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "16px 0 10px", lineHeight: 1.25 }}>
                Персональный ментор без ограничений
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                Mentora помнит тебя. Знает твой уровень, стиль мышления и пробелы.
                Объяснит трижды разными словами, не раздражаясь. 14 предметов, 24/7,
                без VPN — за 499 ₽ в месяц.
              </p>
            </Card>
          </div>
        </section>

        {/* ── HOW LEARNING WORKS ───────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#A78BFA">Как это работает</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 8px", letterSpacing: "-0.5px" }}>
            Не поиск по ключевым словам —<br />живой разговор
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
            Ты просто пишешь, как написал бы другу. Ментора разбирается в теме и отвечает именно тебе.
          </p>

          <div className="space-y-3">
            {[
              {
                n: "01", color: "#4561E8",
                title: "Начни с любого вопроса",
                desc: "Не нужно составлять программу или выбирать тему. Пиши как есть: «объясни синусы», «помоги с сочинением», «почему началась Холодная война». Ментора сам ориентируется по контексту.",
              },
              {
                n: "02", color: "#A78BFA",
                title: "Ментора подстраивается под тебя",
                desc: "Уже после нескольких сообщений система понимает твой уровень и стиль: объясняет через примеры, формулы или практику — в зависимости от того, как ты лучше воспринимаешь. Это фиксируется и применяется при каждом следующем сеансе.",
              },
              {
                n: "03", color: "#10B981",
                title: "Прогресс накапливается автоматически",
                desc: "Каждый диалог пополняет твою учебную память. Ментора помнит, что ты уже знаешь, где застревал и о чём спрашивал — и не начинает объяснение с нуля каждый раз. XP и стрики показывают, насколько ты регулярен.",
              },
              {
                n: "04", color: "#F59E0B",
                title: "Конспекты и закрепление",
                desc: "После разбора темы Ментора может собрать PDF-конспект с ключевыми фактами, терминами и вопросом для самопроверки — чтобы ты мог закрепить материал и вернуться к нему в любое время.",
              },
            ].map(item => (
              <div key={item.n}
                className="flex gap-5 p-5 rounded-2xl"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}
              >
                <div style={{ color: item.color, fontSize: 12, fontWeight: 900, minWidth: 28, paddingTop: 2, flexShrink: 0 }}>{item.n}</div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 5 }}>{item.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPARISON TABLE ──────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#10B981">Сравнение</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 6px", letterSpacing: "-0.5px" }}>
            Mentora против альтернатив
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Мы честно сравниваем — включая свои ограничения.
          </p>

          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {["Критерий", "Поисковая машина", "ИИ-модели", "Mentora", "Репетитор"].map((h, i) => (
                    <th key={h} style={{
                      padding: "10px 14px",
                      fontSize: 12, fontWeight: 700, textAlign: "left" as const,
                      color: i === 3 ? "#4561E8" : "var(--text-muted)",
                      background: i === 3 ? "rgba(69,97,232,0.09)" : "var(--bg-secondary)",
                      borderBottom: i === 3 ? "1px solid rgba(69,97,232,0.22)" : "1px solid var(--border)",
                      borderTop: "1px solid var(--border-light)",
                      borderLeft: i === 3 ? "1px solid rgba(69,97,232,0.22)" : i === 0 ? "1px solid var(--border-light)" : "none",
                      borderRight: i === 3 ? "1px solid rgba(69,97,232,0.22)" : i === 4 ? "1px solid var(--border-light)" : "none",
                      borderRadius: i === 0 ? "12px 0 0 0" : i === 4 ? "0 12px 0 0" : 0,
                      whiteSpace: "nowrap" as const,
                      letterSpacing: "0.03em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { criterion: "Знает твой уровень",       search: "✗", ai: "Частично", mentora: "✓", tutor: "✓",         note: "Ментора запоминает профиль с первого диалога" },
                  { criterion: "Помнит прошлые сессии",     search: "✗", ai: "✗",        mentora: "✓", tutor: "Обычно",    note: "История и прогресс хранятся бессрочно" },
                  { criterion: "Доступен в 3 часа ночи",    search: "✓", ai: "✓",        mentora: "✓", tutor: "✗",         note: "" },
                  { criterion: "Объясняет, а не ищет",      search: "✗", ai: "✓",        mentora: "✓", tutor: "✓",         note: "Поисковик даёт ссылки — разбираться приходится самому" },
                  { criterion: "Настроен на рос. программу",search: "Частично", ai: "✗", mentora: "✓", tutor: "✓",         note: "Контекст, терминология и задания адаптированы" },
                  { criterion: "Стоимость в месяц",         search: "Бесплатно", ai: "~2 000 ₽", mentora: "499 ₽", tutor: "12 000+ ₽", note: "" },
                  { criterion: "Объяснит 10 раз по-разному",search: "✗", ai: "✓",        mentora: "✓", tutor: "Не всегда", note: "Репетитор тоже устаёт объяснять одно и то же" },
                  { criterion: "Живая эмпатия",             search: "✗", ai: "✗",        mentora: "✗", tutor: "✓",         note: "Честный минус — настоящего человека AI не заменит" },
                ].map((row, ri) => {
                  const isLast = ri === 7;
                  const cellStyle = (i: number, val: string): React.CSSProperties => ({
                    padding: "11px 14px",
                    fontSize: 13,
                    color: val === "✓" ? "#10B981"
                      : val === "✗" ? "var(--text-muted)"
                      : i === 3 ? "#4561E8"
                      : "var(--text-secondary)",
                    fontWeight: val === "✓" || val === "✗" ? 700 : 500,
                    background: i === 3 ? "rgba(69,97,232,0.06)" : ri % 2 === 0 ? "var(--bg-secondary)" : "transparent",
                    borderBottom: isLast ? "1px solid var(--border-light)" : "1px solid var(--border-light)",
                    borderLeft: i === 3 ? "1px solid rgba(69,97,232,0.18)" : i === 0 ? "1px solid var(--border-light)" : "none",
                    borderRight: i === 3 ? "1px solid rgba(69,97,232,0.18)" : i === 4 ? "1px solid var(--border-light)" : "none",
                    borderRadius: isLast && i === 0 ? "0 0 0 12px" : isLast && i === 4 ? "0 0 12px 0" : 0,
                    lineHeight: 1.4,
                  });
                  return (
                    <tr key={row.criterion}>
                      <td style={cellStyle(0, "")}>
                        <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>{row.criterion}</div>
                        {row.note && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{row.note}</div>}
                      </td>
                      <td style={cellStyle(1, row.search)}>{row.search}</td>
                      <td style={cellStyle(2, row.ai)}>{row.ai}</td>
                      <td style={cellStyle(3, row.mentora)}>{row.mentora}</td>
                      <td style={cellStyle(4, row.tutor)}>{row.tutor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── VALUES ───────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#FF7A00">Ценности</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 24px", letterSpacing: "-0.5px" }}>Во что мы верим</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VALUES.map(v => (
              <div key={v.title}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${v.color}16`, border: `1px solid ${v.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={v.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.icon} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 5 }}>{v.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ROADMAP ──────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#6366F1">Дорожная карта</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 28px", letterSpacing: "-0.5px" }}>Куда мы движемся</h2>

          <div className="relative pl-6" style={{ borderLeft: "1px solid var(--border)" }}>
            {TIMELINE.map(item => (
              <div key={item.q} className="relative mb-6 last:mb-0">
                <div className="absolute -left-8 top-1 w-3 h-3 rounded-full" style={{
                  background: item.done ? "#4561E8" : "var(--border)",
                  border: item.done ? "none" : "1px solid var(--border)",
                  boxShadow: item.done ? "0 0 10px rgba(69,97,232,0.5)" : "none",
                }} />
                <div className="flex items-start gap-3 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                    background: item.done ? "rgba(69,97,232,0.12)" : "var(--bg-secondary)",
                    color: item.done ? "#4561E8" : "var(--text-muted)",
                    flexShrink: 0,
                  }}>
                    {item.q}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                      {item.label}
                      {item.done && (
                        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "#4561E8" }}>
                          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: "inline", marginBottom: 1 }}>
                            <path d="M2 6l3 3 5-5" />
                          </svg>{" "}готово
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ULTIMA NOTE ──────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <div style={{
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 16,
            padding: "16px 20px",
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>Про тариф Ultima</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Мы активно разрабатываем новые функции. Часть возможностей, описанных в тарифе Ultima,
                ещё находится в тестировании и будет запускаться поэтапно до 1 июня 2026 года.
                Все подписчики Ultima получат доступ к ним автоматически по мере появления.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-4 text-center">
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
            Вопросы, партнёрство, обратная связь
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" as const }}>
            <a href="mailto:hello@mentora.su" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "underline", textDecorationStyle: "dotted" as const }}>
              hello@mentora.su
            </a>
            <span style={{ color: "var(--border)" }}>·</span>
            <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 500, color: "#4561E8" }}>
              Вернуться к учёбе →
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
