"use client";

import { useEffect, useState, useCallback, createContext, useContext, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

// ── Pricing ───────────────────────────────────────────────────────────────────
const PRO_M = 399, PRO_Y = 2990, ULT_M = 799, ULT_Y = 5990;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  users: { total: number; pro: number; ultima: number; free: number; newToday: number; activeToday: number; activeWeek: number; trialExpired: number };
  chat:  { totalMessages: number; messagesToday: number; userMessagesWeek: number; aiResponsesWeek: number; aiResponseRate: number; topSubjects: { subject: string; count: number }[] };
  billing: { activeSubscriptions: number };
  knowledge: { chunks: number };
  recentUsers: UserRow[];
  generatedAt: string;
}
interface UserRow {
  id: string; email: string; plan: string; created_at: string;
  last_active_at: string | null; messages_today: number;
  messages_total?: number; subjects_count?: number;
  trial_expires_at: string | null; referred_by: string | null;
}
interface ChunkRow {
  id: string; subject: string; topic: string | null; content: string; source: string | null; created_at: string;
}

// ── Fixed accent colours (same in both themes) ────────────────────────────────
const BRAND = "#4561E8";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const RED   = "#ef4444";

// ── Theme token sets ──────────────────────────────────────────────────────────
interface Tok {
  BG: string; SIDE: string; CARD: string; BOR: string; TEXT: string; MUTED: string;
  SHADOW: string; GLASS: string;
  isDark: boolean;
  inp: React.CSSProperties;
}

const darkTok: Tok = {
  BG:     "#07080e",
  SIDE:   "#0c0e1a",
  CARD:   "rgba(255,255,255,0.038)",
  BOR:    "rgba(255,255,255,0.08)",
  TEXT:   "#e2e8f0",
  MUTED:  "#64748b",
  SHADOW: "none",
  GLASS:  "blur(0px)",
  isDark: true,
  inp: { padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" as const },
};

const lightTok: Tok = {
  BG:     "linear-gradient(135deg, #eef2ff 0%, #f5f0ff 50%, #eff6ff 100%)",
  SIDE:   "rgba(255,255,255,0.72)",
  CARD:   "rgba(255,255,255,0.62)",
  BOR:    "rgba(69,97,232,0.13)",
  TEXT:   "#1a2340",
  MUTED:  "#7284a8",
  SHADOW: "0 2px 16px rgba(69,97,232,0.08), 0 1px 4px rgba(69,97,232,0.06)",
  GLASS:  "blur(16px) saturate(1.6)",
  isDark: false,
  inp: { padding: "9px 12px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(69,97,232,0.18)", borderRadius: 10, color: "#1a2340", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" as const },
};

// ── Token context ─────────────────────────────────────────────────────────────
const TokCtx = createContext<Tok>(darkTok);
const useTok = () => useContext(TokCtx);

// ── Utils ─────────────────────────────────────────────────────────────────────
const N = (n: number, sfx = "") => n.toLocaleString("ru-RU") + sfx;
const R = (n: number) => N(n) + " ₽";
function ago(iso: string | null) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 120) return "только что";
  if (s < 3600) return Math.floor(s / 60) + " мин";
  if (s < 86400) return Math.floor(s / 3600) + " ч";
  return Math.floor(s / 86400) + " дн";
}
function planMeta(p: string) {
  if (p === "ultima") return { l: "Ultima", c: "#a78bfa" };
  if (p === "pro")    return { l: "Pro",    c: "#60a5fa" };
  return { l: "Free", c: "#94a3b8" };
}

// ── SUBJECT names ─────────────────────────────────────────────────────────────
const SN: Record<string, string> = {
  "russian-history":"История РФ","world-history":"Всемирная история","mathematics":"Математика",
  "physics":"Физика","chemistry":"Химия","biology":"Биология","russian-language":"Русский язык",
  "literature":"Литература","english":"Английский","social-studies":"Обществознание",
  "geography":"География","computer-science":"Информатика","astronomy":"Астрономия",
};
const SUBS = Object.keys(SN);

