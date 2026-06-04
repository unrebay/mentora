"use client";
import { useEffect, useState } from "react";

interface CohortRow {
  week: string; size: number;
  d1: number; d7: number; d30: number;
  d1Pct: number; d7Pct: number; d30Pct: number;
}

interface Props { isDark: boolean; TEXT: string; MUTED: string; CARD: string; BOR: string }

/** Цвет ячейки по уровню retention (heatmap) */
function cellBg(pct: number, isDark: boolean): string {
  if (pct <= 0) return isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const alpha = Math.min(0.15 + (pct / 100) * 0.65, 0.8);
  return `rgba(69, 97, 232, ${alpha.toFixed(2)})`;
}

export default function CohortRetentionWidget({ isDark, TEXT, MUTED, CARD, BOR }: Props) {
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/cohorts");
      const j = await r.json();
      setRows(j.cohorts);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const fmtWeek = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div style={{ marginBottom: 28, padding: "20px 22px", background: CARD, borderRadius: 14, border: `1px solid ${BOR}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Retention по когортам</h3>
        <button onClick={load} disabled={loading} style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${BOR}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>↻</button>
      </div>
      <p style={{ fontSize: 11, color: MUTED, margin: "0 0 14px" }}>
        Неделя регистрации × вернулись с сообщением. D1 — день 1; D7 — дни 4–10; D30 — дни 24–36. «—» = когорта ещё слишком молодая.
      </p>

      {!rows && <p style={{ fontSize: 12, color: MUTED }}>{loading ? "Загрузка..." : "Нет данных"}</p>}

      {rows && rows.length === 0 && <p style={{ fontSize: 12, color: MUTED }}>Пока нет когорт за последние 8 недель.</p>}

      {rows && rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, fontSize: 12 }}>
            <thead>
              <tr>
                {["Неделя", "Юзеров", "D1", "D7", "D30"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Неделя" ? "left" : "center", color: MUTED, fontWeight: 600, fontSize: 11, padding: "2px 6px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ageDays = Math.floor((Date.now() - new Date(r.week).getTime()) / 86400_000);
                const cell = (pct: number, n: number, minAge: number) => (
                  <td style={{ textAlign: "center", padding: "6px 8px", borderRadius: 8,
                    background: ageDays < minAge ? "transparent" : cellBg(pct, isDark),
                    color: ageDays < minAge ? MUTED : (pct > 40 ? "#fff" : TEXT), fontWeight: 600 }}>
                    {ageDays < minAge ? "—" : `${pct}%`}
                    {ageDays >= minAge && <span style={{ fontWeight: 400, opacity: 0.75, marginLeft: 4 }}>({n})</span>}
                  </td>
                );
                return (
                  <tr key={r.week}>
                    <td style={{ padding: "6px 6px", color: TEXT, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtWeek(r.week)}</td>
                    <td style={{ textAlign: "center", padding: "6px 8px", color: TEXT, fontWeight: 700 }}>{r.size}</td>
                    {cell(r.d1Pct, r.d1, 2)}
                    {cell(r.d7Pct, r.d7, 11)}
                    {cell(r.d30Pct, r.d30, 37)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
