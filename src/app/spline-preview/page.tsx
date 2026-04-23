"use client";

import { useState } from "react";
import SubjectCard3D from "@/components/SubjectCard3D";
import MeLogo from "@/components/MeLogo";

/* ─── tiny helpers ──────────────────────────────────────────────────────── */

function useHover() {
  const [on, set] = useState(false);
  return { on, bind: { onMouseEnter: () => set(true), onMouseLeave: () => set(false) } };
}

/* ─── 3D Pill ────────────────────────────────────────────────────────────── */

interface PillProps {
  children: React.ReactNode;
  from: string;
  to: string;
  glow: string;
}

function Pill3D({ children, from, to, glow }: PillProps) {
  const h = useHover();
  return (
    <div
      {...h.bind}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 18px",
        borderRadius: 99,
        background: `linear-gradient(155deg, ${from} 0%, ${to} 100%)`,
        boxShadow: h.on
          ? `0 1px 0 rgba(255,255,255,0.28) inset,
             0 -2px 0 rgba(0,0,0,0.35) inset,
             0 8px 28px ${glow},
             0 16px 56px ${glow}40,
             0 2px 6px rgba(0,0,0,0.55)`
          : `0 1px 0 rgba(255,255,255,0.18) inset,
             0 -2px 0 rgba(0,0,0,0.28) inset,
             0 4px 16px ${glow},
             0 8px 32px ${glow}30,
             0 2px 5px rgba(0,0,0,0.45)`,
        color: "#fff",
        fontSize: 15, fontWeight: 700,
        letterSpacing: "-0.01em",
        cursor: "default",
        transition: "transform 0.13s ease, box-shadow 0.13s ease",
        transform: h.on ? "translateY(-3px) scale(1.05)" : "none",
        userSelect: "none",
        fontFamily: "system-ui,sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/* ─── 3D Toggle ─────────────────────────────────────────────────────────── */

function Toggle3D({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);

  const TRACK_W = 56;
  const TRACK_H = 30;
  const THUMB = 22;
  const TRAVEL = TRACK_W - THUMB - 6; // px the thumb moves

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
         onClick={() => setOn(v => !v)}>
      {/* Track */}
      <div style={{
        position: "relative",
        width: TRACK_W, height: TRACK_H,
        borderRadius: 99,
        background: on
          ? "linear-gradient(135deg, #4561E8 0%, #2438B0 100%)"
          : "rgba(255,255,255,0.07)",
        border: `1px solid ${on ? "#4561E8" : "rgba(255,255,255,0.12)"}`,
        boxShadow: on
          ? `0 0 16px rgba(69,97,232,0.5), inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.08)`
          : `inset 0 2px 6px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.05)`,
        transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
        flexShrink: 0,
      }}>
        {/* Thumb — 3D sphere */}
        <div style={{
          position: "absolute",
          top: (TRACK_H - THUMB) / 2 - 1,
          left: on ? TRAVEL + 3 : 3,
          width: THUMB, height: THUMB,
          borderRadius: "50%",
          /* Lambertian sphere shading */
          background: on
            ? "radial-gradient(circle at 35% 32%, #E0EAFF 0%, #AABDFF 35%, #6B8FFF 65%, #2438B0 100%)"
            : "radial-gradient(circle at 35% 32%, #FFFFFF 0%, #D8D8D8 40%, #A0A0A0 75%, #606060 100%)",
          boxShadow: on
            ? `0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(69,97,232,0.4)`
            : `0 2px 8px rgba(0,0,0,0.4)`,
          transition: "left 0.2s cubic-bezier(.34,1.56,.64,1), background 0.2s",
          willChange: "left",
        }} />
      </div>

      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 500, fontFamily: "system-ui,sans-serif", userSelect: "none" }}>
        {label}
      </span>
    </div>
  );
}

/* ─── subject labels ─────────────────────────────────────────────────────── */

const LABELS: Record<string, string> = {
  "russian-history":  "Рус. история",
  "world-history":    "Мир. история",
  "mathematics":      "Математика",
  "physics":          "Физика",
  "chemistry":        "Химия",
  "biology":          "Биология",
  "russian-language": "Рус. язык",
  "literature":       "Литература",
  "english":          "Английский",
  "geography":        "География",
  "computer-science": "Информатика",
  "astronomy":        "Астрономия",
};

