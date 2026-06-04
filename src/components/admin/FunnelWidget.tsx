"use client";
import { useEffect, useState } from "react";

interface Stage {
  key: string;
  label: string;
  count: number;
  pctOfTotal: number;
  pctOfPrev: number;
}

interface Props {
  isDark: boolean;
  TEXT: string;
  MUTED: string;
  CARD: string;
  BOR: string;
}

const STAGE_COLORS = ["#4561E8", "#6B8FFF", "#9F7AFF", "#EC4899", "#F59E0B"];

const PERIODS = [
  { days: 0, label: "Всё время" },
  { days: 30, label: "30 дн" },
  { days: 7, label: "7 дн" },
] as const;

export default function FunnelWidget({ isDark, TEXT, MUTED, CARD, BOR }: Props) {
  const [stages, setStages] = useState<Stage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(0);

  async function load(d: number = days) {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/funnel" + (d ? `?days=${d}` : ""));
      const j = await r.json();
      setStages(j.stages);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(days); }, [days]);

  return (
    <div style={{ marginBottom: 28, padding: "20px 22px", background: CARD, borderRadius: 14, border: `1px solid ${BOR}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Conversion Funnel</h3>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {PERIODS.map((p) => (
            <button key={p.days} onClick={() => setDays(p.days)}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${days === p.days ? "#4561E8" : BOR}`,
                color: days === p.days ? "#4561E8" : MUTED,
                background: days === p.days ? "rgba(69,97,232,0.08)" : "none", fontWeight: days === p.days ? 700 : 500 }}>
              {p.label}
            </button>
          ))}
        <button onClick={() => load()} disabled={loading} style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${BOR}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>↻</button>
        </div>
      </div>

      {!stages && <p style={{ fontSize: 12, color: MUTED }}>{loading ? "Загрузка..." : "Нет данных"}</p>}

      {stages && stages.map((s, i) => {
        const color = STAGE_COLORS[i] ?? "#4561E8";
        return (
          <div key={s.key} style={{ marginBottom: i < stages.length - 1 ? 12 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{s.label}</span>
              <span style={{ fontSize: 12, color: MUTED }}>
                <strong style={{ color: TEXT, fontSize: 14, marginRight: 8 }}>{s.count}</strong>
                <span style={{ color, fontWeight: 600 }}>{s.pctOfTotal}%</span>
                {i > 0 && <span style={{ marginLeft: 6 }}>· {s.pctOfPrev}% от пред.</span>}
              </span>
            </div>
            <div style={{ height: 8, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.pctOfTotal}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
