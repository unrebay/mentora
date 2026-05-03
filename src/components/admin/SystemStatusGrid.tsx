"use client";
import { useEffect, useState } from "react";

interface ServiceStatus {
  service: string;
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

interface Props {
  isDark: boolean;
  TEXT: string;
  MUTED: string;
  CARD: string;
  BOR: string;
}

export default function SystemStatusGrid({ isDark, TEXT, MUTED, CARD, BOR }: Props) {
  const [data, setData] = useState<{ checks: ServiceStatus[]; generatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/admin/system-status");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); const id = setInterval(load, 60_000); return () => clearInterval(id); }, []);

  return (
    <div style={{ marginBottom: 28, padding: "20px 22px", background: CARD, borderRadius: 14, border: `1px solid ${BOR}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>System Status</h3>
        <button onClick={load} disabled={loading} style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${BOR}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
          {loading ? "..." : "↻"}
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef4444" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {(data?.checks ?? Array(5).fill(null)).map((c: ServiceStatus | null, i: number) => {
          const ok = c?.ok ?? null;
          const color = ok === null ? "#94a3b8" : ok ? "#22c55e" : "#ef4444";
          const bg = ok === null ? "rgba(148,163,184,0.07)" : ok ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.08)";
          const border = ok === null ? `${BOR}` : ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.30)";
          return (
            <div key={c?.service ?? i} style={{ padding: "10px 14px", borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: ok ? `0 0 8px ${color}88` : "none" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{c?.service ?? "—"}</span>
              </div>
              <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.4 }}>
                {c
                  ? <>
                      {c.ok ? `${c.latencyMs}ms` : "DOWN"}
                      {c.detail && <span style={{ display: "block", marginTop: 2, opacity: 0.7 }}>{String(c.detail).slice(0, 40)}</span>}
                    </>
                  : "loading..."}
              </div>
            </div>
          );
        })}
      </div>
      {data?.generatedAt && (
        <p style={{ fontSize: 10, color: MUTED, marginTop: 10, opacity: 0.6 }}>
          Обновлено {new Date(data.generatedAt).toLocaleTimeString("ru-RU")} · обновляется каждую минуту
        </p>
      )}
    </div>
  );
}
