"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

/* ── Static non-localizable data ──────────────────────────────── */
const VALUE_META: { icon: string; color: string; custom?: "handsFlower" }[] = [
  { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", color: "#4561E8" },
  { icon: "", color: "#10B981", custom: "handsFlower" },
  { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", color: "#F59E0B" },
  { icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", color: "#A78BFA" },
];

const TIP_ACCENTS = ["#4561E8", "#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#FF7A00", "#9F7AFF"];
const HOW_COLORS = ["#4561E8", "#A78BFA", "#10B981", "#F59E0B"];
export default function AboutPage() {
  const t = useTranslations("about");

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

  /* ── Translated arrays ────────────────────────────────────────── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countdownLabels = t.raw("countdownLabels") as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const howSteps = t.raw("howSteps") as { n: string; title: string; desc: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compHeaders = t.raw("compHeaders") as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compRows = t.raw("compRows") as { criterion: string; search: string; ai: string; mentora: string; tutor: string; note: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valuesData = t.raw("values") as { title: string; desc: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tipsData = t.raw("tips") as { n: string; title: string; body: string; example: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timelineData = t.raw("timeline") as { q: string; label: string; desc: string; status?: "done" | "next" | "future" }[];

  /* ── Helpers ──────────────────────────────────────────────────── */
  function Tag({ children, color = "#4561E8" }: { children: React.ReactNode; color?: string }) {
    // Editorial-style section marker:
    // ●━━━ TITLE ─── (glowing dot + gradient connector + bracketed text)
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        {/* Glowing 3D dot */}
        <span aria-hidden style={{
          width: 8, height: 8, borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}99 65%, ${color}55)`,
          boxShadow: `0 0 12px ${color}88, 0 0 4px ${color}, inset 0 1px 1px rgba(255,255,255,0.4)`,
          flexShrink: 0,
        }} />
        {/* Gradient connector line */}
        <span aria-hidden style={{
          width: 32, height: 1.5, borderRadius: 1,
          background: `linear-gradient(90deg, ${color}, ${color}33 70%, transparent)`,
          flexShrink: 0,
        }} />
        {/* Label with monospaced § prefix */}
        <span style={{
          fontSize: 11, fontWeight: 800,
          letterSpacing: "0.18em", textTransform: "uppercase" as const,
          color,
          fontVariant: "small-caps",
        }}>
          {children}
        </span>
      </div>
    );
  }

  function Card({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
    return (
      <div className="relative overflow-hidden transition-transform hover:-translate-y-0.5" style={{
        background: accent
          ? "linear-gradient(160deg, rgba(124,58,237,0.10), rgba(69,97,232,0.04) 60%, transparent), var(--bg-card)"
          : "linear-gradient(160deg, rgba(255,122,0,0.06), rgba(255,255,255,0.01) 60%, transparent), var(--bg-card)",
        border: `1px solid ${accent ? "rgba(124,58,237,0.25)" : "rgba(255,122,0,0.20)"}`,
        borderRadius: 20,
        padding: "28px",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,${accent ? "0.08" : "0.05"})`,
      }}>
        {/* Spotlight */}
        <div className="absolute pointer-events-none" aria-hidden style={{
          top: -40, right: -40, width: 160, height: 160, opacity: 0.6,
          background: accent
            ? "radial-gradient(circle, rgba(124,58,237,0.30), transparent 65%)"
            : "radial-gradient(circle, rgba(255,122,0,0.25), transparent 65%)",
          filter: "blur(8px)",
        }} />
        <div className="relative">{children}</div>
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
      {/* Dark-mode ambient */}
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
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-14 pb-16 relative">
          {/* Decorative orbital ring */}
          <div className="absolute pointer-events-none hidden md:block" aria-hidden style={{
            top: 30, right: 0, width: 200, height: 200,
            borderRadius: "50%",
            background: "conic-gradient(from 90deg, transparent 0deg, rgba(124,58,237,0.18) 90deg, transparent 180deg, rgba(69,97,232,0.14) 270deg, transparent 360deg)",
            filter: "blur(20px)",
            opacity: 0.85,
          }} />
          <Tag color="#4561E8">{t("heroTag")}</Tag>
          <h1 style={{
            fontSize: "clamp(30px, 5vw, 52px)",
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: "-1.5px",
            margin: "20px 0 12px",
            background: "linear-gradient(135deg, var(--text) 30%, #4561E8 70%, #7C3AED 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {t("heroTitle1")}<br />
            <span style={{
              background: "linear-gradient(135deg, #4561E8, #7C3AED, #FF7A00)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{t("heroTitle2")}</span>
          </h1>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: 18 }}>
            {t("heroTagline")}
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--text-secondary)", maxWidth: 580 }}>
            {t("heroBody")}
          </p>
          {/* Stats chip row */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { v: "17", label: "наук", color: "#4561E8" },
              { v: "95%", label: "точность", color: "#10B981" },
              { v: "₽0", label: "стартовый", color: "#FF7A00" },
              { v: "8", label: "уровней", color: "#9F7AFF" },
            ].map(s => (
              <div key={s.label} style={{
                display: "inline-flex", alignItems: "baseline", gap: 6,
                padding: "8px 14px", borderRadius: 12,
                background: `linear-gradient(135deg, ${s.color}18, ${s.color}06)`,
                border: `1px solid ${s.color}30`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: s.color }}>{s.v}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{s.label}</span>
              </div>
            ))}
          </div>
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
                  {t("launchTag")}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                  {t("launchTitle")}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                  {t("launchBody")}
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
                    {t("launchGift")}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                {[countdown.days, countdown.hours, countdown.mins, countdown.secs].map((v, i) => (
                  <div key={i} style={{ textAlign: "center" as const }}>
                    <div style={{
                      fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900,
                      color: "var(--text)", lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "ui-monospace, monospace",
                    }}>{num(v)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{countdownLabels[i]}</div>
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
              <Tag color="#FF7A00">{t("problemTag")}</Tag>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "16px 0 10px", lineHeight: 1.25 }}>
                {t("problemTitle")}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                {t("problemBody")}
              </p>
            </Card>
            <Card accent>
              <Tag color="#4561E8">{t("solutionTag")}</Tag>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "16px 0 10px", lineHeight: 1.25 }}>
                {t("solutionTitle")}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                {t("solutionBody")}
              </p>
            </Card>
          </div>
        </section>

        {/* ── HOW LEARNING WORKS ───────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#A78BFA">{t("howTag")}</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 8px", letterSpacing: "-0.5px" }}>
            {t("howTitle")}
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
            {t("howSubtitle")}
          </p>

          <div className="space-y-3">
            {howSteps.map((item, idx) => {
              const c = HOW_COLORS[idx];
              return (
                <div key={item.n}
                  className="flex gap-5 p-5 rounded-2xl relative overflow-hidden transition-transform hover:translate-x-1"
                  style={{
                    background: `linear-gradient(135deg, ${c}10, ${c}03 60%, transparent), var(--bg-card)`,
                    border: `1px solid ${c}28`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: `linear-gradient(180deg, ${c}, ${c}40)` }} />
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(135deg, ${c}30, ${c}10)`,
                    border: `1px solid ${c}40`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 12px ${c}25`,
                    color: "#fff", fontSize: 13, fontWeight: 900,
                  }}>{item.n}</div>
                  <div className="flex-1">
                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 5 }}>{item.title}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── COMPARISON TABLE ──────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#10B981">{t("compTag")}</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 6px", letterSpacing: "-0.5px" }}>
            {t("compTitle")}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
            {t("compSubtitle")}
          </p>

          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {compHeaders.map((h, i) => (
                    <th key={h} style={{
                      padding: "10px 14px",
                      fontSize: 12, fontWeight: 700, textAlign: "left" as const,
                      color: i === 3 ? "#4561E8" : "var(--text-muted)",
                      background: i === 3
                        ? "linear-gradient(180deg, rgba(69,97,232,0.18) 0%, rgba(124,58,237,0.10) 50%, rgba(69,97,232,0.06) 100%), rgba(255,255,255,0.04)"
                        : "var(--bg-secondary)",
                      borderBottom: i === 3 ? "1px solid rgba(69,97,232,0.30)" : "1px solid var(--border)",
                      borderTop: "1px solid var(--border-light)",
                      borderLeft: i === 3 ? "1px solid rgba(69,97,232,0.28)" : i === 0 ? "1px solid var(--border-light)" : "none",
                      borderRight: i === 3 ? "1px solid rgba(69,97,232,0.28)" : i === 4 ? "1px solid var(--border-light)" : "none",
                      borderRadius: i === 0 ? "12px 0 0 0" : i === 4 ? "0 12px 0 0" : 0,
                      whiteSpace: "nowrap" as const,
                      letterSpacing: "0.03em",
                      backdropFilter: i === 3 ? "blur(10px) saturate(1.4)" : undefined,
                      WebkitBackdropFilter: i === 3 ? "blur(10px) saturate(1.4)" : undefined,
                      boxShadow: i === 3 ? "inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(124,58,237,0.20)" : undefined,
                    }}>
                      {i === 3 ? (
                        <span style={{
                          fontFamily: "var(--font-playfair), Georgia, serif",
                          fontWeight: 800,
                          fontSize: 14,
                          letterSpacing: "-0.01em",
                          color: "var(--text)",
                        }}>
                          M<span style={{ fontStyle: "italic", color: "#4561E8" }}>e</span>ntora
                        </span>
                      ) : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compRows.map((row, ri) => {
                  const isLast = ri === compRows.length - 1;
                  const cellStyle = (i: number, val: string): React.CSSProperties => ({
                    padding: "11px 14px",
                    fontSize: 13,
                    color: val === "✓" ? "#10B981"
                      : val === "✗" ? "var(--text-muted)"
                      : i === 3 ? "#4561E8"
                      : "var(--text-secondary)",
                    fontWeight: val === "✓" || val === "✗" ? 700 : 500,
                    background: i === 3
                      ? "linear-gradient(180deg, rgba(69,97,232,0.12) 0%, rgba(124,58,237,0.06) 50%, rgba(69,97,232,0.10) 100%), rgba(255,255,255,0.02)"
                      : ri % 2 === 0 ? "var(--bg-secondary)" : "transparent",
                    borderBottom: "1px solid var(--border-light)",
                    borderLeft: i === 3 ? "1px solid rgba(69,97,232,0.22)" : i === 0 ? "1px solid var(--border-light)" : "none",
                    borderRight: i === 3 ? "1px solid rgba(69,97,232,0.22)" : i === 4 ? "1px solid var(--border-light)" : "none",
                    borderRadius: isLast && i === 0 ? "0 0 0 12px" : isLast && i === 4 ? "0 0 12px 0" : 0,
                    backdropFilter: i === 3 ? "blur(8px) saturate(1.3)" : undefined,
                    WebkitBackdropFilter: i === 3 ? "blur(8px) saturate(1.3)" : undefined,
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
          <Tag color="#FF7A00">{t("valuesTag")}</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 24px", letterSpacing: "-0.5px" }}>{t("valuesTitle")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {valuesData.map((v, idx) => {
              const meta = VALUE_META[idx];
              return (
                <div key={v.title}
                  className="flex gap-4 p-5 rounded-2xl relative overflow-hidden transition-transform hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(160deg, ${meta.color}10, ${meta.color}04 60%, transparent), var(--bg-card)`,
                    border: `1px solid ${meta.color}30`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px ${meta.color}10`,
                  }}
                >
                  {/* Spotlight */}
                  <div className="absolute pointer-events-none" aria-hidden style={{
                    top: -25, right: -25, width: 90, height: 90, opacity: 0.55,
                    background: `radial-gradient(circle, ${meta.color}40, transparent 65%)`,
                    filter: "blur(6px)",
                  }} />
                  <div className="relative" style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${meta.color}38, ${meta.color}12)`,
                    border: `1px solid ${meta.color}48`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 14px ${meta.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {meta.custom === "handsFlower" ? (
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={meta.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        {/* Two cupped hands forming a bowl */}
                        <path d="M3 14c0-1.5 1-2.5 2-2.5s2 1 2 2.5v3c0 1.5-1 2.5-2 2.5h0a2 2 0 0 1-2-2v-3.5z" />
                        <path d="M21 14c0-1.5-1-2.5-2-2.5s-2 1-2 2.5v3c0 1.5 1 2.5 2 2.5h0a2 2 0 0 0 2-2v-3.5z" />
                        <path d="M7 17h10" />
                        {/* Flower stem */}
                        <path d="M12 11.5V8" />
                        {/* Two leaves */}
                        <path d="M12 9.5c-1-.5-2-.2-2.5.7" />
                        <path d="M12 9.5c1-.5 2-.2 2.5.7" />
                        {/* Flower petals (5) */}
                        <circle cx="12" cy="6" r="1.4" fill={meta.color} stroke="none" />
                        <circle cx="9.7" cy="5" r="1.1" fill={meta.color} stroke="none" />
                        <circle cx="14.3" cy="5" r="1.1" fill={meta.color} stroke="none" />
                        <circle cx="10.4" cy="3.2" r="1.1" fill={meta.color} stroke="none" />
                        <circle cx="13.6" cy="3.2" r="1.1" fill={meta.color} stroke="none" />
                        <circle cx="12" cy="4.6" r="0.7" fill="#FBBF24" stroke="none" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={meta.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={meta.icon} />
                      </svg>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 5 }}>{v.title}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── GUIDE ────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#4561E8">{t("guideTag")}</Tag>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: "16px 0 6px", letterSpacing: "-0.5px" }}>
            {t("guideTitle")}{" "}
            <span style={{ fontStyle: "italic", fontFamily: "var(--font-playfair), Georgia, serif" }}>
              M<span style={{ color: "#4561E8", fontStyle: "italic", marginRight: "0.02em" }}>e</span>ntora
            </span>
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
            {t("guideSubtitle")}
          </p>
          <div className="space-y-3">
            {tipsData.map((tip, idx) => {
              const accent = TIP_ACCENTS[idx];
              return (
                <div key={tip.n}
                  className="relative rounded-2xl border overflow-hidden"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: `linear-gradient(180deg, ${accent}, ${accent}55)` }} />
                  <div className="flex items-start gap-4 p-5 pl-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: accent }}>{tip.n}</span>
                        <span className="font-bold text-[15px]" style={{ color: "var(--text)" }}>{tip.title}</span>
                      </div>
                      <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>{tip.body}</p>
                      <div className="inline-flex items-start gap-1.5 px-3 py-1.5 rounded-xl text-sm italic"
                        style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", borderLeft: `2px solid ${accent}40` }}>
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        {tip.example}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── ROADMAP — investor-grade timeline ──────────────── */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-14">
          <Tag color="#6366F1">{t("roadmapTag")}</Tag>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", margin: "16px 0 6px", letterSpacing: "-0.5px" }}>{t("roadmapTitle")}</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
            {t("roadmapSubtitle")}
          </p>

          <div className="relative">
            {/* Vertical track gradient line */}
            <div className="absolute left-[18px] sm:left-[22px] top-2 bottom-2 w-px pointer-events-none" aria-hidden
              style={{ background: "linear-gradient(180deg, transparent, rgba(99,102,241,0.30) 8%, rgba(99,102,241,0.30) 92%, transparent)" }} />

            <div className="space-y-4">
              {timelineData.map((item) => {
                const status = item.status ?? "future";
                const isDone = status === "done";
                const isNext = status === "next";
                // Color theming
                const accent = isNext ? "#6366F1" : isDone ? "#10B981" : "#9F7AFF";
                const cardBg = isNext
                  ? "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(124,58,237,0.10) 50%, rgba(69,97,232,0.06) 100%), var(--bg-card)"
                  : isDone
                  ? "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.04) 60%, transparent), var(--bg-card)"
                  : "var(--bg-card)";
                const borderColor = isNext ? "rgba(99,102,241,0.45)" : isDone ? "rgba(16,185,129,0.32)" : "var(--border)";
                const dotShadow = isNext
                  ? `0 0 0 4px rgba(99,102,241,0.18), 0 0 22px ${accent}90`
                  : isDone ? `0 0 14px rgba(16,185,129,0.55)` : "none";
                return (
                  <div key={item.q} className="relative pl-12 sm:pl-14">
                    {/* Node dot */}
                    <div className="absolute left-3 sm:left-4 top-5 w-4 h-4 rounded-full" style={{
                      background: isDone || isNext ? accent : "var(--bg-card)",
                      border: isDone || isNext ? "none" : `1.5px solid var(--border)`,
                      boxShadow: dotShadow,
                      zIndex: 2,
                    }}>
                      {isDone && (
                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", inset: 2 }}>
                          <path d="M3 8l3 3 7-7" />
                        </svg>
                      )}
                    </div>
                    {/* Pulse ring on next */}
                    {isNext && (
                      <span className="absolute left-3 sm:left-4 top-5 w-4 h-4 rounded-full pointer-events-none" aria-hidden
                        style={{
                          animation: "mentoraPulse 2s ease-out infinite",
                          background: "transparent",
                          boxShadow: `0 0 0 0 ${accent}80`,
                        }}
                      />
                    )}

                    {/* Card */}
                    <div className="relative rounded-2xl p-5 overflow-hidden transition-transform hover:-translate-y-0.5"
                      style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                        backdropFilter: isNext ? "blur(16px) saturate(1.4)" : "blur(10px) saturate(1.2)",
                        WebkitBackdropFilter: isNext ? "blur(16px) saturate(1.4)" : "blur(10px) saturate(1.2)",
                        boxShadow: isNext
                          ? `0 14px 44px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.10)`
                          : "0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
                      }}>
                      {/* Spotlight on next */}
                      {isNext && (
                        <div className="absolute pointer-events-none" aria-hidden style={{
                          top: -50, right: -50, width: 220, height: 220, opacity: 0.55,
                          background: `radial-gradient(circle, ${accent}55, transparent 65%)`,
                          filter: "blur(20px)",
                        }} />
                      )}

                      <div className="flex items-start justify-between gap-3 flex-wrap relative">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide" style={{
                              background: isNext ? `linear-gradient(135deg, ${accent}, #7C3AED)` : isDone ? `${accent}1c` : "var(--bg-secondary)",
                              color: isNext ? "white" : isDone ? accent : "var(--text-muted)",
                              boxShadow: isNext ? `0 4px 12px ${accent}40` : "none",
                              border: isDone && !isNext ? `1px solid ${accent}30` : "none",
                              letterSpacing: "0.02em",
                            }}>
                              {item.q}
                            </span>
                            {isDone && (
                              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: accent }}>
                                ✓ {t("roadmapDone")}
                              </span>
                            )}
                            {isNext && (
                              <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{
                                color: "white",
                                background: `linear-gradient(135deg, ${accent}, #7C3AED)`,
                                padding: "3px 8px", borderRadius: 8,
                                boxShadow: `0 0 16px ${accent}80`,
                              }}>
                                {t("roadmapNext")}
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: isNext ? 18 : 15,
                            fontWeight: isNext ? 900 : 700,
                            color: "var(--text)",
                            marginBottom: 4,
                            letterSpacing: "-0.01em",
                          }}>
                            {item.label}
                          </div>
                          <p style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            lineHeight: 1.55,
                            opacity: status === "future" ? 0.78 : 1,
                          }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <style jsx>{`
            @keyframes mentoraPulse {
              0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.55); }
              70%  { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
              100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
            }
          `}</style>
        </section>

        {/* ── ULTIMA NOTE ──────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-14">
          <div className="relative overflow-hidden" style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(252,211,77,0.06) 50%, transparent), var(--bg-card)",
            border: "1px solid rgba(245,158,11,0.32)",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 18px rgba(245,158,11,0.10)",
          }}>
            {/* gold spotlight */}
            <div className="absolute pointer-events-none" aria-hidden style={{
              top: -25, right: -25, width: 120, height: 120, opacity: 0.55,
              background: "radial-gradient(circle, rgba(252,211,77,0.55), transparent 65%)",
              filter: "blur(10px)",
            }} />
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>{t("ultimaTag")}</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {t("ultimaBody")}
              </p>
            </div>
          </div>
        </section>

        {/* ── Support section ──────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-10">
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: 16 }}>
            {t("supportTag")}
          </h2>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(69,97,232,0.18)" }}>
            {/* Top gradient strip */}
            <div style={{ height: 3, background: "linear-gradient(90deg, #4561E8, #9F7AFF, #f59e0b)" }} />

            <div className="p-6" style={{ background: "linear-gradient(135deg, rgba(69,97,232,0.06) 0%, rgba(159,122,255,0.04) 100%)" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(69,97,232,0.12)", border: "1px solid rgba(69,97,232,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#4561E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                    {t("supportTitle")}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {t("supportSubtitle")}
                  </p>
                </div>
              </div>

              {/* Two columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Donation */}
                <div className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>
                    {t("donateTitle")}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 12 }}>
                    {t("donateBody")}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                    <a
                      href="https://boosty.to/mentora/donate"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 600,
                        padding: "8px 14px", borderRadius: 10,
                        background: "#f97316", color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      {t("boostyBtn")}
                    </a>
                    <a
                      href="https://ko-fi.com/mentora"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 600,
                        padding: "8px 14px", borderRadius: 10,
                        background: "#29ABE0", color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682-.562-.947-1.35l.006-.055c.078-.564.643-2.699-1.29-3.245 0 0 1.496-1.466 3.752-.105 1.744 1.061 1.454 3.386-.521 4.755z"/>
                      </svg>
                      {t("kofiBtn")}
                    </a>
                    <a
                      href="https://t.me/mentora_su_bot?start=donate"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 600,
                        padding: "8px 14px", borderRadius: 10,
                        background: "linear-gradient(135deg, #2AABEE, #229ED9)",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.461c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.604.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.605l-2.95-.924c-.642-.2-.654-.642.136-.951l11.527-4.448c.537-.194 1.006.131.609.966z"/>
                      </svg>
                      {t("tgStarsBtn")}
                    </a>
                  </div>
                </div>

                {/* Investor / Partner */}
                <div className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>
                    {t("investTitle")}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 12 }}>
                    {t("investBody")}
                  </p>
                  <a
                    href="mailto:hello@mentora.su?subject=Инвестиции / партнёрство"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 12, fontWeight: 600,
                      padding: "8px 14px", borderRadius: 10,
                      background: "linear-gradient(135deg, #4561E8, #7C3AED)",
                      color: "#fff",
                      textDecoration: "none",
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {t("contactBtn")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-4 text-center">
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
            {t("ctaNote")}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" as const }}>
            <a href="mailto:hello@mentora.su" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "underline", textDecorationStyle: "dotted" as const }}>
              hello@mentora.su
            </a>
            <span style={{ color: "var(--border)" }}>·</span>
            <a href="https://t.me/mentora_su_bot" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 500, color: "#2AABEE", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="#2AABEE">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.461c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.604.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.605l-2.95-.924c-.642-.2-.654-.642.136-.951l11.527-4.448c.537-.194 1.006.131.609.966z"/>
              </svg>
              {t("supportBtn")}
            </a>
            <span style={{ color: "var(--border)" }}>·</span>
            <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 500, color: "#4561E8" }}>
              {t("backBtn")}
            </Link>
          </div>
        </section>

      </div>

      {/* Floating "Пригласить" CTA */}
      <a
        href="https://t.me/share/url?url=https://mentora.su&text=Mentora — твой персональный AI-ментор по 17 наукам"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="Пригласить друга"
        style={{ pointerEvents: "auto" }}
      >
        <div
          className="flex items-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 group-hover:scale-[1.04] group-active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #4561E8 0%, #6366F1 50%, #7C3AED 100%)",
            boxShadow: "0 12px 36px rgba(69,97,232,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset, 0 1px 0 rgba(255,255,255,0.20) inset",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6M23 11h-6" />
          </svg>
          Пригласить
        </div>
      </a>
    </div>
  );
}