/* ─── Section wrapper ────────────────────────────────────────────────────── */

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.025)",
      overflow: "hidden",
      marginBottom: 32,
    }}>
      <div style={{ padding: "22px 24px 0" }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 4 }}>{title}</div>
        {desc && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{desc}</div>}
      </div>
      <div style={{ padding: "28px 24px 28px" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Comparison row (flat vs 3D) ────────────────────────────────────────── */

function FlatPill({ children, bg }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "7px 14px",
      borderRadius: 99,
      background: bg ?? "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.7)",
      fontSize: 14, fontWeight: 600,
      fontFamily: "system-ui,sans-serif",
      whiteSpace: "nowrap",
    }}>
      {children}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SplinePreviewPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
            Mentora · 3D UI эксперимент
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.2 }}>CSS 3D компоненты</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
            Потрогай — всё интерактивно. Оцени, что хочешь внедрить в продакшн.
          </p>
        </div>

        {/* ── Section 1: Header pills ── */}
        <Section
          title="Пиллы в шапке"
          desc="Стрик, ментов, сообщения, подписка — вместо текущих плоских SVG"
        >
          {/* Comparison */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
              Сейчас (плоские)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <FlatPill>47 дней</FlatPill>
              <FlatPill>1 240 мент</FlatPill>
              <FlatPill>3 сообщ.</FlatPill>
              <FlatPill bg="rgba(69,97,232,0.2)">Ultima</FlatPill>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
              3D версия (наведи курсор)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <Pill3D from="#FF6B35" to="#C62828" glow="rgba(255,80,0,0.55)">
                47 дней
              </Pill3D>
              <Pill3D from="#7C3AED" to="#4C1598" glow="rgba(124,58,237,0.55)">
                1 240 мент
              </Pill3D>
              <Pill3D from="#0EA5E9" to="#0870B0" glow="rgba(14,165,233,0.55)">
                3 сообщ.
              </Pill3D>
              <Pill3D from="#F59E0B" to="#92400E" glow="rgba(245,158,11,0.55)">
                Ultima
              </Pill3D>
            </div>
          </div>
        </Section>

        {/* ── Section 2: Toggles ── */}
        <Section
          title="Тумблеры — 3D переключатели"
          desc="Нажми — переключаются. Thumb со сферической подсветкой"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Toggle3D label="Тёмная тема" defaultOn={true} />
            <Toggle3D label="Уведомления" defaultOn={false} />
            <Toggle3D label="Звуковые эффекты" defaultOn={true} />
            <Toggle3D label="Анимации интерфейса" defaultOn={false} />
          </div>
        </Section>

        {/* ── Section 3: Subject icons — iOS glassmorphism ── */}
        <Section
          title="Иконки предметов — glassmorphism"
          desc="Твёрдая плитка + стеклянная карточка с SVG. Наведи — поднимается."
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {Object.keys(LABELS).map(id => (
              <SubjectCard3D key={id} id={id} label={LABELS[id]} size={64} />
            ))}
          </div>
        </Section>

        {/* ── Section 4: Header mockup ── */}
        <Section
          title="Шапка — как будет выглядеть в сборе"
          desc="Мокап верхней полосы с правильным логотипом и 3D элементами"
        >
          {/* Dark header bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px",
            borderRadius: 14,
            background: "rgba(6,6,15,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* Logo — правильный: белая M + синяя e (на тёмном фоне) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MeLogo height={22} colorM="rgba(255,255,255,0.97)" colorE="#4561E8" />
            </div>

            {/* Pills */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Pill3D from="#FF6B35" to="#C62828" glow="rgba(255,80,0,0.55)">
                47 дней
              </Pill3D>
              <Pill3D from="#4561E8" to="#2438B0" glow="rgba(69,97,232,0.55)">
                860 мент
              </Pill3D>
              <Pill3D from="#F59E0B" to="#92400E" glow="rgba(245,158,11,0.55)">
                Ultima
              </Pill3D>
            </div>
          </div>

          {/* Light header bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px",
            borderRadius: 14,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            marginTop: 12,
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MeLogo height={22} colorM="#1a1a1a" colorE="#4561E8" />
            </div>

            {/* Pills */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Pill3D from="#FF6B35" to="#C62828" glow="rgba(255,80,0,0.55)">
                47 дней
              </Pill3D>
              <Pill3D from="#4561E8" to="#2438B0" glow="rgba(69,97,232,0.55)">
                860 мент
              </Pill3D>
              <Pill3D from="#F59E0B" to="#92400E" glow="rgba(245,158,11,0.55)">
                Ultima
              </Pill3D>
            </div>
          </div>
        </Section>

        {/* Footer note */}
        <div style={{
          padding: "22px 24px",
          borderRadius: 14,
          background: "rgba(69,97,232,0.07)",
          border: "1px solid rgba(69,97,232,0.18)",
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#6B8FFF", marginBottom: 10 }}>
            Следующий шаг — твоё решение
          </div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.75 }}>
            Что нравится — скажи, интегрируем:<br />
            <strong style={{ color: "rgba(255,255,255,0.65)" }}>Пиллы в шапке</strong> — заменим стрик и ментов на 3D версии · <strong style={{ color: "rgba(255,255,255,0.65)" }}>Тумблер</strong> — заменим ThemeToggle · <strong style={{ color: "rgba(255,255,255,0.65)" }}>Иконки предметов</strong> — 3D карточки вместо плоских · <strong style={{ color: "rgba(255,255,255,0.65)" }}>Ничего</strong> — закрываем задачу
          </div>
        </div>

      </div>
    </div>
  );
}
