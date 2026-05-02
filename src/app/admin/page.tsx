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
  "discovery":"Кругозор","psychology":"Психология","economics":"Экономика","philosophy":"Философия",
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
const IRefresh  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const ISearch   = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IRoadmap  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 17l6-12 4 8 3-5 5 9"/><circle cx="3" cy="17" r="1" fill="currentColor"/><circle cx="21" cy="17" r="1" fill="currentColor"/></svg>;
const ILegal    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

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

interface Msg { role: "user" | "assistant"; content: string; ts?: number; thinking?: string }

function inlineMd(text: string, offset = 0): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0, ki = offset;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={ki++}>{m[1]}</strong>);
    else if (m[2] !== undefined) parts.push(<em key={ki++} style={{ color: "inherit", opacity: 0.8 }}>{m[2]}</em>);
    else if (m[3] !== undefined) parts.push(<code key={ki++} style={{ background: "rgba(128,128,128,0.15)", borderRadius: 3, padding: "1px 5px", fontSize: "0.87em", fontFamily: "monospace" }}>{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function renderMd(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let ki = 0;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (/^---+$/.test(trimmed)) {
      nodes.push(<hr key={ki++} style={{ border: "none", borderTop: "1px solid rgba(128,128,128,0.18)", margin: "6px 0" }} />);
    } else {
      const k = ki++; nodes.push(<span key={k}>{inlineMd(line, k * 100)}{i < lines.length - 1 ? "\n" : ""}</span>);
    }
  });
  return <>{nodes}</>;
}

function chatKey(empId: string) { return `mentora_admin_chat_${empId}`; }

