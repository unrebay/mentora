"use client";
import { useTheme } from "@/components/ThemeProvider";

interface Props {
  locale: "ru" | "en";
  variant?: "landing" | "about";
}

const CONTENT = {
  ru: {
    tag: "Наука об обучении",
    heading: "Почему 1-на-1 работает — и как мы это реализуем",
    lead: "Педагог Бенджамин Блум доказал (1984): студенты с личным наставником показывают результаты на 2 стандартных отклонения выше, чем в классе. Это разница между 50-м и 98-м перцентилем. Мы реализуем те же механизмы — но доступно каждому.",
    stat: { n: "2σ", label: "разрыв между классом\nи личным наставником" },
    cite: "— Bloom B.S., Educational Researcher, 1984",
    bridgeLabel: "Как мы это реализуем",
    mechanisms: [
      {
        icon: "⚡",
        color: "#4561E8",
        title: "Немедленная обратная связь",
        body: "Ошибка исправляется в момент её совершения, а не через неделю. Мозг фиксирует правильную модель, пока контекст ещё свеж.",
      },
      {
        icon: "❓",
        color: "#9F7AFF",
        title: "Метод Сократа",
        body: "Mentora задаёт наводящие вопросы вместо готовых ответов. Самостоятельный вывод закрепляется в 3–4 раза лучше, чем пассивное чтение.",
      },
      {
        icon: "🎯",
        color: "#FF7A00",
        title: "Мастерство перед переходом",
        body: "Следующая тема открывается только после того, как текущая понята. Пробелы в знаниях не накапливаются.",
      },
      {
        icon: "🧠",
        color: "#10B981",
        title: "Retrieval practice",
        body: "После объяснения — конкретный вопрос на применение. Активное воспроизведение вместо пассивного чтения удваивает долгосрочное запоминание.",
      },
      {
        icon: "🎭",
        color: "#EC4899",
        title: "Адаптация к ученику",
        body: "Стиль, темп и примеры подстраиваются под вас — не под средний класс. Учиться становится в 5 раз эффективнее.",
      },
    ],
  },
  en: {
    tag: "Learning Science",
    heading: "Why 1-on-1 works — and how we implement it",
    lead: "Educator Benjamin Bloom proved (1984): students with a personal tutor score 2 standard deviations higher than classroom learners. That's the difference between the 50th and 98th percentile. We implement the same mechanisms — accessible to everyone.",
    stat: { n: "2σ", label: "gap between classroom\nand personal tutoring" },
    cite: "— Bloom B.S., Educational Researcher, 1984",
    bridgeLabel: "How we implement this",
    mechanisms: [
      {
        icon: "⚡",
        color: "#4561E8",
        title: "Immediate feedback",
        body: "Mistakes are corrected the moment they happen, not a week later. The brain locks in the correct model while context is still fresh.",
      },
      {
        icon: "❓",
        color: "#9F7AFF",
        title: "Socratic method",
        body: "Mentora asks guiding questions instead of giving ready answers. Self-derived conclusions stick 3–4x better than passive reading.",
      },
      {
        icon: "🎯",
        color: "#FF7A00",
        title: "Mastery before moving on",
        body: "The next topic only opens once the current one is understood. Knowledge gaps don't accumulate.",
      },
      {
        icon: "🧠",
        color: "#10B981",
        title: "Retrieval practice",
        body: "After every explanation — a specific application question. Active recall instead of passive reading doubles long-term retention.",
      },
      {
        icon: "🎭",
        color: "#EC4899",
        title: "Adapts to you",
        body: "Style, pace and examples adjust to you — not to an average class. Learning becomes up to 5x more effective.",
      },
    ],
  },
};

