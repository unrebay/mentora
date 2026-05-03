"use client";
import { useEffect, useState } from "react";

interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface Response {
  entries: AuditEntry[];
  tableMissing?: boolean;
  note?: string;
  sql?: string;
}

interface Props {
  TEXT: string;
  MUTED: string;
  CARD: string;
  BOR: string;
}

export default function AuditLogTab({ TEXT, MUTED, CARD, BOR }: Props) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/audit-log");
      setData(await r.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (data?.tableMissing) {
    return (
      <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BOR}`, padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: "0 0 8px" }}>Audit Log</h3>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{data.note}</p>
        <pre style={{ background: "rgba(0,0,0,0.30)", color: "#a8c8ff", padding: 14, borderRadius: 8, fontSize: 11, lineHeight: 1.5, overflow: "auto", margin: "0 0 10px" }}>
          {data.sql}
        </pre>
        <button
          onClick={() => { navigator.clipboard.writeText(data.sql || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, background: "#4561E8", color: "white", border: "none", cursor: "pointer" }}
        >
          {copied ? "✓ Скопировано" : "Скопировать SQL"}
        </button>
        <p style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>
          Запусти этот SQL в Supabase → SQL Editor → Run. Потом обнови эту страницу.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BOR}`, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Audit Log</h3>
        <button onClick={load} disabled={loading} style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${BOR}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>↻</button>
      </div>

      {(!data || data.entries.length === 0) && (
        <p style={{ fontSize: 12, color: MUTED }}>
          {loading ? "Загрузка..." : "Журнал пуст. Записи появятся при админ-действиях."}
        </p>
      )}

      {data && data.entries.map((e, i) => (
        <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: i < data.entries.length - 1 ? `1px solid ${BOR}` : "none" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>
              {e.action}
              {e.target && <span style={{ color: MUTED, marginLeft: 8 }}>→ {e.target}</span>}
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{e.admin_email}</div>
          </div>
          <div style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{new Date(e.created_at).toLocaleString("ru-RU")}</div>
        </div>
      ))}
    </div>
  );
}