function EmpCardFooter({ emp, color, muted }: { emp: Employee; color: string; muted: string }) {
  const [hist, setHist] = useState<Msg[]>([]);
  useEffect(() => { setHist(loadHistory(emp.id)); }, [emp.id]);
  return (
    <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color, fontWeight: 600 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
        {hist.length > 0 ? `${hist.length} сообщ.` : "Открыть чат"} →
      </div>
      {hist.length > 0 && hist[hist.length - 1].ts && (
        <span style={{ fontSize: 10, color: muted }}>
          {new Date(hist[hist.length - 1].ts!).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
        </span>
      )}
    </div>
  );
}

function loadHistory(empId: string): Msg[] {
  try {
    const raw: Msg[] = JSON.parse(localStorage.getItem(chatKey(empId)) ?? "[]");
    // Drop messages that are empty or contain API error markers (stale from old bugs)
    return raw.filter(m =>
      m.content.trim() !== "" &&
      !m.content.startsWith("[Ошибка") &&
      !m.content.startsWith("[Error")
    );
  }
  catch { return []; }
}

function saveHistory(empId: string, msgs: Msg[]) {
  // Keep last 200 messages to avoid localStorage bloat
  const trimmed = msgs.slice(-200);
  localStorage.setItem(chatKey(empId), JSON.stringify(trimmed));
}

const THINKING: Record<string, string[]> = {
  marketing: [
    "листаю тренды...",
    "гуглю что вирусится...",
    "смотрю что залетело вчера...",
    "перематываю рилсы в голове...",
    "проверяю, не умер ли формат...",
    "ищу панч...",
    "сохраняю референс...",
  ],
  analytics: [
    "пишу SQL запрос...",
    "строю воронку...",
    "смотрю дашборд...",
    "считаю когорту...",
    "проверяю данные...",
    "строю гипотезу...",
  ],
  growth: [
    "хакаю рост...",
    "прикидываю эксперимент...",
    "считаю конверсию...",
    "думаю над виральной петлёй...",
    "проверяю гипотезу...",
    "придумываю A/B тест...",
  ],
};

function pickThinking(empId: string): string {
  const list = THINKING[empId] ?? ["думаю..."];
  return list[Math.floor(Math.random() * list.length)];
}

function TeamTab() {
  const { CARD, BOR, TEXT, MUTED, inp, isDark, SHADOW, GLASS } = useTok();
  const [selected, setSelected] = useState<Employee | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

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

    if (!res.ok || !res.body) {
      const errText = `[Ошибка ${res.status}: не удалось получить ответ]`;
      const errMsgs = [...next, { role: "assistant" as const, content: errText, ts: Date.now() }];
      setMessages(errMsgs);
      saveHistory(selected.id, errMsgs);
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";

    setMessages(prev => [...prev, { role: "assistant", content: "", ts: Date.now(), thinking: pickThinking(selected.id) }]);

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
              {emp.available && <EmpCardFooter emp={emp} color={emp.color} muted={MUTED} />}
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
              {m.content ? renderMd(m.content) : (streaming && i === messages.length - 1
                ? <span style={{ opacity: 0.55, fontStyle: "italic" }}>{m.thinking ?? "думаю..."}</span>
                : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Написать ${emp.name}... (Shift+Enter — новая строка)`}
          disabled={streaming}
          style={{
            ...inp, flex: 1, resize: "none", overflow: "hidden",
            lineHeight: 1.5, minHeight: 38, maxHeight: 160,
          }}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          style={{
            padding: "9px 18px", borderRadius: 10, border: "none",
            background: streaming || !input.trim() ? MUTED : emp.color,
            color: "white", cursor: streaming || !input.trim() ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 600, flexShrink: 0, height: 38,
          }}
        >{streaming ? "·" : "→"}</button>
      </div>
    </div>
  );
}

// ── Roadmap data ──────────────────────────────────────────────────────────────
const ROADMAP_STORAGE_KEY = "mentora_admin_roadmap_v3";
const CUSTOM_TASKS_KEY    = "mentora_admin_custom_tasks_v1";
const TASK_ORDER_KEY      = "mentora_admin_task_order_v1";

function loadCustomTasks(): Record<string, Array<{id:string;label:string;tag?:string}>> {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TASKS_KEY) ?? "{}"); } catch { return {}; }
}
function saveCustomTasks(d: Record<string, Array<{id:string;label:string;tag?:string}>>) {
  localStorage.setItem(CUSTOM_TASKS_KEY, JSON.stringify(d));
}
function loadTaskOrder(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(TASK_ORDER_KEY) ?? "{}"); } catch { return {}; }
}
function saveTaskOrder(d: Record<string, string[]>) {
  localStorage.setItem(TASK_ORDER_KEY, JSON.stringify(d));
}

interface RTask  { id: string; label: string; tag?: string }
interface RBlock { id: string; title: string; emoji: string; color: string; tasks: RTask[] }

const ROADMAP_BLOCKS: RBlock[] = [
  {
    id: "design", title: "Дизайн-унификация", emoji: "🎨", color: "#4561E8",
    tasks: [
      { id: "d1",  label: "Landing (/) — единые иконки предметов, hero-секция", tag: "page" },
      { id: "d2",  label: "Auth (/auth) — привести к фирменному стилю", tag: "page" },
      { id: "d3",  label: "Dashboard (/dashboard) — SubjectIcon карточки единообразны", tag: "page" },
      { id: "d4",  label: "Profile (/profile) — формы, аватар, тариф-плашка", tag: "page" },
      { id: "d5",  label: "Progress (/dashboard/progress) — XP-графики, серия", tag: "page" },
      { id: "d6",  label: "Analytics (/dashboard/analytics) — статистика предметов", tag: "page" },
      { id: "d7",  label: "Chat (/learn/[subject]) — все UI-элементы согласованы", tag: "page" },
      { id: "d8",  label: "Pricing (/pricing) — карточки тарифов, кнопки", tag: "page" },
      { id: "d9",  label: "About (/dashboard/about) — секции, блок поддержки", tag: "page" },
      { id: "d10", label: "Galaxy (/knowledge) — звёздная карта, цвета предметов", tag: "page" },
    ],
  },
  {
    id: "system", title: "Системная унификация", emoji: "🧩", color: "#a78bfa",
    tasks: [
      { id: "s1", label: "SubjectIcon — одни градиенты и иконки везде без исключений", tag: "comp" },
      { id: "s2", label: "DashboardNav — единый компонент на всех авторизованных страницах", tag: "comp" },
      { id: "s3", label: "Мобильная адаптация — все страницы при 375px без горизонтального скролла", tag: "mobile" },
      { id: "s4", label: "Dark/Light mode — каждая страница корректна в обоих режимах", tag: "theme" },
      { id: "s5", label: "Типографика и отступы — единый стандарт (font-size, line-height, gap)", tag: "design" },
    ],
  },
  {
    id: "optimize", title: "Глобальная оптимизация", emoji: "⚙️", color: "#22c55e",
    tasks: [
      { id: "o1", label: "Аудит роутов — правильная иерархия, убрать лишние редиректы", tag: "arch" },
      { id: "o2", label: "Дублирующийся код — вынести в общие компоненты/утилиты", tag: "code" },
      { id: "o3", label: "Lighthouse > 90 на Landing, Dashboard, Chat", tag: "perf" },
      { id: "o4", label: "SEO: canonical, meta description, og:image на всех страницах", tag: "seo" },
      { id: "o5", label: "API роуты — статусы, валидация, rate limiting проверить", tag: "api" },
    ],
  },
  {
    id: "qa", title: "QA-прогон до 1 июня", emoji: "✅", color: "#f59e0b",
    tasks: [
      { id: "q1", label: "Полный флоу: регистрация → чат → апгрейд → оплата → доступ", tag: "flow" },
      { id: "q2", label: "Telegram-бот поддержки отвечает корректно на типовые вопросы", tag: "bot" },
      { id: "q3", label: "Реферальная программа: приглашение → +3 дня Pro у обоих", tag: "refer" },
      { id: "q4", label: "Все 17 предметов открываются и AI отвечает без ошибок", tag: "subjects" },
      { id: "q5", label: "Лимиты сообщений (Free: 20) — сброс в 00:00 UTC работает", tag: "limits" },
      { id: "q6", label: "PDF-конспект (Ultima) генерируется, скачивается, читается", tag: "pdf" },
      { id: "q7", label: "Онбординг-тур запускается при первом входе, шаги корректны", tag: "onboard" },
      { id: "q8", label: "Подарок 1 июня — кнопка активации видна и работает", tag: "gift" },
    ],
  },
];

// Total tasks for progress calculation
const ROADMAP_TOTAL = ROADMAP_BLOCKS.reduce((s, b) => s + b.tasks.length, 0);

// Tasks verified as completed — pre-populated on first load
const ROADMAP_DEFAULTS: string[] = [
  // Дизайн-унификация — all pages audited and use unified design system
  "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10",
  // Системная унификация — SubjectIcon, DashboardNav, Dark/Light mode, mobile подтверждены
  "s1", "s2", "s3", "s4",
  // Оптимизация — API безопасность (4 уязвимости закрыты), SEO
  "o4", "o5",
  // QA — 17 предметов работают, лимиты сообщений сброс ✓
  "q4", "q5",
];

function loadRoadmapChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (raw === null) {
      // First load — pre-populate with verified-done tasks
      const defaults = new Set(ROADMAP_DEFAULTS);
      localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify([...defaults]));
      return defaults;
    }
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(ROADMAP_DEFAULTS); }
}

function saveRoadmapChecked(s: Set<string>) {
  localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify([...s]));
}

// ── MilestoneTimeline (always visible at page top) ────────────────────────────
function MilestoneTimeline({ checked }: { checked: Set<string> }) {
  const { CARD, BOR, TEXT, MUTED, isDark } = useTok();
  const done = checked.size;
  const pct  = ROADMAP_TOTAL ? Math.round(done / ROADMAP_TOTAL * 100) : 0;

  const MS = [
    { label: "Сейчас",        pct:  0, color: "#94a3b8" },
    { label: "Дизайн",        pct: 36, color: "#4561E8" },
    { label: "Система",       pct: 55, color: "#a78bfa" },
    { label: "Оптимизация",   pct: 72, color: "#22c55e" },
    { label: "QA",            pct: 90, color: "#f59e0b" },
    { label: "1 июня",        pct:100, color: "#ef4444" },
  ];

  return (
    <div style={{ marginBottom: 28, padding: "16px 24px 20px", background: CARD, borderRadius: 14, border: `1px solid ${BOR}` }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          До старта привлечения
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: MUTED }}>{done} / {ROADMAP_TOTAL} задач</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{pct}%</span>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🦄</span>
        </div>
      </div>

      {/* Track + dots + labels all in one relative container */}
      <div style={{ position: "relative", paddingBottom: 22 }}>
        {/* Track */}
        <div style={{ height: 6, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", borderRadius: 99, position: "relative" }}>
          {/* Fill */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: pct + "%",
            minWidth: pct > 0 ? 6 : 0,
            borderRadius: 99,
            background: "linear-gradient(90deg, #4561E8 0%, #a78bfa 55%, #f59e0b 100%)",
            transition: "width .7s cubic-bezier(.4,0,.2,1)",
            boxShadow: pct > 0 ? "0 0 10px rgba(69,97,232,0.45)" : "none",
          }} />

          {/* Milestone dots — on the track */}
          {MS.map(m => {
            const reached = pct >= m.pct;
            return (
              <div key={m.pct} style={{
                position: "absolute",
                left: m.pct === 100 ? "calc(100% - 6px)" : m.pct === 0 ? "-1px" : `calc(${m.pct}% - 5px)`,
                top: "50%",
                transform: "translateY(-50%)",
                width: 12, height: 12, borderRadius: "50%",
                background: reached ? m.color : (isDark ? "#141625" : "#dde1ea"),
                border: `2px solid ${m.color}`,
                boxShadow: reached ? `0 0 7px ${m.color}90` : "none",
                transition: "background .3s, box-shadow .3s",
                zIndex: 2,
              }} />
            );
          })}
        </div>

        {/* Labels — absolutely positioned under each dot */}
        {MS.map((m, i) => {
          const reached = pct >= m.pct;
          const isFirst = i === 0;
          const isLast  = i === MS.length - 1;
          return (
            <div key={`lbl_${m.pct}`} style={{
              position: "absolute",
              top: 14,
              left: isLast ? "auto" : isFirst ? 0 : `${m.pct}%`,
              right: isLast ? 0 : "auto",
              transform: isFirst || isLast ? "none" : "translateX(-50%)",
              textAlign: "center",
            }}>
              <span style={{
                fontSize: 10, fontWeight: reached ? 700 : 400,
                color: reached ? m.color : MUTED,
                whiteSpace: "nowrap",
                transition: "color .3s, font-weight .3s",
              }}>
                {m.label}
              </span>
            </div>
          );
        })}


      </div>
    </div>
  );
}

// ── Revenue Calculator ─────────────────────────────────────────────────────────
const MAX_USERS = 1_000_000;
function RevenueCalculator() {
  const { CARD, BOR, TEXT, MUTED, isDark } = useTok();
  const [total, setTotal]     = useState(200);
  const [pctPro, setPctPro]   = useState(75);
  const [pctAnn, setPctAnn]   = useState(30);
  const [convRate, setConvRate] = useState(5); // % conversion: paying / total users

  const PRO_M = 399, PRO_Y = 2990, ULT_M = 799, ULT_Y = 5990;

  const proCount    = Math.round(total * pctPro / 100);
  const ultCount    = total - proCount;
  const proMRR      = Math.round(proCount * (PRO_M * (1 - pctAnn/100) + (PRO_Y/12) * (pctAnn/100)));
  const ultMRR      = Math.round(ultCount * (ULT_M * (1 - pctAnn/100) + (ULT_Y/12) * (pctAnn/100)));
  const mrr         = proMRR + ultMRR;
  const arr         = mrr * 12;
  const totalNeeded = convRate > 0 ? Math.round(total / (convRate / 100)) : 0;

  // ── Налог по уровням ARR (законодательство РФ) ────────────────────────────
  // УСН «Доходы» (ИП/ООО на упрощёнке):
  //   ARR ≤ 150 млн → 6%  (базовая ставка)
  //   ARR 150–265 млн → 8%  (повышенная; лимит с дефлятором ~265 млн в 2024)
  //   ARR > 265 млн → утрата права на УСН → ОСНО
  // ОСНО (Общая система):
  //   Налог на прибыль 25% (с 2025 г.) от расчётной прибыли.
  //   Для SaaS при марже ~60% (выручка − API/сервера/зарплаты):
  //   Эффективная нагрузка ≈ 25% × 60% = 15% от выручки.
  //   НДС (20%) на B2C цифровые услуги — включён в цену, поэтому
  //   фактическая выручка после НДС = mrr × 100/120; для упрощения
  //   показываем только НП и делаем пометку.
  const USN_BASE_LIMIT  = 150_000_000;   // 150 млн ARR
  const USN_UPPER_LIMIT = 265_000_000;   // ~265 млн с дефлятором 2024
  const OSNO_MARGIN     = 0.60;          // предполагаемая маржинальность SaaS
  const NP_RATE_2025    = 0.25;          // налог на прибыль с 2025 г.

  let taxLabel: string;
  let taxAmount: number;
  let taxNote: string;
  let taxColor: string;

  if (arr <= USN_BASE_LIMIT) {
    taxLabel  = "УСН Доходы 6%";
    taxAmount = Math.round(mrr * 0.06);
    taxNote   = `ARR ${(arr/1e6).toFixed(1)} млн ≤ 150 млн`;
    taxColor  = "#f97316";
  } else if (arr <= USN_UPPER_LIMIT) {
    taxLabel  = "УСН Доходы 8%";
    taxAmount = Math.round(mrr * 0.08);
    taxNote   = "повышенная ставка, ARR 150–265 млн";
    taxColor  = "#ef4444";
  } else {
    // ОСНО: НП 25% от расчётной прибыли при марже 60%
    taxLabel  = "ОСНО НП 25% от прибыли";
    taxAmount = Math.round(mrr * OSNO_MARGIN * NP_RATE_2025);
    taxNote   = `оценка при марже ${OSNO_MARGIN * 100}% + НДС 20% в цене`;
    taxColor  = "#ef4444";
  }
  const net = mrr - taxAmount;

  // Logarithmic scale: slider 0..1000 → actual 0..1_000_000
  const [sliderVal, setSliderVal] = useState(32); // log-approx for 200
  const logToUsers = (v: number) => v === 0 ? 0 : Math.round(Math.pow(10, v / 1000 * 6));
  const usersToLog = (u: number) => u === 0 ? 0 : Math.round(Math.log10(u) / 6 * 1000);

  const handleSlider = (v: number) => {
    setSliderVal(v);
    setTotal(logToUsers(v));
  };

  const milestones = [
    { n: 50,      label: "50",    color: "#22c55e" },
    { n: 100,     label: "100",   color: "#f59e0b" },
    { n: 500,     label: "500",   color: "#60a5fa" },
    { n: 1000,    label: "1K",    color: "#4561E8" },
    { n: 5000,    label: "5K",    color: "#a78bfa" },
    { n: 10000,   label: "10K",   color: "#f97316" },
    { n: 50000,   label: "50K",   color: "#ec4899" },
    { n: 100000,  label: "100K",  color: "#14b8a6" },
    { n: 500000,  label: "500K",  color: "#8b5cf6" },
    { n: 1000000, label: "1M 🦄", color: "#fbbf24" },
  ];
  const curMilestone = [...milestones].reverse().find(m => total >= m.n);
  const sliderPct = sliderVal / 10;

  const fmt = (n: number) => n >= 1_000_000 ? (n/1_000_000).toFixed(1) + "M" : n >= 1000 ? (n/1000).toFixed(0) + "K" : String(n);

  const Row = ({ label, val, big, color }: { label: string; val: string; big?: boolean; color?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BOR}` }}>
      <span style={{ fontSize: big ? 14 : 13, color: MUTED }}>{label}</span>
      <span style={{ fontSize: big ? 18 : 14, fontWeight: big ? 700 : 600, color: color ?? TEXT }}>{val}</span>
    </div>
  );

  return (
    <Card ch={
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Калькулятор дохода</p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Оценка при разном кол-ве платящих подписчиков</p>
          </div>
          {curMilestone && (
            <div style={{ marginLeft: "auto", flexShrink: 0, padding: "4px 12px", borderRadius: 99, background: curMilestone.color + "1a", border: `1px solid ${curMilestone.color}30`, fontSize: 12, fontWeight: 700, color: curMilestone.color, whiteSpace: "nowrap" }}>
              {curMilestone.label}
            </div>
          )}
        </div>

        {/* Main slider — logarithmic 0..1M */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: MUTED }}>Платящих подписчиков</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{total.toLocaleString("ru-RU")}</span>
          </div>
          <div style={{ position: "relative", paddingBottom: 28 }}>
            <input
              type="range" min={0} max={1000} step={1} value={sliderVal}
              onChange={e => handleSlider(Number(e.target.value))}
              style={{ width: "100%", height: 6, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
                background: `linear-gradient(to right, #4561E8 ${sliderPct}%, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} ${sliderPct}%)`,
                borderRadius: 99, outline: "none", border: "none" }}
            />
            {/* Milestone markers — positioned absolute inside padded container */}
            {milestones.map(m => {
              const pct = usersToLog(m.n) / 10;
              const reached = total >= m.n;
              return (
                <div key={m.n} style={{ position: "absolute", bottom: 0, left: `${pct}%`, transform: "translateX(-50%)", textAlign: "center", width: 28 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: reached ? m.color : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"), margin: "0 auto 3px" }} />
                  <span style={{ fontSize: 9, color: reached ? m.color : MUTED, whiteSpace: "nowrap", fontWeight: reached ? 700 : 400 }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secondary sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: MUTED }}>Pro / Ultima</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{pctPro}% / {100-pctPro}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={pctPro} onChange={e => setPctPro(Number(e.target.value))}
              style={{ width: "100%", height: 4, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
                background: `linear-gradient(to right, #60a5fa ${pctPro}%, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} ${pctPro}%)`,
                borderRadius: 99, outline: "none", border: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#60a5fa" }}>Pro ({fmt(proCount)})</span>
              <span style={{ fontSize: 10, color: "#a78bfa" }}>Ultima ({fmt(ultCount)})</span>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: MUTED }}>Годовых</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{pctAnn}%</span>
            </div>
            <input type="range" min={0} max={80} step={5} value={pctAnn} onChange={e => setPctAnn(Number(e.target.value))}
              style={{ width: "100%", height: 4, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
                background: `linear-gradient(to right, #22c55e ${pctAnn/0.8}%, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} ${pctAnn/0.8}%)`,
                borderRadius: 99, outline: "none", border: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: MUTED }}>Мес.</span>
              <span style={{ fontSize: 10, color: "#22c55e" }}>Год (скидка)</span>
            </div>
          </div>
        </div>

        {/* Conversion rate slider */}
        <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 12, background: isDark ? "rgba(251,191,36,0.06)" : "rgba(251,191,36,0.08)", border: `1px solid rgba(251,191,36,0.18)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: MUTED }}>% конверсии (платящих / всего)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>{convRate}%</span>
          </div>
          <input type="range" min={1} max={30} step={1} value={convRate} onChange={e => setConvRate(Number(e.target.value))}
            style={{ width: "100%", height: 4, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
              background: `linear-gradient(to right, #fbbf24 ${convRate/30*100}%, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} ${convRate/30*100}%)`,
              borderRadius: 99, outline: "none", border: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 12, color: MUTED }}>Нужно всего пользователей:</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24" }}>{totalNeeded.toLocaleString("ru-RU")}</span>
          </div>
        </div>

        {/* Results */}
        <div>
          <Row label="Pro MRR"    val={`≈ ${proMRR.toLocaleString("ru-RU")} ₽`} color="#60a5fa" />
          <Row label="Ultima MRR" val={`≈ ${ultMRR.toLocaleString("ru-RU")} ₽`} color="#a78bfa" />
          <Row label="МRR итого"  val={`≈ ${mrr.toLocaleString("ru-RU")} ₽`} big color="#4561E8" />
          <Row label="ARR (×12)"  val={`≈ ${arr.toLocaleString("ru-RU")} ₽`} color="#4561E8" />
          {/* Tax row — dynamic regime */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BOR}` }}>
            <div>
              <span style={{ fontSize: 13, color: MUTED }}>{taxLabel}</span>
              {taxNote && <p style={{ fontSize: 10, color: MUTED, margin: "2px 0 0", opacity: 0.65 }}>{taxNote}</p>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: taxColor }}>−{taxAmount.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginTop: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: MUTED }}>Чистыми / мес</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#22c55e" }}>{net.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        {/* Tax regime badge */}
        <div style={{ marginTop: 14, padding: "8px 12px", borderRadius: 8, background: arr <= USN_BASE_LIMIT ? "rgba(249,115,22,0.07)" : arr <= USN_UPPER_LIMIT ? "rgba(239,68,68,0.07)" : "rgba(239,68,68,0.1)", border: `1px solid ${arr <= USN_BASE_LIMIT ? "rgba(249,115,22,0.2)" : "rgba(239,68,68,0.25)"}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13 }}>{arr <= USN_UPPER_LIMIT ? "📋" : "⚠️"}</span>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: arr <= USN_BASE_LIMIT ? "#f97316" : arr <= USN_UPPER_LIMIT ? "#ef4444" : "#ef4444" }}>
              {arr <= USN_BASE_LIMIT ? "Режим: УСН" : arr <= USN_UPPER_LIMIT ? "Режим: УСН (переходный)" : "Режим: ОСНО — потеря УСН"}
            </span>
            <p style={{ fontSize: 10, color: MUTED, margin: "2px 0 0" }}>
              {arr <= USN_BASE_LIMIT
                ? "Базовая ставка 6% до ARR 150 млн ₽/год"
                : arr <= USN_UPPER_LIMIT
                ? "Повышенная ставка 8% при ARR 150–265 млн ₽/год"
                : "ARR > 265 млн → обязателен переход на ОСНО. НП 25% с 2025 г., +НДС 20%."}
            </p>
          </div>
        </div>
      </div>
    } />
  );
}

