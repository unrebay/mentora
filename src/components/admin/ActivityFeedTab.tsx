"use client";
import { useEffect, useState } from "react";

interface ActivityEvent {
  type: "signup" | "subscription" | "referral" | "gift_claim" | "trial_extension";
  ts: string;
  title: string;
  detail?: string;
  amount?: number;
}

interface Props {
  TEXT: string;
  MUTED: string;
  CARD: string;
  BOR: string;
}

const TYPE_META = {
  signup:        { color: "#4561E8", icon: "👤" },
  subscription:  { color: "#22c55e", icon: "💳" },
  referral:      { color: "#9F7AFF", icon: "🔗" },
  gift_claim:    { color: "#EC4899", icon: "🎁" },
  trial_extension: { color: "#F59E0B", icon: "⏱️" },
};

function fmtTime(ts: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000; // seconds
  if (diff < 60)        return `${Math.round(diff)} сек назад`;
  if (diff < 3600)      return `${Math.round(diff / 60)} мин назад`;
  if (diff < 86400)     return `${Math.round(diff / 3600)} ч назад`;
  if (diff < 7 * 86400) return `${Math.round(diff / 86400)} дн назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export default function ActivityFeedTab({ TEXT, MUTED, CARD, BOR }: Props) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/activity");
      const j = await r.json();
      setEvents(j.events);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BOR}`, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Activity Feed</h3>
        <button onClick={load} disabled={loading} style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${BOR}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>↻</button>
      </div>

      {!events && <p style={{ fontSize: 12, color: MUTED }}>{loading ? "Загрузка..." : "Нет событий"}</p>}

      {events && events.length === 0 && <p style={{ fontSize: 12, color: MUTED }}>Пока пусто. События появятся когда пользователи начнут регистрироваться, платить, использовать рефералы.</p>}

      {events && events.map((e, i) => {
        const m = TYPE_META[e.type] ?? { color: "#94a3b8", icon: "·" };
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < events.length - 1 ? `1px solid ${BOR}` : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: m.color + "15", border: `1px solid ${m.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
              {m.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>
                {e.title}
                {e.amount && <span style={{ marginLeft: 8, color: "#22c55e" }}>+{e.amount}₽</span>}
              </div>
              {e.detail && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{e.detail}</div>}
            </div>
            <div style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{fmtTime(e.ts)}</div>
          </div>
        );
      })}
    </div>
  );
}
