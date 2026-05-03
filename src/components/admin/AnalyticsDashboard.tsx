"use client";
import { useEffect, useMemo, useState } from "react";

interface DayPoint {
  date: string;
  signups: number;
  activeUsers: number;
  messages: number;
  revenue: number;
}
interface Subject { id: string; count: number }
interface TimeseriesData {
  days: number;
  series: DayPoint[];
  topSubjects: Subject[];
  totals: { signups: number; activeUsers: number; messages: number; revenue: number };
  deltaVsPrev: {
    recent: { signups: number; activeUsers: number; messages: number; revenue: number };
    prior: { signups: number; activeUsers: number; messages: number; revenue: number };
  };
  generatedAt: string;
}

interface Props { TEXT: string; MUTED: string; CARD: string; BOR: string; isDark: boolean; }

type Metric = "signups" | "activeUsers" | "messages" | "revenue";

const METRIC_META: Record<Metric, { label: string; color: string; suffix: string }> = {
  signups:     { label: "Регистрации",       color: "#4561E8", suffix: "" },
  activeUsers: { label: "Активные пользователи", color: "#22c55e", suffix: "" },
  messages:    { label: "Сообщения",         color: "#9F7AFF", suffix: "" },
  revenue:     { label: "Доход",             color: "#F59E0B", suffix: " ₽" },
};

const SUBJECT_COLORS: Record<string, string> = {
  "russian-history": "#4561E8", "world-history": "#6366F1", "mathematics": "#9F7AFF",
  "physics": "#06B6D4", "chemistry": "#10B981", "biology": "#22C55E",
  "russian-language": "#F59E0B", "literature": "#FB923C", "english": "#EF4444",
  "social-studies": "#EC4899", "geography": "#84CC16", "computer-science": "#14B8A6",
  "astronomy": "#8B5CF6", "discovery": "#A855F7", "psychology": "#F472B6",
  "economics": "#FB7185", "philosophy": "#A78BFA",
};
const subjectColor = (id: string) => SUBJECT_COLORS[id] ?? "#94a3b8";
const subjectLabel = (id: string): string => {
  const map: Record<string, string> = {
    "russian-history": "История России", "world-history": "Всемирная история",
    "mathematics": "Математика", "physics": "Физика", "chemistry": "Химия",
    "biology": "Биология", "russian-language": "Русский", "literature": "Литература",
    "english": "Английский", "social-studies": "Обществознание", "geography": "География",
    "computer-science": "Информатика", "astronomy": "Астрономия", "discovery": "Кругозор",
    "psychology": "Психология", "economics": "Экономика", "philosophy": "Философия",
  };
  return map[id] ?? id;
};

const fmt = (n: number, suffix = "") => n.toLocaleString("ru-RU") + suffix;
const fmtDelta = (cur: number, prev: number): { text: string; positive: boolean } => {
  if (prev === 0) return { text: cur > 0 ? "+∞" : "0%", positive: cur > 0 };
  const pct = ((cur - prev) / prev) * 100;
  const rounded = Math.round(pct);
  return { text: `${rounded > 0 ? "+" : ""}${rounded}%`, positive: rounded >= 0 };
};