// ── Conversion history ────────────────────────────────────────────────────────
const CONV_HIST_KEY = "mentora_admin_conv_history_v1";
interface ConvSnapshot { date: string; rate: number }
function loadConvHistory(): ConvSnapshot[] {
  try { return JSON.parse(localStorage.getItem(CONV_HIST_KEY) ?? "[]"); }
  catch { return []; }
}
function saveConvHistory(arr: ConvSnapshot[]) {
  localStorage.setItem(CONV_HIST_KEY, JSON.stringify(arr.slice(-90)));
}

// ── RoadmapTab ─────────────────────────────────────────────────────────────────
function RoadmapTab({ checked, onToggle, onClear }: { checked: Set<string>; onToggle(id: string): void; onClear(): void }) {
  const { CARD, BOR, TEXT, MUTED, isDark } = useTok();
  const done = checked.size;

  // Custom tasks per block: { [blockId]: [{id, label}] }
  const [customTasks, setCustomTasks] = useState<Record<string, Array<{id:string;label:string}>>>(() => loadCustomTasks());
  // Order of task IDs per block (for drag-and-drop)
  const [taskOrder, setTaskOrder] = useState<Record<string, string[]>>(() => loadTaskOrder());
  // Add-task input per block
  const [addInput, setAddInput] = useState<Record<string, string>>({});
  // Drag state
  const dragRef = useRef<{blockId:string; fromIdx:number} | null>(null);
  const [dragOver, setDragOver] = useState<{blockId:string; idx:number} | null>(null);

  // Merge static + custom tasks, then apply saved order
  const getBlockTasks = (block: typeof ROADMAP_BLOCKS[0]) => {
    const allTasks = [...block.tasks, ...(customTasks[block.id] ?? [])];
    const order = taskOrder[block.id];
    if (!order) return allTasks;
    const byId = Object.fromEntries(allTasks.map(t => [t.id, t]));
    const ordered = order.map(id => byId[id]).filter(Boolean);
    const unordered = allTasks.filter(t => !order.includes(t.id));
    return [...ordered, ...unordered];
  };

  const addTask = (blockId: string) => {
    const label = (addInput[blockId] ?? "").trim();
    if (!label) return;
    const id = `custom_${blockId}_${Date.now()}`;
    const next = { ...customTasks, [blockId]: [...(customTasks[blockId] ?? []), { id, label }] };
    setCustomTasks(next);
    saveCustomTasks(next);
    setAddInput(a => ({ ...a, [blockId]: "" }));
  };

  const removeCustomTask = (blockId: string, taskId: string) => {
    const next = { ...customTasks, [blockId]: (customTasks[blockId] ?? []).filter(t => t.id !== taskId) };
    setCustomTasks(next);
    saveCustomTasks(next);
  };

  const handleDragStart = (blockId: string, idx: number) => {
    dragRef.current = { blockId, fromIdx: idx };
  };
  const handleDragOver = (e: React.DragEvent, blockId: string, idx: number) => {
    e.preventDefault();
    setDragOver({ blockId, idx });
  };
  const handleDrop = (blockId: string) => {
    if (!dragRef.current || dragRef.current.blockId !== blockId) return;
    const { fromIdx } = dragRef.current;
    const toIdx = dragOver?.idx ?? fromIdx;
    if (fromIdx === toIdx) { dragRef.current = null; setDragOver(null); return; }
    const block = ROADMAP_BLOCKS.find(b => b.id === blockId)!;
    const tasks = getBlockTasks(block);
    const ids = tasks.map(t => t.id);
    const [moved] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, moved);
    const next = { ...taskOrder, [blockId]: ids };
    setTaskOrder(next);
    saveTaskOrder(next);
    dragRef.current = null;
    setDragOver(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
          Конкретные задачи до 1 июня — когда начнём привлекать пользователей
        </p>
        <button onClick={onClear} style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${BOR}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: 0.7 }}>
          Сбросить всё
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {ROADMAP_BLOCKS.map(block => {
          const tasks = getBlockTasks(block);
          const bDone = tasks.filter(t => checked.has(t.id)).length;
          const bPct  = Math.round(bDone / tasks.length * 100);
          return (
            <Card key={block.id} ch={
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{block.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{block.title}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: block.color, background: block.color + "1a", padding: "2px 8px", borderRadius: 99, border: `1px solid ${block.color}30` }}>
                    {bDone}/{tasks.length}
                  </span>
                </div>

                {/* Block mini-progress */}
                <div style={{ height: 3, background: BOR, borderRadius: 99, marginBottom: 14 }}>
                  <div style={{ height: "100%", width: bPct + "%", background: block.color, borderRadius: 99, transition: "width .5s" }} />
                </div>

                {/* Task list with drag-and-drop */}
                <div onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(block.id)}>
                  {tasks.map((task, ti) => {
                    const isDone = checked.has(task.id);
                    const isCustom = task.id.startsWith("custom_");
                    const isDragging = dragOver?.blockId === block.id && dragOver.idx === ti;
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(block.id, ti)}
                        onDragOver={e => handleDragOver(e, block.id, ti)}
                        onDrop={() => handleDrop(block.id)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0",
                          borderBottom: ti < tasks.length - 1 ? `1px solid ${BOR}` : "none",
                          borderTop: isDragging ? `2px solid ${block.color}` : "2px solid transparent",
                          cursor: "grab", transition: "border-color .15s",
                          opacity: dragRef.current?.blockId === block.id && dragRef.current.fromIdx === ti ? 0.4 : 1,
                        }}
                      >
                        {/* Drag handle */}
                        <div style={{ flexShrink: 0, color: isDone ? "transparent" : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"), marginTop: 2, fontSize: 11, lineHeight: 1, userSelect: "none" }}>⠿</div>

                        {/* Checkbox */}
                        <div
                          onClick={() => onToggle(task.id)}
                          style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 4, marginTop: 1, border: `2px solid ${isDone ? block.color : BOR}`, background: isDone ? block.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", cursor: "pointer" }}
                        >
                          {isDone && (
                            <svg viewBox="0 0 10 8" width="9" height="9">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        <span
                          onClick={() => onToggle(task.id)}
                          style={{ fontSize: 13, color: isDone ? MUTED : TEXT, textDecoration: isDone ? "line-through" : "none", lineHeight: 1.5, flex: 1, transition: "all .2s", cursor: "pointer" }}
                        >
                          {task.label}
                        </span>

                        {(task as {tag?:string}).tag && (
                          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, color: block.color, background: block.color + "15", padding: "1px 6px", borderRadius: 4, marginTop: 2 }}>
                            {(task as {tag?:string}).tag}
                          </span>
                        )}

                        {/* Delete button for custom tasks */}
                        {isCustom && (
                          <button
                            onClick={() => removeCustomTask(block.id, task.id)}
                            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", fontSize: 14, lineHeight: 1, padding: "0 2px", marginTop: 1 }}
                            title="Удалить"
                          >×</button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add task input */}
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <input
                    value={addInput[block.id] ?? ""}
                    onChange={e => setAddInput(a => ({ ...a, [block.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") addTask(block.id); }}
                    placeholder="Добавить задачу..."
                    style={{
                      flex: 1, fontSize: 12, padding: "5px 10px", borderRadius: 8,
                      border: `1px solid ${BOR}`, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      color: TEXT, outline: "none",
                    }}
                  />
                  <button
                    onClick={() => addTask(block.id)}
                    style={{
                      flexShrink: 0, fontSize: 18, lineHeight: 1, padding: "4px 10px",
                      borderRadius: 8, border: `1px solid ${block.color}40`,
                      background: block.color + "15", color: block.color, cursor: "pointer",
                    }}
                  >+</button>
                </div>
              </>
            } />
          );
        })}
      </div>

      {done === ROADMAP_TOTAL && done > 0 && (
        <div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 14, background: "linear-gradient(135deg, rgba(69,97,232,0.12), rgba(167,139,250,0.10))", border: "1px solid rgba(69,97,232,0.25)", textAlign: "center" }}>
          <p style={{ fontSize: 20, margin: "0 0 6px" }}>🦄</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: "0 0 4px" }}>Все задачи выполнены!</p>
          <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>1 июня — старт. Поехали 🚀</p>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
// ── LegalTab ──────────────────────────────────────────────────────────────────
const LEGAL_CHECKLIST_KEY = "mentora_admin_legal_v1";
type LegalItem = { id: string; done: boolean };
function loadLegal(): Set<string> {
  try { const arr: string[] = JSON.parse(localStorage.getItem(LEGAL_CHECKLIST_KEY) ?? "[]"); return new Set(arr); }
  catch { return new Set(); }
}
function saveLegal(s: Set<string>) { localStorage.setItem(LEGAL_CHECKLIST_KEY, JSON.stringify([...s])); }

function LegalTab({ annualRev }: { annualRev: number }) {
  const { BOR, TEXT, MUTED, CARD, isDark } = useTok();
  const [done, setDone] = useState<Set<string>>(() => loadLegal());

  const toggle = (id: string) => setDone(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    saveLegal(next);
    return next;
  });

  const Check = ({ id, label, sub, warn }: { id: string; label: string; sub?: string; warn?: boolean }) => {
    const checked = done.has(id);
    return (
      <div onClick={() => toggle(id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: checked ? (isDark ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.07)") : "transparent", border: `1px solid ${checked ? "rgba(34,197,94,0.2)" : BOR}`, marginBottom: 6, transition: "all .15s", userSelect: "none" }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? "#22c55e" : MUTED}`, background: checked ? "#22c55e" : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
          {checked && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><polyline points="1.5,6 4.5,9 10.5,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: checked ? MUTED : TEXT, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.6 : 1, fontWeight: warn && !checked ? 600 : 400 }}>{label}</span>
          {sub && <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0", lineHeight: 1.5 }}>{sub}</p>}
        </div>
        {warn && !checked && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(239,68,68,0.12)", color: "#ef4444", fontWeight: 600, flexShrink: 0 }}>важно</span>}
      </div>
    );
  };

  // Dynamic regime and warnings based on ARR
  const isUSN6  = annualRev <= 150_000_000;
  const isUSN8  = annualRev > 150_000_000 && annualRev <= 265_000_000;
  const isOSNO  = annualRev > 265_000_000;
  const pctToUSN8  = isUSN6  ? Math.round(annualRev / 150_000_000 * 100) : 100;
  const pctToOSNO  = !isOSNO ? Math.round(annualRev / 265_000_000 * 100) : 100;
  const toUSN8Rem  = Math.max(0, 150_000_000 - annualRev);
  const toOSNORem  = Math.max(0, 265_000_000 - annualRev);

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  );

  const InfoBox = ({ icon, title, body, color = "#4561E8" }: { icon: string; title: string; body: string; color?: string }) => (
    <div style={{ padding: "12px 16px", borderRadius: 12, background: color + "0d", border: `1px solid ${color}25`, marginBottom: 10, display: "flex", gap: 12 }}>
      <span style={{ fontSize: 18, lineHeight: 1.4 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, margin: "0 0 3px" }}>{title}</p>
        <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6 }}>{body}</p>
      </div>
    </div>
  );

  // НПД (самозанятость) лимит — 2.4 млн ₽/год
  const NPD_LIMIT   = 2_400_000;
  const pctToNPD    = Math.min(Math.round(annualRev / NPD_LIMIT * 100), 100);
  const toNPDRem    = Math.max(0, NPD_LIMIT - annualRev);
  const isNPDOver   = annualRev >= NPD_LIMIT;

  return (
    <div>
      {/* ── Текущий статус ── */}
      <Sec title="Текущий статус">
        <div style={{ padding: "14px 16px", borderRadius: 12, background: isDark ? "rgba(69,97,232,0.08)" : "rgba(69,97,232,0.07)", border: `1px solid rgba(69,97,232,0.25)`, marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 24 }}>🪪</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: "0 0 2px" }}>Самозанятый — НПД (налог на профессиональный доход)</p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>YooKassa подключена через самозанятость · Ставка 4% с доходов от физлиц, 6% от юрлиц · Лимит 2.4 млн ₽/год</p>
          </div>
        </div>
        <InfoBox icon="✅" title="Самозанятость — правильный старт, пока выручка мала"
          body="НПД 4% — самая низкая ставка в РФ для B2C. Никакой отчётности, никакого бухгалтера: налог считается автоматически в приложении «Мой налог». YooKassa с самозанятостью работает легально. Это оптимально до лимита 2.4 млн ₽/год."
          color="#22c55e" />
        <InfoBox icon="⏭️" title="Следующий шаг: ИП + УСН Доходы 6%"
          body="Переходить, когда ARR приближается к 2.4 млн ₽ (200K/мес выручки). ИП: регистрация бесплатная через Госуслуги за 3 рабочих дня. При регистрации сразу подать форму 26.2-1 на УСН 6% — без этого автоматически ОСНО!"
          color="#f59e0b" />
        <InfoBox icon="🏢" title="ООО — намного позже"
          body="Первый B2B контракт (корпоративные клиенты, школы), раунд инвестиций, появление соучредителя. До тех пор ООО — только лишние расходы и бухгалтерия."
          color="#4561E8" />
        <InfoBox icon="🎓" title="Образовательная лицензия — пока не нужна"
          body="Mentora — информационный сервис / AI-ассистент без итоговой аттестации. Лицензия Рособрнадзора потребуется только при выдаче официальных сертификатов об образовании или B2B с государственными школами как образовательная организация."
          color="#64748b" />
      </Sec>

      {/* ── Лимит самозанятости ── */}
      <Sec title="Мониторинг лимита самозанятости">
        <div style={{ padding: "16px 18px", borderRadius: 12, background: isNPDOver ? "rgba(239,68,68,0.08)" : pctToNPD >= 70 ? "rgba(245,158,11,0.07)" : "rgba(34,197,94,0.06)", border: `1px solid ${isNPDOver ? "rgba(239,68,68,0.3)" : pctToNPD >= 70 ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.2)"}`, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 11, color: MUTED, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>НПД лимит 2.4 млн ₽/год</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: isNPDOver ? "#ef4444" : pctToNPD >= 70 ? "#f59e0b" : "#22c55e", margin: 0 }}>
                {isNPDOver ? "🚨 Лимит превышен!" : `осталось ${(toNPDRem/1e6).toFixed(2)} млн ₽`}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: isNPDOver ? "#ef4444" : pctToNPD >= 70 ? "#f59e0b" : "#22c55e", margin: 0 }}>{pctToNPD}%</p>
              <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>использовано</p>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
            <div style={{ height: "100%", width: pctToNPD + "%", borderRadius: 99, background: isNPDOver ? "#ef4444" : pctToNPD >= 70 ? "#f59e0b" : "#22c55e", transition: "width .4s" }} />
          </div>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>
            {isNPDOver
              ? "Превышен лимит НПД. Необходимо немедленно перейти на ИП + УСН, иначе ФНС переведёт на ОСНО автоматически."
              : pctToNPD >= 70
              ? `⚠️ Приближаешься к лимиту — рекомендуется заранее зарегистрировать ИП (занимает 3 дня).`
              : `Текущий ARR: ${(annualRev/1e6).toFixed(2)} млн ₽ из 2.4 млн лимита НПД`}
          </p>
        </div>

        {/* Пороги дальнейшего роста (актуальны после перехода на ИП) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "НПД → ИП УСН 6%", limit: 2_400_000, desc: "Лимит самозанятости", color: "#f59e0b" },
            { label: "УСН 6% → УСН 8%", limit: 150_000_000, desc: "Повышенная ставка", color: "#f97316" },
            { label: "УСН 8% → ОСНО",   limit: 265_000_000, desc: "Потеря УСН",         color: "#ef4444" },
          ].map(({ label, limit, desc, color }) => {
            const pct = Math.min(Math.round(annualRev / limit * 100), 100);
            const rem = Math.max(0, limit - annualRev);
            return (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 10, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${BOR}` }}>
                <p style={{ fontSize: 11, color, fontWeight: 600, margin: "0 0 2px" }}>{label}</p>
                <p style={{ fontSize: 10, color: MUTED, margin: "0 0 8px" }}>{desc} · {(limit/1e6).toFixed(1)} млн ₽/год</p>
                <div style={{ height: 3, borderRadius: 99, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: pct + "%", borderRadius: 99, background: color }} />
                </div>
                <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>{pct >= 100 ? "✓ превышен" : `${pct}% · осталось ${rem >= 1e6 ? (rem/1e6).toFixed(0)+"M" : (rem/1000).toFixed(0)+"K"} ₽`}</p>
              </div>
            );
          })}
        </div>
      </Sec>

      {/* ── Чеклист ── */}
      <Sec title="Чеклист: что нужно сделать">
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 10, marginTop: -4 }}>Кликни — отметь как выполненное</p>

        <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Сейчас (самозанятость)</p>
        <Check id="yookassa_npd"  label="YooKassa подключена через самозанятость ✓" sub="Уже сделано — платежи принимаются легально." />
        <Check id="pp"            label="Оферта и политика конфиденциальности на сайте" sub="Обязательно по 152-ФЗ для любого B2C сервиса, собирающего email и имена пользователей." warn />
        <Check id="pd_notify"     label="Уведомить Роскомнадзор об обработке персданных" sub="Онлайн через портал РКН (pd.rkn.gov.ru), бесплатно. Штраф без уведомления — до 300K ₽." warn />

        <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, margin: "16px 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>При приближении к 2.4 млн ₽/год</p>
        <Check id="ip_reg"        label="Зарегистрировать ИП через Госуслуги" sub="Бесплатно, 3 рабочих дня. ОКВЭД основной: 62.01, дополнительные: 63.11, 85.41." />
        <Check id="usn"           label="Подать форму 26.2-1 (УСН 6%) при регистрации ИП" sub="Критично! Без этой формы ИП автоматически на ОСНО — это НДС 20% и налог на прибыль 25%." warn />
        <Check id="account"       label="Открыть расчётный счёт ИП (Тинькофф Бизнес)" sub="Онлайн, 0 ₽/мес на старте. Нужен для переключения выплат YooKassa с личной карты." />
        <Check id="yookassa_ip"   label="Переключить YooKassa на расчётный счёт ИП" sub="Загрузить документы ИП в личный кабинет YooKassa, указать новый расчётный счёт." />

        <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, margin: "16px 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>По мере роста</p>
        <Check id="trademark"     label="Зарегистрировать товарный знак «Mentora»" sub="ФИПС (Роспатент) — ~30 000 ₽ госпошлина + 3–4 месяца. Защита бренда от копирования." />
        <Check id="accountant"    label="Подключить онлайн-бухгалтерию (Эльба / Контур)" sub="При переходе на ИП. Эльба от 2 500 ₽/мес — автосчёт налогов, отчёты в ФНС." />
        <Check id="kep"           label="Получить КЭП (электронную подпись)" sub="Нужна для отчётов в ФНС онлайн и подписания договоров с B2B клиентами. От 1 500 ₽/год." />
        <Check id="ege_license"   label="Изучить вопрос образовательной лицензии" sub="Актуально при запуске курсов с сертификатами или B2B со школами." />
      </Sec>

      {/* ── ОКВЭД ── */}
      <Sec title="ОКВЭД для Mentora (при регистрации ИП)">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { code: "62.01", label: "Разработка ПО", note: "Основной — обязательно", accent: true },
            { code: "63.11", label: "Обработка данных", note: "AI-сервисы, хостинг" },
            { code: "85.41", label: "Доп. образование детей и взрослых", note: "EdTech, репетиторство" },
            { code: "62.09", label: "Деятельность в сфере ИТ", note: "Прочие ИТ-услуги" },
            { code: "85.11", label: "Школьное образование", note: "При B2B со школами" },
            { code: "74.90", label: "Прочая проф. деятельность", note: "Консалтинг" },
          ].map(({ code, label, note, accent }) => (
            <div key={code} style={{ padding: "10px 12px", borderRadius: 10, background: accent ? BRAND + "12" : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"), border: `1px solid ${accent ? BRAND + "30" : BOR}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: accent ? "#a0b4ff" : TEXT, margin: "0 0 2px", fontFamily: "monospace" }}>{code}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{label}</p>
              <p style={{ fontSize: 10, color: MUTED, margin: "2px 0 0", opacity: 0.7 }}>{note}</p>
            </div>
          ))}
        </div>
      </Sec>

      {/* ── Дорожная карта ── */}
      <Sec title="Юридическая дорожная карта">
        {[
          { phase: "Сейчас · НПД 4%",    color: "#22c55e", items: ["Самозанятость оформлена ✓", "YooKassa подключена ✓", "Оферта + политика персданных на сайте", "Уведомление РКН (персданные)"] },
          { phase: "≈ 150–200K ₽/мес",   color: "#f59e0b", items: ["Переход на ИП + УСН Доходы 6%", "Расчётный счёт (Тинькофф Бизнес)", "Переключить YooKassa", "Онлайн-бухгалтерия Эльба"] },
          { phase: "ARR > 5–10 млн ₽",   color: "#4561E8", items: ["Товарный знак «Mentora» (Роспатент)", "КЭП для отчётности", "Договор с API-провайдерами (Anthropic ToS)"] },
          { phase: "Первый B2B",          color: "#a78bfa", items: ["ООО (параллельно или вместо ИП)", "Шаблон договора для организаций", "Образовательная лицензия при необходимости"] },
          { phase: "Раунд инвестиций",    color: "#fbbf24", items: ["Реструктуризация (ООО → АО или холдинг ОАЭ/Кипр)", "ESOP для команды", "Due diligence пакет", "Юрист по венчурным сделкам"] },
        ].map(({ phase, color, items }) => (
          <div key={phase} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, marginTop: 3 }} />
              <div style={{ width: 1, flex: 1, background: BOR, marginTop: 4 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color, margin: "0 0 6px" }}>{phase}</p>
              {items.map(item => (
                <p key={item} style={{ fontSize: 12, color: MUTED, margin: "2px 0", paddingLeft: 8, borderLeft: `2px solid ${color}30` }}>• {item}</p>
              ))}
            </div>
          </div>
        ))}
      </Sec>

      {/* ── Дисклеймер ── */}
      <div style={{ padding: "10px 14px", borderRadius: 10, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${BOR}` }}>
        <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.6 }}>
          ⚠️ <strong style={{ color: TEXT }}>Это информационная справка, не юридическая консультация.</strong> Для регистрации, получения лицензий и структурирования сделок обращайся к юристу. Лимиты и ставки актуальны на 2024–2025 гг.
        </p>
      </div>
    </div>
  );
}

type Tab = "overview" | "users" | "revenue" | "knowledge" | "team" | "roadmap" | "legal";

export default function AdminPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tok = isDark ? darkTok : lightTok;
  const { BG, SIDE, CARD, BOR, TEXT, MUTED } = tok;

  const [tab, setTab]         = useState<Tab>("overview");
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rmChecked, setRmChecked] = useState<Set<string>>(new Set());

  // Load roadmap state from localStorage
  useEffect(() => { setRmChecked(loadRoadmapChecked()); }, []);

  const toggleTask = useCallback((id: string) => {
    setRmChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveRoadmapChecked(next);
      return next;
    });
  }, []);

  const clearRoadmap = useCallback(() => {
    const empty = new Set<string>();
    saveRoadmapChecked(empty);
    setRmChecked(empty);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/stats"); if (r.ok) setStats(await r.json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Record conversion rate snapshot to localStorage (one per day)
  useEffect(() => {
    if (!stats || stats.users.total === 0) return;
    const rate = parseFloat(((stats.users.pro + stats.users.ultima) / stats.users.total * 100).toFixed(2));
    const today = new Date().toISOString().split("T")[0];
    const hist = loadConvHistory();
    if (hist.length === 0 || hist[hist.length - 1].date !== today) {
      saveConvHistory([...hist, { date: today, rate }]);
    }
  }, [stats]);

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
    { id: "roadmap",   icon: IRoadmap, label: "Роадмап" },
    { id: "legal",     icon: ILegal,   label: "Право" },
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

          {/* ── MILESTONE TIMELINE (always visible) ─────────────────────── */}
          <MilestoneTimeline checked={rmChecked} />

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

            {/* Conversion rate history card */}
            {(() => {
              const convHist = loadConvHistory();
              const currentRate = stats.users.total > 0
                ? parseFloat(((stats.users.pro + stats.users.ultima) / stats.users.total * 100).toFixed(2))
                : 0;
              const W = 400, H = 56, PAD = 8;
              const rates = convHist.map(s => s.rate);
              const minR  = rates.length > 1 ? Math.min(...rates) : 0;
              const maxR  = rates.length > 1 ? Math.max(...rates) : Math.max(currentRate, 1);
              const range = maxR - minR || 1;
              const toX = (i: number) => rates.length < 2 ? W/2 : PAD + (i / (rates.length - 1)) * (W - PAD*2);
              const toY = (r: number) => H - PAD - ((r - minR) / range) * (H - PAD*2);
              const pts  = rates.map((r, i) => `${toX(i)},${toY(r)}`).join(" ");
              const area = rates.length > 1
                ? `M${toX(0)},${H} ` + rates.map((r, i) => `L${toX(i)},${toY(r)}`).join(" ") + ` L${toX(rates.length-1)},${H} Z`
                : "";
              return (
                <Card ch={<>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Конверсия в платящих</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: MUTED }}>{convHist.length} дней в истории</span>
                      <div style={{ padding: "3px 10px", borderRadius: 99, background: currentRate >= 5 ? "#22c55e20" : currentRate >= 2 ? "#f59e0b20" : "#ef444420", border: `1px solid ${currentRate >= 5 ? "#22c55e40" : currentRate >= 2 ? "#f59e0b40" : "#ef444440"}` }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: currentRate >= 5 ? GREEN : currentRate >= 2 ? AMBER : RED }}>{currentRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  {convHist.length >= 2 ? (
                    <div style={{ position: "relative" }}>
                      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 56 }}>
                        <defs>
                          <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={BRAND} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={BRAND} stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {area && <path d={area} fill="url(#convGrad)" />}
                        {rates.length > 1 && <polyline points={pts} fill="none" stroke={BRAND} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
                        {/* Latest dot */}
                        {rates.length > 0 && <circle cx={toX(rates.length-1)} cy={toY(rates[rates.length-1])} r="4" fill={BRAND} />}
                      </svg>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: MUTED }}>{convHist[0]?.date}</span>
                        <span style={{ fontSize: 10, color: MUTED }}>сегодня</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 56, color: MUTED, fontSize: 12 }}>
                      {convHist.length === 0 ? "Первый снимок записан — приходи завтра за графиком" : "Нужно минимум 2 дня данных для графика"}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BOR}` }}>
                    {[
                      ["Платящих всего", stats.users.pro + stats.users.ultima],
                      ["Pro", stats.users.pro],
                      ["Ultima", stats.users.ultima],
                      ["Всего юзеров", stats.users.total],
                    ].map(([l, v]) => (
                      <div key={l as string} style={{ flex: 1, textAlign: "center" }}>
                        <p style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>{v}</p>
                        <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </>} style={{ marginBottom: 16 }} />
              );
            })()}

            <Card ch={<>
              <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Последние регистрации</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["Email","Тариф","Регистрация","Последний визит","Сообщ. сегодня"].map(h => <TH key={h} label={h} />)}</tr></thead>
                <tbody>{stats.recentUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${BOR}` }}>
                    <TD>{u.email}</TD>
                    <TD><Badge plan={u.plan} /></TD>
                    <TD muted>{ago(u.created_at)} назад</TD>
                    <TD muted>{u.last_active_at ? ago(u.last_active_at) + " назад" : "—"}</TD>
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

            {/* Revenue Calculator — перенесён из Роадмапа */}
            <div style={{ marginTop: 16 }}>
              <RevenueCalculator />
            </div>
          </>}

          {/* ── KNOWLEDGE ────────────────────────────────────────────────────── */}
          {tab === "knowledge" && <KnowledgeTab />}
          {tab === "team"      && <TeamTab />}
          {tab === "roadmap"   && <RoadmapTab checked={rmChecked} onToggle={toggleTask} onClear={clearRoadmap} />}
          {tab === "legal"     && <LegalTab annualRev={arr} />}
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