export default function WhyMentoraWorks({ locale, variant = "landing" }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const c = CONTENT[locale] ?? CONTENT.ru;
  const isLanding = variant === "landing";
  const maxW = isLanding ? 1100 : 896;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: isDark
          ? "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(69,97,232,0.20) 0%, transparent 65%), rgba(0,0,0,0.08)"
          : "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(69,97,232,0.10) 0%, transparent 65%)",
        borderTop: `1px solid ${isDark ? "rgba(69,97,232,0.18)" : "rgba(69,97,232,0.12)"}`,
        borderBottom: `1px solid ${isDark ? "rgba(69,97,232,0.18)" : "rgba(69,97,232,0.12)"}`,
      }}
    >
      <style>{`
        @keyframes wmwOrbPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes wmwStatGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(69,97,232,0.25), 0 20px 60px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.10); }
          50% { box-shadow: 0 0 70px rgba(69,97,232,0.40), 0 20px 80px rgba(124,58,237,0.22), inset 0 1px 0 rgba(255,255,255,0.15); }
        }
        .wmw-card { transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1); cursor: default; }
        .wmw-card:hover { transform: translateY(-7px) !important; }
        .wmw-card:hover .wmw-glow { opacity: 1 !important; }
        .wmw-card:hover .wmw-icon-wrap { transform: scale(1.10); box-shadow: var(--wmw-icon-shadow-hover) !important; }
        .wmw-icon-wrap { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      `}</style>

      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{
          position: "absolute", top: "-15%", left: "-8%",
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(69,97,232,0.16), transparent 70%)",
          filter: "blur(55px)",
          animation: "wmwOrbPulse 7s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "-12%",
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.13), transparent 70%)",
          filter: "blur(50px)",
          animation: "wmwOrbPulse 9s ease-in-out infinite 2.5s",
        }} />
        <div style={{
          position: "absolute", bottom: "-8%", left: "35%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.09), transparent 70%)",
          filter: "blur(50px)",
          animation: "wmwOrbPulse 8s ease-in-out infinite 1s",
        }} />
      </div>

      <div
        style={{
          maxWidth: maxW,
          margin: "0 auto",
          padding: isLanding ? "80px 24px 72px" : "64px 20px 56px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Tag ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, rgba(69,97,232,0.18), rgba(124,58,237,0.10))",
            border: "1px solid rgba(69,97,232,0.32)",
            borderRadius: 100, padding: "6px 20px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase" as const, color: "#4561E8",
            boxShadow: "0 0 24px rgba(69,97,232,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#4561E8",
              boxShadow: "0 0 8px #4561E8",
              display: "inline-block",
            }} />
            {c.tag}
          </span>
        </div>

        {/* ── Heading ─────────────────────────────────────── */}
        <h2 style={{
          fontSize: isLanding ? "clamp(26px, 3.5vw, 40px)" : "clamp(24px, 3vw, 34px)",
          fontWeight: 900,
          textAlign: "center",
          color: "var(--text)",
          letterSpacing: "-0.7px",
          lineHeight: 1.15,
          maxWidth: 660,
          margin: "0 auto 16px",
        }}>
          {c.heading}
        </h2>

        {/* ── Lead ────────────────────────────────────────── */}
        <p style={{
          fontSize: 15,
          lineHeight: 1.75,
          color: "var(--text-secondary, var(--text-muted))",
          textAlign: "center",
          maxWidth: 580,
          margin: "0 auto 44px",
        }}>
          {c.lead}
        </p>

        {/* ── 2σ Centrepiece ──────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 52 }}>
          <div style={{
            position: "relative",
            background: isDark
              ? "linear-gradient(155deg, rgba(69,97,232,0.22), rgba(124,58,237,0.14) 55%, rgba(69,97,232,0.08))"
              : "linear-gradient(155deg, rgba(69,97,232,0.11), rgba(124,58,237,0.06) 55%, rgba(69,97,232,0.04))",
            border: "1px solid rgba(69,97,232,0.38)",
            borderRadius: 28,
            padding: "30px 52px 26px",
            textAlign: "center" as const,
            minWidth: 220,
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            animation: "wmwStatGlow 4s ease-in-out infinite",
          }}>
            {/* Inner top highlight */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "50%",
              borderRadius: "28px 28px 0 0",
              background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(69,97,232,0.28), transparent 75%)",
              pointerEvents: "none",
            }} />
            {/* Corner sparkles */}
            {(["3px", "3px", undefined, undefined] as const).map((top, i) => (
              <span key={i} aria-hidden style={{
                position: "absolute",
                top: i < 2 ? "12px" : undefined,
                bottom: i >= 2 ? "12px" : undefined,
                left: i % 2 === 0 ? "16px" : undefined,
                right: i % 2 === 1 ? "16px" : undefined,
                fontSize: 10,
                color: "#4561E8",
                opacity: 0.6,
              }}>✦</span>
            ))}

            {/* The big number */}
            <div style={{
              fontSize: 84,
              fontWeight: 900,
              lineHeight: 1,
              background: "linear-gradient(145deg, #4561E8 10%, #9F7AFF 55%, #6366F1 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 12,
              fontFamily: "ui-monospace, 'SF Mono', monospace",
              letterSpacing: "-4px",
              position: "relative" as const,
            }}>
              {c.stat.n}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 500,
              color: "var(--text-muted)", lineHeight: 1.5,
              whiteSpace: "pre-line" as const,
              marginBottom: 10,
            }}>
              {c.stat.label}
            </div>
            <div style={{
              display: "inline-block",
              fontSize: 10, color: "var(--text-muted)",
              opacity: 0.62, fontStyle: "italic",
              padding: "4px 10px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 100,
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {c.cite}
            </div>
          </div>
        </div>

        {/* ── Bridge label ────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(69,97,232,0.28))` }} />
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.16em",
            textTransform: "uppercase" as const,
            color: "#4561E8",
            whiteSpace: "nowrap" as const,
          }}>
            {c.bridgeLabel}
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, rgba(69,97,232,0.28), transparent)` }} />
        </div>

        {/* ── Mechanism cards ──────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 14,
        }}>
          {c.mechanisms.map((m) => (
            <div
              key={m.title}
              className="wmw-card"
              style={{
                /* Gradient border via 1.5px padding */
                padding: "1.5px",
                background: `linear-gradient(145deg, ${m.color}60 0%, ${m.color}18 45%, rgba(255,255,255,0.04) 100%)`,
                borderRadius: 22,
                position: "relative" as const,
              }}
            >
              {/* Hover glow ring */}
              <div
                className="wmw-glow"
                style={{
                  position: "absolute", inset: -1, borderRadius: 23,
                  background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${m.color}28, transparent 70%)`,
                  opacity: 0,
                  transition: "opacity 0.22s ease",
                  pointerEvents: "none",
                  filter: "blur(10px)",
                }}
              />
              {/* Card inner */}
              <div style={{
                background: isDark
                  ? `linear-gradient(155deg, ${m.color}10, ${m.color}03 55%, transparent), var(--bg-card, rgba(14,14,24,0.96))`
                  : `linear-gradient(155deg, ${m.color}07, ${m.color}02 55%, transparent), var(--bg-card, rgba(255,255,255,0.96))`,
                borderRadius: 20.5,
                padding: "24px 20px 22px",
                height: "100%",
                position: "relative" as const,
                overflow: "hidden",
              }}>
                {/* Corner spotlight */}
                <div style={{
                  position: "absolute", top: -24, right: -24,
                  width: 110, height: 110, borderRadius: "50%",
                  background: `radial-gradient(circle, ${m.color}28, transparent 68%)`,
                  filter: "blur(14px)",
                  pointerEvents: "none",
                }} />

                {/* Icon */}
                <div
                  className="wmw-icon-wrap"
                  style={{
                    width: 54, height: 54, borderRadius: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(135deg, ${m.color}32, ${m.color}10)`,
                    border: `1.5px solid ${m.color}45`,
                    fontSize: 26,
                    marginBottom: 18,
                    boxShadow: `0 6px 18px ${m.color}22, inset 0 1px 0 rgba(255,255,255,0.14)`,
                    /* CSS var for hover shadow */
                    ["--wmw-icon-shadow-hover" as string]: `0 10px 28px ${m.color}40, inset 0 1px 0 rgba(255,255,255,0.20)`,
                  } as React.CSSProperties}
                >
                  {m.icon}
                </div>

                {/* Title */}
                <div style={{
                  fontWeight: 800, fontSize: 14,
                  color: "var(--text)", marginBottom: 10,
                  lineHeight: 1.3,
                }}>
                  {m.title}
                </div>

                {/* Body */}
                <p style={{
                  fontSize: 12.5, lineHeight: 1.68,
                  color: "var(--text-secondary, var(--text-muted))",
                  margin: 0,
                }}>
                  {m.body}
                </p>

                {/* Bottom accent */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5,
                  background: `linear-gradient(90deg, ${m.color}65, ${m.color}20 60%, transparent)`,
                  borderRadius: "0 0 20px 20px",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
