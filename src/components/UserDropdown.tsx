"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LevelAvatar, { LEVEL_TIER_NAMES, unlockedLevel } from "@/components/LevelAvatar";
import { useTheme } from "@/components/ThemeProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Props {
  totalXP: number;
  currentStreak: number;
  isPro: boolean;
  isUltima: boolean;
  selectedAvatarLevel?: number | null;
  serialId?: number | null;
  email?: string | null;
  displayName?: string | null;
  initialRank?: number | null;
  initialTotal?: number | null;
  logoutAction?: () => Promise<void>;
}

export default function UserDropdown({
  totalXP, currentStreak, isPro, isUltima,
  selectedAvatarLevel, serialId, email, displayName,
  initialRank, initialTotal, logoutAction,
}: Props) {
  const { mode, cycle: cycleTheme, theme } = useTheme();
  const [pulsing, setPulsing] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(
    initialRank && initialTotal ? { rank: Number(initialRank), total: Number(initialTotal) } : null
  );
  const [loadingRank, setLoadingRank] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lvl = selectedAvatarLevel ?? unlockedLevel(totalXP);

  // Lazy fallback: if rank wasn't passed in from server, fetch on first open
  useEffect(() => {
    if (!open || rank || loadingRank) return;
    setLoadingRank(true);
    let cancelled = false;
    fetch("/api/leaderboard?limit=10", { credentials: "same-origin" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled) return;
        const r = d?.myRank != null ? Number(d.myRank) : null;
        const t = d?.myTotal != null ? Number(d.myTotal) : null;
        if (r && t) setRank({ rank: r, total: t });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingRank(false); });
    return () => { cancelled = true; };
  }, [open, rank, loadingRank]);

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

  // Inactivity pulse — soft breathing glow around the avatar trigger after 10s
  // of no user input. Same UX language as the navbar TourButton pulse.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const arm = () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      setPulsing(false);
      pulseTimerRef.current = setTimeout(() => setPulsing(true), 10_000);
    };
    const events = ["mousemove", "touchstart", "keydown", "scroll", "click"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, []);

  // Name fallback: full_name → display_name → email username → "Пользователь"
  const name = displayName?.trim() || (email ? email.split("@")[0] : "") || "Пользователь";
  const planLabel = isUltima ? "Ultra" : isPro ? "Pro" : "Free";
  const planColor = isUltima ? "#a78bfa" : isPro ? "#4561E8" : "#9ca3af";

  return (
    <div ref={ref} className="relative">
      {/* Trigger — circular avatar */}
      <button
        type="button"
        onClick={() => { setPulsing(false); setOpen(v => !v); }}
        aria-label="Открыть меню профиля"
        aria-expanded={open}
        style={{
          width: 30, height: 30, borderRadius: "50%",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: open ? "1.5px solid rgba(124,58,237,0.55)" : "1px solid var(--border)",
          background: "var(--bg-secondary)", overflow: "hidden", cursor: "pointer",
          boxShadow: open
            ? "0 0 18px rgba(124,58,237,0.35)"
            : pulsing
              ? undefined  // animated via box-shadow keyframes below
              : "inset 0 1px 0 rgba(255,255,255,0.06)",
          // mentoraTourPulse is defined in globals.css and breathes a soft brand
          // glow around any rounded element — same animation as the navbar tour
          // button so the UX language is consistent across both surfaces.
          animation: !open && pulsing ? "mentoraTourPulse 2.4s ease-in-out infinite" : "none",
          transition: "all .15s",
        }}
      >
        <LevelAvatar level={lvl} size={30} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0,
            width: 296, zIndex: 50,
            borderRadius: 16, overflow: "hidden",
            background: "linear-gradient(160deg, rgba(124,58,237,0.10), rgba(255,255,255,0.02) 60%, transparent), color-mix(in srgb, var(--bg-card) 82%, transparent)",
            border: "1px solid rgba(124,58,237,0.22)",
            backdropFilter: "blur(32px) saturate(1.9)",
            WebkitBackdropFilter: "blur(32px) saturate(1.9)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.14)",
            animation: "userDropdownIn 0.18s ease-out",
          }}
        >
          <style>{`
            @keyframes userDropdownIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Identity row — bigger avatar with glow ring */}
          <div style={{ padding: "16px 16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 52, height: 52, borderRadius: "50%", overflow: "hidden",
              border: "1.5px solid rgba(124,58,237,0.35)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "var(--bg-secondary)",
              boxShadow: "0 0 16px rgba(124,58,237,0.20), inset 0 1px 2px rgba(255,255,255,0.08)",
            }}>
              <LevelAvatar level={lvl} size={52} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                  {name}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                  background: planColor + "22", color: planColor, border: `1px solid ${planColor}40`,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>{planLabel}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontWeight: 500 }}>
                {LEVEL_TIER_NAMES[lvl]}{serialId ? ` · ID #${serialId}` : ""}
              </div>
            </div>
          </div>

          {/* Stats strip — ments + global rank */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 16px 14px" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(255,255,255,0.02))",
              border: "1px solid rgba(245,158,11,0.20)",
              borderRadius: 10, padding: "8px 12px",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Менты</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
                {totalXP.toLocaleString("ru-RU")}
              </div>
            </div>
            <div style={{
              background: "linear-gradient(135deg, rgba(69,97,232,0.10), rgba(255,255,255,0.02))",
              border: "1px solid rgba(69,97,232,0.22)",
              borderRadius: 10, padding: "8px 12px",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Место</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
                {rank ? `#${rank.rank.toLocaleString("ru-RU")}` : (loadingRank ? <span style={{ opacity: 0.5 }}>···</span> : "—")}
                {rank && <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, marginLeft: 4 }}>из {rank.total.toLocaleString("ru-RU")}</span>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 20%, rgba(255,255,255,0.10) 80%, transparent)" }} />

          {/* Profile link — single nav item */}
          <div style={{ padding: "8px 0" }}>
            <Item href="/profile" icon={<IconUser />} label="Открыть профиль" onClick={() => setOpen(false)} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 20%, rgba(255,255,255,0.10) 80%, transparent)" }} />

          {/* Settings — theme cycle, language, logout. Moved here from the
              navbar so the top bar is clean (only icon + pills + avatar). */}
          <div style={{ padding: "8px 16px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); cycleTheme(); }}
              title="Сменить тему (system → light → dark)"
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                fontSize: 12, fontWeight: 600, color: "var(--text)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: 9, cursor: "pointer",
                flex: 1,
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>
                {mode === "light" ? "☀" : mode === "dark" ? "🌙" : "🖥"}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {mode === "system" ? `Авто · ${theme === "dark" ? "тёмная" : "светлая"}` : mode === "light" ? "Светлая" : "Тёмная"}
              </span>
            </button>
            <LanguageSwitcher />
          </div>

          {/* Logout — server-action form */}
          {logoutAction && (
            <div style={{ padding: "4px 16px 12px" }}>
              <form action={logoutAction}>
                <button
                  type="submit"
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 10px", fontSize: 12, fontWeight: 600,
                    background: "rgba(220,38,38,0.10)", color: "#f87171",
                    border: "1px solid rgba(220,38,38,0.30)",
                    borderRadius: 9, cursor: "pointer",
                  }}
                >
                  Выйти из аккаунта
                </button>
              </form>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 20%, rgba(255,255,255,0.10) 80%, transparent)" }} />

          {/* Contact us — TG + Email side by side */}
          <div style={{ padding: "12px 16px 14px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
              Написать нам
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <a href="https://t.me/mentora_su_bot" target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 10px", fontSize: 12, fontWeight: 600,
                  background: "linear-gradient(135deg, rgba(35,156,234,0.14), rgba(35,156,234,0.06))",
                  color: "#5BB5F0",
                  border: "1px solid rgba(35,156,234,0.32)",
                  borderRadius: 9, textDecoration: "none",
                  transition: "transform .15s, background .15s, box-shadow .15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(35,156,234,0.22), rgba(35,156,234,0.10))";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(35,156,234,0.25)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(35,156,234,0.14), rgba(35,156,234,0.06))";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                <IconTelegram />
                <span>Telegram</span>
              </a>
              <a href="mailto:hello@mentora.su"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 10px", fontSize: 12, fontWeight: 600,
                  background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(124,58,237,0.06))",
                  color: "#9F7AFF",
                  border: "1px solid rgba(124,58,237,0.32)",
                  borderRadius: 9, textDecoration: "none",
                  transition: "transform .15s, background .15s, box-shadow .15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(124,58,237,0.10))";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(124,58,237,0.25)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(124,58,237,0.06))";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                <IconMail />
                <span>Почта</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Menu item ────────────────────────────────────────────────────────────────
function Item({ href, icon, label, onClick }: {
  href: string; icon: React.ReactNode; label: string; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", fontSize: 13, fontWeight: 600,
        color: "var(--text)",
        textDecoration: "none", transition: "background .12s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        {icon}
      </span>
      <span>{label}</span>
      <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 14 }}>→</span>
    </Link>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
const sw = { fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconUser()    { return <svg viewBox="0 0 24 24" width="14" height="14" {...sw}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>; }
function IconTelegram(){ return <svg viewBox="0 0 24 24" width="14" height="14" fill="#5BB5F0"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>; }
function IconMail()    { return <svg viewBox="0 0 24 24" width="14" height="14" {...sw}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