// ── Primitive components ──────────────────────────────────────────────────────
function Card({ ch, style }: { ch: React.ReactNode; style?: React.CSSProperties }) {
  const { CARD, BOR, SHADOW, GLASS } = useTok();
  return <div style={{ background: CARD, border: `1px solid ${BOR}`, borderRadius: 16, padding: "20px 24px", backdropFilter: GLASS, WebkitBackdropFilter: GLASS, boxShadow: SHADOW, ...style }}>{ch}</div>;
}
function Metric({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  const { TEXT, MUTED } = useTok();
  const c = color ?? TEXT;
  return <Card ch={<>
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 8 }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 700, color: c, lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{typeof value === "number" ? N(value) : value}</p>
    {sub && <p style={{ fontSize: 12, color: MUTED }}>{sub}</p>}
  </>} />;
}
function Badge({ plan }: { plan: string }) {
  const { l, c } = planMeta(plan);
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: c + "20", border: `1px solid ${c}40`, color: c }}>{l}</span>;
}
function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick(): void }) {
  const { MUTED, isDark, SHADOW } = useTok();
  const activeBg = isDark ? BRAND+"22" : "rgba(69,97,232,0.1)";
  const activeColor = isDark ? "#a0b4ff" : BRAND;
  const activeShadow = isDark ? "none" : "0 1px 8px rgba(69,97,232,0.12)";
  return <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: active && !isDark ? `1px solid rgba(69,97,232,0.18)` : "1px solid transparent", cursor: "pointer", background: active ? activeBg : "transparent", color: active ? activeColor : MUTED, fontSize: 14, fontWeight: active ? 600 : 400, transition: "all .15s", outline: "none", boxShadow: active ? activeShadow : "none" }}>
    <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>{label}
  </button>;
}
function TH({ label }: { label: string }) {
  const { BOR, MUTED } = useTok();
  return <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 500, borderBottom: `1px solid ${BOR}`, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED }}>{label}</th>;
}
function TD({ children, color, muted = false }: { children: React.ReactNode; color?: string; muted?: boolean }) {
  const { TEXT, MUTED } = useTok();
  return <td style={{ padding: "10px 14px", color: muted ? MUTED : (color ?? TEXT), fontSize: 13 }}>{children}</td>;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const IGrid    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IUsers   = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IRevenue = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IKb      = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const ITeam    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="19" cy="4" r="2" fill="currentColor" stroke="none" opacity="0.6"/></svg>;
const IRefresh = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const ISearch  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

// ── Team Tab ──────────────────────────────────────────────────────────────────
interface Employee {
  id: string;
  name: string;
  role: string;
  desc: string;
  color: string;
  available: boolean;
  avatar: string; // initials
}

const EMPLOYEES: Employee[] = [
  { id: "marketing", name: "Ника",  role: "Маркетолог",    desc: "Instagram, контент, тренды, рилсы", color: "#e8458a", available: true,  avatar: "Н" },
  { id: "analytics", name: "Миша",  role: "Аналитик",      desc: "PostHog, воронки, когорты, метрики", color: "#4561E8", available: true,  avatar: "М" },
  { id: "growth",    name: "Саша",  role: "Growth Hacker",  desc: "Конверсии, виральность, эксперименты", color: "#10b981", available: true, avatar: "С" },
];

interface Msg { role: "user" | "assistant"; content: string; ts?: number }

function chatKey(empId: string) { return `mentora_admin_chat_${empId}`; }

function loadHistory(empId: string): Msg[] {
  try { return JSON.parse(localStorage.getItem(chatKey(empId)) ?? "[]"); }
  catch { return []; }
}

function saveHistory(empId: string, msgs: Msg[]) {
  // Keep last 200 messages to avoid localStorage bloat
  const trimmed = msgs.slice(-200);
  localStorage.setItem(chatKey(empId), JSON.stringify(trimmed));
}

function TeamTab() {
  const { CARD, BOR, TEXT, MUTED, inp, isDark, SHADOW, GLASS } = useTok();
  const [selected, setSelected] = useState<Employee | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const openChat = (emp: Employee) => {
    setSelected(emp);
    setMessages(loadHistory(emp.id));
    setInput("");
  };

  const clearHistory = () => {
    if (!selected) return;
    localStorage.removeItem(chatKey(selected.id));
    setMessages([]);
  };

  const send = async () => {
    if (!selected || !input.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: input.trim(), ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    saveHistory(selected.id, next);
    setInput("");
    setStreaming(true);

    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send only role+content to API (no ts field)
      body: JSON.stringify({ employeeId: selected.id, messages: next.map(m => ({ role: m.role, content: m.content })) }),
    });

    if (!res.body) { setStreaming(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";

    setMessages(prev => [...prev, { role: "assistant", content: "", ts: Date.now() }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: text };
        return copy;
      });
    }

    // Save final state with completed assistant message
    setMessages(prev => {
      saveHistory(selected.id, prev);
      return prev;
    });
    setStreaming(false);
  };

  // Employee list view
  if (!selected) {
    return (
      <div>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
          Выбери сотрудника — откроется чат с ним. Каждый знает свою роль и контекст Mentora.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {EMPLOYEES.map(emp => (
            <div
              key={emp.id}
              onClick={() => emp.available && openChat(emp)}
              style={{
                background: CARD, border: `1px solid ${BOR}`, borderRadius: 16,
                padding: "20px 22px", cursor: emp.available ? "pointer" : "default",
                backdropFilter: GLASS, WebkitBackdropFilter: GLASS, boxShadow: SHADOW,
                opacity: emp.available ? 1 : 0.5,
                transition: "transform 0.15s, box-shadow 0.15s",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => { if (emp.available) { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
            >
              {/* Colour accent line */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: emp.color, opacity: 0.7 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: emp.color + "22", border: `1px solid ${emp.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700, color: emp.color,
                }}>{emp.avatar}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT }}>{emp.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: emp.color, fontWeight: 600, letterSpacing: "0.04em" }}>{emp.role}</p>
                </div>
                {!emp.available && (
                  <span style={{ marginLeft: "auto", fontSize: 10, padding: "3px 8px", borderRadius: 99, background: MUTED + "22", color: MUTED, fontWeight: 600 }}>Скоро</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{emp.desc}</p>
              {emp.available && (() => {
                const hist = typeof window !== "undefined" ? loadHistory(emp.id) : [];
                return (
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: emp.color, fontWeight: 600 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: emp.color }} />
                      {hist.length > 0 ? `${hist.length} сообщ.` : "Открыть чат"} →
                    </div>
                    {hist.length > 0 && (
                      <span style={{ fontSize: 10, color: MUTED }}>
                        {new Date(hist[hist.length - 1].ts ?? 0).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                );
              })()}
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Chat view
  const emp = selected;
  const msgBg = (role: "user" | "assistant") =>
    role === "user"
      ? isDark ? "rgba(69,97,232,0.18)" : "rgba(69,97,232,0.10)"
      : isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${BOR}` }}>
        <button
          onClick={() => setSelected(null)}
          style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${BOR}`, background: "transparent", color: MUTED, cursor: "pointer", fontSize: 13 }}
        >← Назад</button>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: emp.color + "22",
          border: `1px solid ${emp.color}44`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 15, fontWeight: 700, color: emp.color,
        }}>{emp.avatar}</div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{emp.name}</p>
          <p style={{ margin: 0, fontSize: 11, color: emp.color, fontWeight: 600 }}>{emp.role}</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22c55e" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            {messages.length > 0 ? `${messages.length} сообщ.` : "онлайн"}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              title="Очистить историю"
              style={{ padding: "4px 10px", borderRadius: 7, border: `1px solid rgba(239,68,68,0.25)`, background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", opacity: 0.7 }}
            >Очистить</button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: emp.color + "22", border: `1px solid ${emp.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: emp.color, margin: "0 auto 12px" }}>{emp.avatar}</div>
            </div>
            <p style={{ color: TEXT, fontWeight: 600, fontSize: 15, margin: "0 0 6px" }}>Чат с {emp.name}</p>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{emp.desc}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msgBg(m.role),
              border: `1px solid ${m.role === "user" ? BRAND + "33" : BOR}`,
              fontSize: 13.5, lineHeight: 1.6, color: TEXT,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {m.content || (streaming && i === messages.length - 1 ? <span style={{ opacity: 0.5 }}>...</span> : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Написать ${emp.name}...`}
          disabled={streaming}
          style={{ ...inp, flex: 1 }}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          style={{
            padding: "9px 18px", borderRadius: 10, border: "none",
            background: streaming || !input.trim() ? MUTED : emp.color,
            color: "white", cursor: streaming || !input.trim() ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}
        >{streaming ? "..." : "→"}</button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type Tab = "overview" | "users" | "revenue" | "knowledge" | "team";

export default function AdminPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tok = isDark ? darkTok : lightTok;
  const { BG, SIDE, CARD, BOR, TEXT, MUTED } = tok;

  const [tab, setTab]         = useState<Tab>("overview");
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/stats"); if (r.ok) setStats(await r.json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Revenue calc (70% monthly / 30% yearly assumed)
  const pro = stats?.users.pro ?? 0, ult = stats?.users.ultima ?? 0;
  const mrrPro  = Math.round(pro * (PRO_M * 0.7 + (PRO_Y / 12) * 0.3));
  const mrrUlt  = Math.round(ult * (ULT_M * 0.7 + (ULT_Y / 12) * 0.3));
  const mrr     = mrrPro + mrrUlt;
  const arr     = mrr * 12;

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "overview",  icon: IGrid,    label: "Обзор" },
    { id: "users",     icon: IUsers,   label: "Пользователи" },
    { id: "revenue",   icon: IRevenue, label: "Доходы" },
    { id: "knowledge", icon: IKb,      label: "База знаний" },
    { id: "team",      icon: ITeam,    label: "Команда" },
  ];

  return (
    <TokCtx.Provider value={tok}>
      <div style={{ display: "flex", minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui,-apple-system,sans-serif", position: "relative" }}>
        {/* Light-mode ambient orbs */}
        {!isDark && <>
          <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(69,97,232,0.13) 0%, transparent 70%)", top: -100, left: 80, pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(159,122,255,0.10) 0%, transparent 70%)", top: 200, right: 100, pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "fixed", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,213,0.08) 0%, transparent 70%)", bottom: 50, left: 300, pointerEvents: "none", zIndex: 0 }} />
        </>}

        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0, background: SIDE, borderRight: `1px solid ${BOR}`, padding: "24px 14px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh", zIndex: 10, backdropFilter: isDark ? "none" : "blur(20px) saturate(1.8)", WebkitBackdropFilter: isDark ? "none" : "blur(20px) saturate(1.8)", boxShadow: isDark ? "none" : "2px 0 24px rgba(69,97,232,0.1), 1px 0 0 rgba(69,97,232,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 14px 24px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: BRAND, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div><p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Mentora</p><p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Admin · только ты</p></div>
          </div>

          {TABS.map(t => <NavBtn key={t.id} icon={t.icon} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />)}

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: `1px solid ${BOR}`, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: MUTED }}>{isDark ? "Тёмная" : "Светлая"}</span>
            <ThemeToggle />
          </div>

          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", color: MUTED, fontSize: 13, textDecoration: "none", borderRadius: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
            На сайт
          </Link>
          {stats && <p style={{ fontSize: 10, color: MUTED, padding: "2px 14px", opacity: 0.4 }}>{new Date(stats.generatedAt).toLocaleTimeString("ru-RU")}</p>}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", minWidth: 0, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{TABS.find(t => t.id === tab)?.label}</h1>
              <p style={{ fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 0 }}>mentora.su / admin</p>
            </div>
            {tab !== "team" && (
              <button onClick={reload} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: `1px solid ${BOR}`, background: CARD, color: MUTED, fontSize: 13, cursor: "pointer" }}>
                {IRefresh} Обновить
              </button>
            )}
          </div>

          {loading && <p style={{ color: MUTED }}>Загрузка...</p>}

          {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
          {!loading && stats && tab === "overview" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
              <Metric label="Пользователей"     value={stats.users.total}       sub={`+${stats.users.newToday} сегодня`} />
              <Metric label="Активны сегодня"   value={stats.users.activeToday} sub={`неделя: ${N(stats.users.activeWeek)}`} color={GREEN} />
              <Metric label="Сообщений сегодня" value={stats.chat.messagesToday} sub={`всего: ${N(stats.chat.totalMessages)}`} />
              <Metric label="MRR (оценка)"      value={R(mrr)} sub={`Pro×${pro} + Ultima×${ult}`} color="#a78bfa" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
              <Metric label="Pro"    value={stats.users.pro}    sub={`≈${R(mrrPro)}/мес`} color="#60a5fa" />
              <Metric label="Ultima" value={stats.users.ultima} sub={`≈${R(mrrUlt)}/мес`} color="#a78bfa" />
              <Metric label="Free"   value={stats.users.free}   sub={`Пробный истёк: ${stats.users.trialExpired}`} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <Card ch={<>
                <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>AI за 7 дней</p>
                {[
                  ["Запросов пользователей", N(stats.chat.userMessagesWeek)],
                  ["Ответов AI",             N(stats.chat.aiResponsesWeek)],
                  ["Скорость ответа",        stats.chat.aiResponseRate + "%"],
                  ["Чанков в базе",          N(stats.knowledge.chunks)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BOR}` }}>
                    <span style={{ fontSize: 13, color: MUTED }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{v}</span>
                  </div>
                ))}
              </>} />

              <Card ch={<>
                <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Топ предметов (30 дн)</p>
                {stats.chat.topSubjects.map(({ subject, count }, i) => {
                  const max = stats.chat.topSubjects[0]?.count ?? 1;
                  return (
                    <div key={subject} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: TEXT }}>{SN[subject] ?? subject}</span>
                        <span style={{ fontSize: 12, color: MUTED }}>{N(count)}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: BOR }}>
                        <div style={{ height: "100%", width: (count/max*100) + "%", borderRadius: 99, background: i === 0 ? BRAND : BRAND+"70", transition: "width .4s" }} />
                      </div>
                    </div>
                  );
                })}
              </>} />
            </div>

            <Card ch={<>
              <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Последние регистрации</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["Email","Тариф","Регистрация","Последний визит","Сообщ. сегодня"].map(h => <TH key={h} label={h} />)}</tr></thead>
                <tbody>{stats.recentUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${BOR}` }}>
                    <TD>{u.email}</TD>
                    <TD><Badge plan={u.plan} /></TD>
                    <TD muted>{ago(u.created_at)} назад</TD>
                    <TD muted>{ago(u.last_active_at)} назад</TD>
                    <TD color={u.messages_today > 0 ? GREEN : MUTED}>{u.messages_today || "—"}</TD>
                  </tr>
                ))}</tbody>
              </table>
            </>} />
          </>}

          {/* ── USERS ────────────────────────────────────────────────────────── */}
          {tab === "users" && <UsersTab />}

          {/* ── REVENUE ──────────────────────────────────────────────────────── */}
          {!loading && stats && tab === "revenue" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
              <Metric label="MRR (оценка)" value={R(mrr)} sub="Monthly Recurring Revenue" color={GREEN} />
              <Metric label="ARR (оценка)" value={R(arr)} sub="Annual Run Rate" color={GREEN} />
              <Metric label="Платящих"     value={pro + ult} sub={`из ${N(stats.users.total)} пользователей`} color="#f472b6" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <Card ch={<>
                <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Разбивка по тарифам</p>
                {[
                  { l: "Pro ежемес. (399₽)",    n: Math.round(pro * .7), mrr: Math.round(pro * .7 * PRO_M), c: "#60a5fa" },
                  { l: "Pro годовой (249₽/мес)", n: Math.round(pro * .3), mrr: Math.round(pro * .3 * PRO_Y/12), c: "#60a5fa88" },
                  { l: "Ultima ежемес. (799₽)",  n: Math.round(ult * .7), mrr: Math.round(ult * .7 * ULT_M), c: "#a78bfa" },
                  { l: "Ultima годовой (499₽)",  n: Math.round(ult * .3), mrr: Math.round(ult * .3 * ULT_Y/12), c: "#a78bfa88" },
                ].map(r => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${BOR}` }}>
                    <div><p style={{ fontSize: 13, color: r.c, fontWeight: 500, margin: 0 }}>{r.l}</p><p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>~{N(r.n)} пользователей</p></div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>{R(r.mrr)}</p>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Итого MRR</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>{R(mrr)}</span>
                </div>
              </>} />

              <Card ch={<>
                <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Сценарии роста</p>
                {[
                  { l: "Сейчас",          p: pro,   u: ult,   c: TEXT },
                  { l: "×2 платящих",     p: pro*2, u: ult*2, c: AMBER },
                  { l: "×5 платящих",     p: pro*5, u: ult*5, c: GREEN },
                  { l: "Цель: 100 Pro",   p: 100,   u: 10,    c: BRAND },
                  { l: "Цель: 500 Pro",   p: 500,   u: 50,    c: "#f472b6" },
                ].map(s => {
                  const m = Math.round(s.p*(PRO_M*.7+PRO_Y/12*.3) + s.u*(ULT_M*.7+ULT_Y/12*.3));
                  return (
                    <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BOR}` }}>
                      <span style={{ fontSize: 13, color: MUTED }}>{s.l}</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: s.c }}>{R(m)}/мес</span>
                        <p style={{ fontSize: 10, color: MUTED, margin: "2px 0 0" }}>{R(m*12)}/год</p>
                      </div>
                    </div>
                  );
                })}
              </>} />
            </div>

            <Card ch={<>
              <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Конверсия</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  ["Всего платящих",  stats.users.total ? ((pro+ult)/stats.users.total*100).toFixed(1)+"%" : "—"],
                  ["Free → Pro",      stats.users.total ? (pro/stats.users.total*100).toFixed(1)+"%" : "—"],
                  ["Free → Ultima",   stats.users.total ? (ult/stats.users.total*100).toFixed(1)+"%" : "—"],
                  ["Активных/неделю", stats.users.total ? (stats.users.activeWeek/stats.users.total*100).toFixed(0)+"%" : "—"],
                ].map(([l, v]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 26, fontWeight: 700, color: GREEN, margin: 0 }}>{v}</p>
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{l}</p>
                  </div>
                ))}
              </div>
            </>} />

            <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12, background: "rgba(239,68,68,0.05)", border: `1px solid rgba(239,68,68,0.15)` }}>
              <p style={{ fontSize: 12, color: RED, fontWeight: 600, margin: "0 0 4px" }}>⚠️ Оценка</p>
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>MRR рассчитан с допущением 70% месячных / 30% годовых подписок. Для точных данных смотри транзакции в YooKassa.</p>
            </div>
          </>}

          {/* ── KNOWLEDGE ────────────────────────────────────────────────────── */}
          {tab === "knowledge" && <KnowledgeTab />}
          {tab === "team"      && <TeamTab />}
        </main>
      </div> {/* end flex row */}
    </TokCtx.Provider>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const { CARD, BOR, TEXT, MUTED, inp } = useTok();
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [planF, setPlanF]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy]   = useState<"created_at" | "messages_total" | "messages_today">("created_at");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "30" });
    if (search) p.set("search", search);
    if (planF)  p.set("plan", planF);
    const r = await fetch(`/api/admin/users?${p}`);
    if (r.ok) { const d = await r.json(); setUsers(d.users); setTotal(d.total); }
    setLoading(false);
  }, [page, search, planF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, planF]);

  const sorted = [...users].sort((a, b) => {
    if (sortBy === "messages_total") return (b.messages_total ?? 0) - (a.messages_total ?? 0);
    if (sortBy === "messages_today") return (b.messages_today ?? 0) - (a.messages_today ?? 0);
    return 0;
  });

  const exportCSV = () => {
    const rows = [["Email","Тариф","Регистрация","Последний визит","Сообщ сегодня","Сообщ всего","Предметы","Реферал"]];
    users.forEach(u => rows.push([u.email, u.plan, u.created_at, u.last_active_at ?? "", String(u.messages_today), String(u.messages_total ?? ""), String(u.subjects_count ?? ""), u.referred_by ? "да" : "нет"]));
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mentora_users.csv"; a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }}>{ISearch}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по email..."
            style={{ ...inp, paddingLeft: 32, maxWidth: 320 }} />
        </div>
        <select value={planF} onChange={e => setPlanF(e.target.value)} style={{ ...inp, width: "auto" }}>
          <option value="">Все тарифы</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="ultima">Ultima</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ ...inp, width: "auto" }}>
          <option value="created_at">По дате регистрации</option>
          <option value="messages_total">По всего сообщений</option>
          <option value="messages_today">По сообщ. сегодня</option>
        </select>
        <span style={{ color: MUTED, fontSize: 13, flex: 1 }}>Найдено: {N(total)}</span>
        <button onClick={exportCSV} style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${BOR}`, background: CARD, color: MUTED, fontSize: 13, cursor: "pointer" }}>
          Экспорт CSV
        </button>
      </div>

      <Card ch={<>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            {["Email","Тариф","Предметы","Регистрация","Активность","Сегодня","Всего","Реферал"].map(h => <TH key={h} label={h} />)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: MUTED }}>Загрузка...</td></tr>}
            {!loading && sorted.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${BOR}` }}>
                <TD><span style={{ maxWidth: 240, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span></TD>
                <TD><Badge plan={u.plan} /></TD>
                <TD muted>{u.subjects_count ? `${u.subjects_count} предм.` : "—"}</TD>
                <TD muted>{ago(u.created_at)} назад</TD>
                <TD muted>{u.last_active_at ? ago(u.last_active_at) + " назад" : "—"}</TD>
                <TD color={u.messages_today > 0 ? GREEN : MUTED}>{u.messages_today || "—"}</TD>
                <TD color={u.messages_total && u.messages_total > 50 ? BRAND : TEXT}>{u.messages_total ? N(u.messages_total) : "—"}</TD>
                <TD muted>{u.referred_by ? "✓" : "—"}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </>} style={{ padding: 0, overflow: "hidden" }} />

      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {page > 1 && <button onClick={() => setPage(p => p-1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${BOR}`, background: CARD, color: MUTED, cursor: "pointer", fontSize: 13 }}>← Назад</button>}
        {[...Array(Math.min(Math.ceil(total/30), 7))].map((_, i) => (
          <button key={i} onClick={() => setPage(i+1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BOR}`, background: page===i+1 ? BRAND : CARD, color: page===i+1 ? "white" : MUTED, cursor: "pointer", fontSize: 13 }}>{i+1}</button>
        ))}
        {Math.ceil(total/30) > 7 && <button onClick={() => setPage(p=>p+1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${BOR}`, background: CARD, color: MUTED, cursor: "pointer", fontSize: 13 }}>Ещё →</button>}
      </div>
    </div>
  );
}

