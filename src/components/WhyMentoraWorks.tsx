"use client";
import { useTok } from "@/hooks/useTok";

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
        icon: "🎡",
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
        icon: "🎡",
        color: "#EC4899",
        title: "Adapts to you",
        body: "Style, pace and examples adjust to you — not to an average class. Learning becomes up to 5x more effective.",
      },
    ],
  },
};

export default function WhyMentoraWorks({ locale, variant = "landing" }: Props) {
  const { isDark } = useTok();
  const c = CONTENT[locale] ?? CONTENT.ru;

  const isLanding = variant === "landing";
  const maxW = isLanding ? 1100 : 896;

  return (
    <section
      style={{
        background: isDark ? "rgba(69,97,232,0.04)" : "rgba(69,97,232,0.03)",
        borderTop: `1px solid ${isDark ? "rgba(69,97,232,0.12)" : "rgba(69,97,232,0.10)"}`,
        borderBottom: `1px solid ${isDark ? "rgba(69,97,232,0.12)" : "rgba(69,97,232,0.10)"}`,
      }}
    >
      <div
        style={{
          maxWidth: maxW,
          margin: "0 auto",
          padding: isLanding ? "72px 24px" : "56px 20px",
        }}
      >
        {/* Tag */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(69,97,232,0.10)",
          border: "1px solid rgba(69,97,232,0.22)",
          borderRadius: 100, padding: "4px 14px",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase" as const, color: "#4561E8",
          marginBottom: 20,
        }}>
          {c.tag}
        </div>

        {/* Heading */}
        <h2 style={{
          fontSize: isLanding ? 34 : 26,
          fontWeight: 900,
          color: "var(--text)",
          letterSpacing: "-0.5px",
          marginBottom: 16,
          lineHeight: 1.15,
          maxWidth: 680,
        }}>
          {c.heading}
        </h2>

        {/* Lead + stat row */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 24, alignItems: "flex-start", marginBottom: 40 }}>
          <p style={{
            flex: "1 1 320px",
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--text-secondary, var(--text-muted))",
            margin: 0,
          }}>
            {c.lead}
          </p>

          {/* 2sigma stat pill */}
          <div style={{
            flex: "0 0 auto",
            background: isDark
              ? "linear-gradient(135deg, rgba(69,97,232,0.18), rgba(159,122,255,0.10))"
              : "linear-gradient(135deg, rgba(69,97,232,0.08), rgba(159,122,255,0.05))",
            border: `1px solid ${isDark ? "rgba(69,97,232,0.30)" : "rgba(69,97,232,0.20)"}`,
            borderRadius: 20,
            padding: "20px 28px",
            textAlign: "center" as const,
            minWidth: 160,
          }}>
            <div style={{
              fontSize: 48, fontWeight: 900,
              background: "linear-gradient(135deg, #4561E8, #9F7AFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {c.stat.n}
            </div>
            <div style={{
              fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45, whiteSpace: "pre-line" as const,
            }}>
              {c.stat.label}
            </div>
            <div style={{
              fontSize: 10, color: "var(--text-muted)", marginTop: 10,
              opacity: 0.7, fontStyle: "italic",
            }}>
              {c.cite}
            </div>
          </div>
        </div>

        {/* Mechanism cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 16,
        }}>
          {c.mechanisms.map((m) => (
            <div
              key={m.title}
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${m.color}12, ${m.color}04 60%, transparent), var(--bg-card, rgba(255,255,255,0.04))`
                  : `linear-gradient(135deg, ${m.color}08, ${m.color}02 60%, transparent), var(--bg-card, rgba(255,255,255,0.80))`,
                border: `1px solid ${m.color}28`,
                borderRadius: 18,
                padding: "20px 18px 18px",
                position: "relative" as const,
                overflow: "hidden",
                transition: "transform 0.18s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, ${m.color}28, ${m.color}10)`,
                border: `1px solid ${m.color}38`,
                fontSize: 20, marginBottom: 14,
              }}>
                {m.icon}
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
                {m.title}
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--text-secondary, var(--text-muted))", margin: 0 }}>
                {m.body}
              </p>

              <div style={{
                position: "absolute" as const, bottom: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${m.color}60, transparent)`,
                borderRadius: "0 0 18px 18px",
              }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