// ─── Sparkline (compact line in KPI card) ───────────────────────────────
function Sparkline({ values, color, w = 88, h = 30 }: { values: number[]; color: string; w?: number; h?: number }) {
  if (values.length < 2) return <svg width={w} height={h} />;
  const max = Math.max(1, ...values);
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => `${i * stepX},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" points={points} opacity={0.75} />
      <polyline fill={`url(#spark-grad-${color.replace("#","")})`} stroke="none" points={`0,${h} ${points} ${w},${h}`} opacity={0.18} />
      <defs>
        <linearGradient id={`spark-grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────
function KpiCard({ metric, total, prevTotal, sparkValues, active, onClick, CARD, BOR, TEXT, MUTED }: {
  metric: Metric; total: number; prevTotal: number; sparkValues: number[];
  active: boolean; onClick(): void;
  CARD: string; BOR: string; TEXT: string; MUTED: string;
}) {
  const m = METRIC_META[metric];
  const delta = fmtDelta(total, prevTotal);
  return (
    <button
      onClick={onClick}
      className="group"
      style={{
        position: "relative", textAlign: "left", padding: "16px 18px",
        background: CARD, border: `1px solid ${BOR}`, borderLeft: `2.5px solid ${active ? m.color : BOR}`,
        borderRadius: 14, cursor: "pointer", overflow: "hidden",
        transition: "transform 0.2s ease, border-color 0.2s ease",
        boxShadow: active ? `0 4px 18px ${m.color}30` : "none",
        width: "100%",
      }}
    >
      <div aria-hidden style={{
        position: "absolute", top: -30, right: -30, width: 90, height: 90, borderRadius: "50%",
        background: `radial-gradient(circle, ${m.color}26 0%, transparent 65%)`,
        opacity: active ? 0.95 : 0.4, transition: "opacity 0.3s", pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, margin: "0 0 6px" }}>
          {m.label}
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: TEXT, lineHeight: 1, margin: 0 }}>
            {fmt(total, m.suffix)}
          </p>
          <Sparkline values={sparkValues} color={m.color} />
        </div>
        <p style={{ fontSize: 11, color: delta.positive ? "#22c55e" : "#ef4444", margin: "6px 0 0", fontWeight: 600 }}>
          {delta.text} <span style={{ color: MUTED, fontWeight: 400 }}>vs пред. период</span>
        </p>
      </div>
    </button>
  );
}

// ─── Main area chart (selected metric, full period) ─────────────────────
function AreaChart({ series, metric, TEXT, MUTED, isDark }: {
  series: DayPoint[]; metric: Metric; TEXT: string; MUTED: string; isDark: boolean;
}) {
  const m = METRIC_META[metric];
  const W = 880, H = 240, pad = { l: 38, r: 12, t: 14, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = series.map(p => p[metric]);
  const max = Math.max(1, ...values);
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

  const path = series.map((p, i) => {
    const x = pad.l + i * stepX;
    const y = pad.t + innerH - (p[metric] / max) * innerH;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  const areaPath = `${path} L${pad.l + (series.length - 1) * stepX},${pad.t + innerH} L${pad.l},${pad.t + innerH} Z`;

  // Y-axis tick values (5 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: pad.t + innerH * (1 - t),
    label: Math.round(max * t),
  }));

  // X-axis labels (every nth tick to avoid overlap)
  const xLabelEvery = Math.max(1, Math.ceil(series.length / 7));

  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
      <defs>
        <linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={m.color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y gridlines + tick labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} y1={t.y} x2={W - pad.r} y2={t.y} stroke={gridColor} strokeWidth={1} />
          <text x={pad.l - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill={MUTED}>{t.label}</text>
        </g>
      ))}

      {/* Area + line */}
      <path d={areaPath} fill={`url(#area-${metric})`} />
      <path d={path} fill="none" stroke={m.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points (subtle dots) */}
      {series.map((p, i) => {
        const x = pad.l + i * stepX;
        const y = pad.t + innerH - (p[metric] / max) * innerH;
        return <circle key={i} cx={x} cy={y} r={2} fill={m.color} opacity={0.6} />;
      })}

      {/* X labels */}
      {series.map((p, i) => {
        if (i % xLabelEvery !== 0 && i !== series.length - 1) return null;
        const x = pad.l + i * stepX;
        const d = new Date(p.date);
        const lab = `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        return <text key={i} x={x} y={H - 8} textAnchor="middle" fontSize="10" fill={MUTED}>{lab}</text>;
      })}
    </svg>
  );
}

// ─── Top Subjects horizontal bar chart ──────────────────────────────────
function TopSubjectsBars({ subjects, TEXT, MUTED }: { subjects: Subject[]; TEXT: string; MUTED: string }) {
  if (subjects.length === 0) return <p style={{ fontSize: 12, color: MUTED }}>Нет данных за период.</p>;
  const max = Math.max(1, ...subjects.map(s => s.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {subjects.map(s => {
        const pct = (s.count / max) * 100;
        const color = subjectColor(s.id);
        return (
          <div key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{subjectLabel(s.id)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color }}>{fmt(s.count)}</span>
            </div>
            <div style={{ height: 6, background: "rgba(148,163,184,0.12)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity Feed (compact) ────────────────────────────────────────────
interface ActivityEvent {
  type: "signup" | "subscription" | "referral";
  ts: string;
  title: string;
  detail?: string;
  amount?: number;
}
const TYPE_META = {
  signup:        { color: "#4561E8", icon: "👤" },
  subscription:  { color: "#22c55e", icon: "💳" },
  referral:      { color: "#9F7AFF", icon: "🔗" },
};
function fmtTime(ts: string): string {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)        return `${Math.round(diff)} сек`;
  if (diff < 3600)      return `${Math.round(diff / 60)} мин`;
  if (diff < 86400)     return `${Math.round(diff / 3600)} ч`;
  if (diff < 7 * 86400) return `${Math.round(diff / 86400)} д`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function CompactActivity({ TEXT, MUTED, BOR }: { TEXT: string; MUTED: string; BOR: string }) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  useEffect(() => {
    fetch("/api/admin/activity").then(r => r.json()).then(j => setEvents(j.events ?? []));
  }, []);
  if (!events) return <p style={{ fontSize: 12, color: MUTED }}>Загрузка...</p>;
  if (events.length === 0) return <p style={{ fontSize: 12, color: MUTED }}>Пока нет событий.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {events.slice(0, 8).map((e, i) => {
        const m = TYPE_META[e.type as keyof typeof TYPE_META] ?? { color: "#94a3b8", icon: "·" };
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 7 ? `1px solid ${BOR}` : "none" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: m.color + "15", border: `1px solid ${m.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>
              {m.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {e.title}{e.amount ? <span style={{ marginLeft: 6, color: "#22c55e" }}>+{e.amount}₽</span> : null}
              </div>
              {e.detail && <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{e.detail}</div>}
            </div>
            <div style={{ fontSize: 10, color: MUTED, flexShrink: 0 }}>{fmtTime(e.ts)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────
export default function AnalyticsDashboard({ TEXT, MUTED, CARD, BOR, isDark }: Props) {
  const [data, setData] = useState<TimeseriesData | null>(null);
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<Metric>("signups");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/timeseries?days=${days}`);
      setData(await r.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [days]); // eslint-disable-line

  const sparkValues = useMemo(() => {
    if (!data) return { signups: [], activeUsers: [], messages: [], revenue: [] };
    return {
      signups:     data.series.map(p => p.signups),
      activeUsers: data.series.map(p => p.activeUsers),
      messages:    data.series.map(p => p.messages),
      revenue:     data.series.map(p => p.revenue),
    };
  }, [data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header — period toggle + refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${BOR}`, cursor: "pointer",
                background: days === d ? "#4561E8" : CARD,
                color: days === d ? "white" : MUTED,
              }}>
              {d} дн
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          style={{ fontSize: 11, color: MUTED, background: CARD, border: `1px solid ${BOR}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
          {loading ? "..." : "↻"}
        </button>
      </div>

      {/* KPI cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {(["signups", "activeUsers", "messages", "revenue"] as Metric[]).map(k => (
          <KpiCard key={k} metric={k}
            total={data?.totals[k] ?? 0}
            prevTotal={data?.deltaVsPrev.prior[k] ?? 0}
            sparkValues={sparkValues[k]}
            active={metric === k}
            onClick={() => setMetric(k)}
            CARD={CARD} BOR={BOR} TEXT={TEXT} MUTED={MUTED}
          />
        ))}
      </div>

      {/* Main area chart */}
      <div style={{ background: CARD, border: `1px solid ${BOR}`, borderRadius: 14, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>
            {METRIC_META[metric].label} · последние {days} дней
          </h3>
        </div>
        {data ? (
          <AreaChart series={data.series} metric={metric} TEXT={TEXT} MUTED={MUTED} isDark={isDark} />
        ) : (
          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 13 }}>
            {loading ? "Загрузка..." : "Нет данных"}
          </div>
        )}
      </div>

      {/* Bottom: Top subjects + Recent activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div style={{ background: CARD, border: `1px solid ${BOR}`, borderRadius: 14, padding: "20px 22px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: "0 0 14px" }}>
            Топ предметов · последние {days} дней
          </h3>
          {data ? <TopSubjectsBars subjects={data.topSubjects} TEXT={TEXT} MUTED={MUTED} /> : (
            <p style={{ fontSize: 12, color: MUTED }}>{loading ? "Загрузка..." : "Нет данных"}</p>
          )}
        </div>
        <div style={{ background: CARD, border: `1px solid ${BOR}`, borderRadius: 14, padding: "20px 22px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: "0 0 8px" }}>Последние события</h3>
          <CompactActivity TEXT={TEXT} MUTED={MUTED} BOR={BOR} />
        </div>
      </div>

      {data?.generatedAt && (
        <p style={{ fontSize: 10, color: MUTED, opacity: 0.6, textAlign: "right" }}>
          Обновлено {new Date(data.generatedAt).toLocaleTimeString("ru-RU")}
        </p>
      )}
    </div>
  );
}