// ── Knowledge Tab ─────────────────────────────────────────────────────────────
const emptyF = { subject: "mathematics", topic: "", content: "", source: "", language: "ru" };

function KnowledgeTab() {
  const { CARD, BOR, TEXT, MUTED, inp } = useTok();
  const [chunks, setChunks]   = useState<ChunkRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [filter, setFilter]   = useState("");
  const [search, setSearch]   = useState("");
  const [form, setForm]       = useState(emptyF);
  const [editId, setEditId]   = useState<string | null>(null);
  const [view, setView]       = useState<"list"|"add">("list");
  const [busy, setBusy]       = useState(false);
  const [bulk, setBulk]       = useState(false);
  const [bulkTxt, setBulkTxt] = useState("");
  const [bulkSub, setBulkSub] = useState("mathematics");
  const [flash, setFlash]     = useState("");

  const ok = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 3000); };

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) p.set("subject", filter);
    if (search) p.set("search", search);
    const r = await fetch(`/api/admin/knowledge?${p}`);
    if (r.ok) { const d = await r.json(); setChunks(d.data ?? []); setTotal(d.count ?? 0); }
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    const url = editId ? `/api/admin/knowledge/${editId}` : "/api/admin/knowledge";
    await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBusy(false); setForm(emptyF); setEditId(null); setView("list"); ok("Сохранено"); load();
  };

  const del = async (id: string) => {
    if (!confirm("Удалить чанк?")) return;
    await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    ok("Удалено"); load();
  };

  const bulkImport = async () => {
    const lines = bulkTxt.split("\n").map(l => l.trim()).filter(Boolean);
    setBusy(true);
    for (const line of lines) {
      const [t, ...rest] = line.split("|");
      await fetch("/api/admin/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: bulkSub, topic: t?.trim(), content: rest.join("|").trim() || t?.trim(), source: "Импорт", language: "ru" }) });
    }
    setBusy(false); setBulkTxt(""); setBulk(false); ok(`Добавлено ${lines.length} чанков`); load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {flash && <div style={{ padding: "10px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: GREEN, fontSize: 13 }}>{flash}</div>}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }}>{ISearch}</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Поиск в контенте..."
            style={{ ...inp, width: 220, paddingLeft: 32 }} />
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} style={{ ...inp, width: "auto" }}>
          <option value="">Все предметы</option>
          {SUBS.map(s => <option key={s} value={s}>{SN[s]}</option>)}
        </select>
        <span style={{ color: MUTED, fontSize: 13, flex: 1 }}>{N(total)} чанков</span>
        <button onClick={() => { setBulk(!bulk); setView("list"); }} style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${BOR}`, background: CARD, color: MUTED, cursor: "pointer", fontSize: 13 }}>Массовый импорт</button>
        <button onClick={() => { setView(view==="add"?"list":"add"); setBulk(false); setEditId(null); setForm(emptyF); }}
          style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: BRAND, color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          {view==="add" ? "Отмена" : "+ Добавить"}
        </button>
      </div>

      {bulk && <Card ch={<>
        <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 10 }}>Массовый импорт — одна строка = один чанк</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>Формат: <code style={{ background: "rgba(127,127,127,0.12)", padding: "1px 6px", borderRadius: 4 }}>Тема | Контент</code></p>
        <select value={bulkSub} onChange={e => setBulkSub(e.target.value)} style={{ ...inp, marginBottom: 10 }}>
          {SUBS.map(s => <option key={s} value={s}>{SN[s]}</option>)}
        </select>
        <textarea value={bulkTxt} onChange={e => setBulkTxt(e.target.value)} rows={7}
          placeholder={"Тема 1 | Контент 1\nТема 2 | Контент 2"}
          style={{ ...inp, resize: "vertical", marginBottom: 12, display: "block" }} />
        <button onClick={bulkImport} disabled={busy || !bulkTxt.trim()}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: busy ? MUTED : BRAND, color: "white", cursor: busy ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
          {busy ? "Импорт..." : "Импортировать"}
        </button>
      </>} />}

      {view === "add" && <Card ch={<>
        <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 14 }}>{editId ? "Редактировать" : "Новый чанк"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inp}>
            {SUBS.map(s => <option key={s} value={s}>{SN[s]}</option>)}
          </select>
          <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="Тема" style={inp} />
        </div>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Содержимое..." style={{ ...inp, resize: "vertical", marginBottom: 10, display: "block" }} />
        <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Источник (напр. ЕГЭ физика)" style={{ ...inp, marginBottom: 14 }} />
        <button onClick={save} disabled={busy || !form.content.trim()}
          style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: busy ? MUTED : BRAND, color: "white", cursor: busy ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
          {busy ? "Сохраняю..." : "Сохранить"}
        </button>
      </>} />}

      {view === "list" && <>
        <Card ch={<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Предмет / Тема","Контент","Источник",""].map(h => <TH key={h} label={h} />)}</tr></thead>
          <tbody>{chunks.map(c => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${BOR}` }}>
              <TD><p style={{ color: BRAND, fontWeight: 500, margin: 0 }}>{SN[c.subject] ?? c.subject}</p><p style={{ color: MUTED, fontSize: 11, margin: "2px 0 0" }}>{c.topic ?? "—"}</p></TD>
              <TD muted><span style={{ display: "block", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content}</span></TD>
              <TD muted>{c.source ?? "—"}</TD>
              <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                <button onClick={() => { setForm({ subject: c.subject, topic: c.topic??"", content: c.content, source: c.source??"", language: "ru" }); setEditId(c.id); setView("add"); }}
                  style={{ marginRight: 6, padding: "4px 10px", borderRadius: 6, border: `1px solid ${BOR}`, background: "transparent", color: TEXT, cursor: "pointer", fontSize: 12 }}>Изм.</button>
                <button onClick={() => del(c.id)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: RED, cursor: "pointer", fontSize: 12 }}>Удал.</button>
              </td>
            </tr>
          ))}</tbody>
        </table>} style={{ padding: 0, overflow: "hidden" }} />

        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[...Array(Math.min(Math.ceil(total/20), 8))].map((_, i) => (
            <button key={i} onClick={() => setPage(i+1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BOR}`, background: page===i+1 ? BRAND : CARD, color: page===i+1 ? "white" : MUTED, cursor: "pointer", fontSize: 13 }}>{i+1}</button>
          ))}
        </div>
      </>}
    </div>
  );
}
