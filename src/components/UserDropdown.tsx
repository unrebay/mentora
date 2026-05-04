"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LevelAvatar, { LEVEL_TIER_NAMES, unlockedLevel } from "@/components/LevelAvatar";

interface Props {
  totalXP: number;
  currentStreak: number;
  isPro: boolean;
  isUltima: boolean;
  selectedAvatarLevel?: number | null;
  serialId?: number | null;
  email?: string | null;
  displayName?: string | null;
  logoutAction: () => Promise<void>;
}

export default function UserDropdown({
  totalXP, currentStreak, isPro, isUltima,
  selectedAvatarLevel, serialId, email, displayName, logoutAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const lvl = selectedAvatarLevel ?? unlockedLevel(totalXP);

  // Lazy-fetch rank on first open
  useEffect(() => {
    if (!open || rank) return;
    let cancelled = false;
    fetch("/api/leaderboard?limit=10")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d?.myRank && d?.myTotal) setRank({ rank: d.myRank, total: d.myTotal }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, rank]);

  // Close on outside click + ESC
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const planLabel = isUltima ? "Ultra" : isPro ? "Pro" : "Free";
  const planColor = isUltima ? "#a78bfa" : isPro ? "#4561E8" : "#9ca3af";

  return (
    <div ref={ref} className="relative">
      {/* Trigger — circular avatar */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Профиль"
        aria-expanded={open}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: open ? "1.5px solid rgba(124,58,237,0.55)" : "1px solid var(--border)",
          background: "var(--bg-secondary)", overflow: "hidden", cursor: "pointer",
          boxShadow: open ? "0 0 18px rgba(124,58,237,0.35)" : "inset 0 1px 0 rgba(255,255,255,0.06)",
          transition: "all .15s",
        }}
      >
        <LevelAvatar level={lvl} size={36} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0,
            width: 280, zIndex: 50,
            borderRadius: 14, overflow: "hidden",
            background: "linear-gradient(160deg, rgba(124,58,237,0.10), rgba(255,255,255,0.02) 60%, transparent), var(--bg-card)",
            border: "1px solid rgba(124,58,237,0.30)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
            animation: "userDropdownIn 0.18s ease-out",
          }}
        >
          <style>{`
            @keyframes userDropdownIn {
              from { opacity: 0; transform: translateY(-6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Identity row */}
          <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)" }}>
              <LevelAvatar level={lvl} size={44} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                  {displayName || (email ? email.split("@")[0] : "Гость")}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: planColor + "22", color: planColor, border: `1px solid ${planColor}40`,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                }}>{planLabel}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {LEVEL_TIER_NAMES[lvl]}{serialId ? ` · ID #${serialId}` : ""}
              </div>
            </div>
          </div>

          {/* Stats strip — ments + global rank */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 14px 12px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 10px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>Менты</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{totalXP.toLocaleString("ru-RU")}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 10px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>Место</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
                {rank ? `#${rank.rank}` : "—"}
                {rank && <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}> из {rank.total.toLocaleString("ru-RU")}</span>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Profile link */}
          <div style={{ padding: "6px 0" }}>
            <Item href="/profile" icon={<IconUser />} label="Профиль" onClick={() => setOpen(false)} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Contact us — TG + Email side by side */}
          <div style={{ padding: "10px 14px 12px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
              Написать нам
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <a href="https://t.me/mentora_su_bot" target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 10px", fontSize: 12, fontWeight: 600,
                  background: "rgba(35,156,234,0.10)", color: "#5BB5F0", border: "1px solid rgba(35,156,234,0.30)",
                  borderRadius: 8, textDecoration: "none", transition: "background .12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(35,156,234,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(35,156,234,0.10)")}>
                <IconTelegram />
                <span style={{ color: "#5BB5F0" }}>Telegram</span>
              </a>
              <a href="mailto:hello@mentora.su"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 10px", fontSize: 12, fontWeight: 600,
                  background: "rgba(124,58,237,0.10)", color: "#9F7AFF", border: "1px solid rgba(124,58,237,0.30)",
                  borderRadius: 8, textDecoration: "none", transition: "background .12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(124,58,237,0.10)")}>
                <IconMail />
                <span>Почта</span>
              </a>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Logout */}
          <form action={logoutAction}>
            <button type="submit" style={{
              width: "100%", padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: 600,
              background: "transparent", border: "none", color: "#ef4444", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <IconLogout />
              <span>Выйти</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Menu item ────────────────────────────────────────────────────────────────
function Item({ href, icon, label, highlight, onClick }: {
  href: string; icon: React.ReactNode; label: string; highlight?: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px", fontSize: 13, fontWeight: 500,
        color: highlight ? "#a78bfa" : "var(--text)",
        textDecoration: "none", transition: "background .12s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", color: highlight ? "#a78bfa" : "var(--text-muted)" }}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
const sw = { fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconUser()    { return <svg viewBox="0 0 24 24" width="14" height="14" {...sw}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>; }
function IconLogout()  { return <svg viewBox="0 0 24 24" width="14" height="14" {...sw}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>; }
function IconTelegram(){ return <svg viewBox="0 0 24 24" width="14" height="14" fill="#5BB5F0"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>; }
function IconMail()    { return <svg viewBox="0 0 24 24" width="14" height="14" {...sw}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
