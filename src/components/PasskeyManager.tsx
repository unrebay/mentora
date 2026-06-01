"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

export default function PasskeyManager() {
  const t = useTranslations("passkey");
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.passkey.list();
      if (!error && Array.isArray(data)) setItems(data as Passkey[]);
    } catch { /* passkey may be disabled server-side — show empty state */ }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) setMsg({ type: "err", text: t("addError") });
      else { setMsg({ type: "ok", text: t("added") }); await load(); }
    } catch {
      setMsg({ type: "err", text: t("addError") });
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
      if (error) setMsg({ type: "err", text: t("deleteError") });
      else await load();
    } catch {
      setMsg({ type: "err", text: t("deleteError") });
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 mb-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="8" r="5" /><path d="M2 21a8 8 0 0 1 10.434-7.62" /><circle cx="18" cy="16" r="3" /><path d="M18 19v3M21 16h-1.5M16.5 16H15" />
        </svg>
        <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>{t("title")}</h3>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{t("description")}</p>

      {!loading && items.length > 0 && (
        <ul className="space-y-2 mb-4">
          {items.map((pk) => (
            <li key={pk.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
              style={{ background: "var(--bg-subtle, rgba(127,127,127,0.06))", border: "1px solid var(--border)" }}>
              <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                {pk.friendly_name || t("genericName")}
              </span>
              <button onClick={() => remove(pk.id)} disabled={busy}
                className="text-xs font-medium px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
                {t("delete")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={add} disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
        style={{ background: "var(--brand)", color: "#fff" }}>
        {busy
          ? <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>}
        {t("add")}
      </button>

      {msg && (
        <p className="text-xs mt-3" style={{ color: msg.type === "ok" ? "#10B981" : "#ef4444" }}>{msg.text}</p>
      )}
    </div>
  );
}
