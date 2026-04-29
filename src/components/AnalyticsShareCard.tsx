"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Invite { id: string; label: string | null; created_at: string; expires_at: string | null; revoked_at: string | null }

export default function AnalyticsShareCard({ initialInvites }: { initialInvites: Invite[] }) {
  const t = useTranslations("analyticsShare");
  const [invites, setInvites] = useState<Invite[]>(initialInvites.filter(i => !i.revoked_at));
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mentora.su";

  const create = async () => {
    setCreating(true);
    const r = await fetch("/api/analytics/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() || null }),
    });
    const inv = await r.json();
    if (!inv.error) setInvites(prev => [inv, ...prev]);
    setLabel("");
    setCreating(false);
    setOpen(false);
  };

  const revoke = async (id: string) => {
    await fetch(`/api/analytics/invite?id=${id}`, { method: "DELETE" });
    setInvites(prev => prev.filter(i => i.id !== id));
  };

  const copy = (token: string) => {
    navigator.clipboard.writeText(`${baseUrl}/analytics/invite/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(69,97,232,0.07), rgba(159,122,255,0.05))", borderColor: "rgba(69,97,232,0.2)" }}>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(69,97,232,0.12)" }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4561E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>{t("title")}</h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            {t("desc")}
          </p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 4px 16px rgba(69,97,232,0.3)" }}>
          {t("createBtn")}
        </button>
      </div>

      {/* Create form */}
      {open && (
        <div className="mx-6 mb-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(69,97,232,0.15)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{t("nameLabel")}</p>
          <div className="flex gap-2">
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={t("namePlaceholder")}
              onKeyDown={e => e.key === "Enter" && create()}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={create}
              disabled={creating}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: creating ? "#64748b" : "#4561E8" }}>
              {creating ? t("creating") : t("create")}
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      {invites.length > 0 && (
        <div className="px-6 pb-5 space-y-2">
          {invites.map(inv => {
            const token = inv.id;
            const url = `${baseUrl}/analytics/invite/${token}`;
            return (
              <div key={inv.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                    {inv.label ?? t("noLabel")}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {url.replace("https://", "")}
                  </div>
                </div>
                <button
                  onClick={() => copy(token)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: copied === token ? "rgba(34,197,94,0.12)" : "rgba(69,97,232,0.10)",
                    color: copied === token ? "#22c55e" : "#4561E8",
                    border: `1px solid ${copied === token ? "rgba(34,197,94,0.25)" : "rgba(69,97,232,0.2)"}`,
                  }}>
                  {copied === token ? (
                    <><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{t("copied")}</>
                  ) : (
                    <><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>{t("copy")}</>
                  )}
                </button>
                <button
                  onClick={() => revoke(inv.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                  title={t("deleteTitle")}
                  style={{ color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {invites.length === 0 && !open && (
        <div className="px-6 pb-5">
          <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            {t("noLinks")}
          </p>
        </div>
      )}
    </div>
  );
}
