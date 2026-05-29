"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MeLogo from "@/components/MeLogo";

type OpenPill = null | "xp" | "streak" | "plan" | "messages";

interface Props {
  totalXP: number;
  currentStreak: number;
  bestStreak: number;
  isPro: boolean;
  isUltima: boolean;
  messagesRemaining: number;
  limit: number;
  resetAt: string | null;
  locale: string;
  streakDaysStr: string;   // e.g. "1 день"
  streakLabelStr: string;  // e.g. "Стрик:"
  removeLimitStr: string;
  unlimitedStr: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const glass = {
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
} as const;

const pillBase = {
  ...glass,
  background: "var(--bg-nav)",
  border: "1px solid var(--border-light)",
  borderRadius: 999,
  boxShadow: "0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  userSelect: "none" as const,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "opacity 0.15s",
} as const;

function Popup({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <div
      style={{
        ...glass,
        position: "absolute",
        [align]: 0,
        top: "calc(100% + 10px)",
        width: 232,
        background: "var(--bg-nav)",
        border: "1px solid var(--border-light)",
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
        padding: "14px 16px 12px",
        zIndex: 50,
      }}
    >
      {children}
    </div>
  );
}

function PopupTitle({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: color ?? "var(--brand)", marginBottom: 8 }}>
      {children}
    </p>
  );
}

function PopupBody({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-secondary)", marginBottom: 0 }}>
      {children}
    </p>
  );
}

function PopupCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className="flex items-center justify-center w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
      style={{
        background: "rgba(69,97,232,0.1)",
        border: "1px solid rgba(69,97,232,0.2)",
        color: "var(--brand)",
      }}>
      {children}
    </Link>
  );
}

export default function DashboardStatsPills({
  totalXP, currentStreak, bestStreak,
  isPro, isUltima,
  messagesRemaining, limit, resetAt,
  locale,
  streakDaysStr, streakLabelStr, removeLimitStr, unlimitedStr,
}: Props) {
  const [open, setOpen] = useState<OpenPill>(null);
  const [msLeft, setMsLeft] = useState<number | null>(
    resetAt ? Math.max(0, new Date(resetAt).getTime() - Date.now()) : null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const ru = locale === "ru";

  useEffect(() => {
    if (!resetAt) return;
    const tick = () => setMsLeft(Math.max(0, new Date(resetAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resetAt]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (pill: OpenPill) => setOpen(v => v === pill ? null : pill);

  const isLow = messagesRemaining <= 3;
  const showTimer = resetAt !== null && msLeft !== null && msLeft > 0;

  return (
    <div ref={containerRef} className="flex items-center justify-between gap-3 flex-wrap">

      {/* ── LEFT: XP + Streak ──────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* XP pill */}
        {totalXP > 0 && (
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => toggle("xp")}
              style={{ ...pillBase, color: "var(--text)", fontWeight: 700 }}>
              <MeLogo height={14} />
              <span className="tabular-nums">{totalXP}</span>
            </button>
            {open === "xp" && (
              <Popup align="left">
                <PopupTitle color="var(--brand)">{ru ? "Опыт · XP" : "Experience · XP"}</PopupTitle>
                <PopupBody>
                  {ru
                    ? <>За каждый вопрос ты получаешь XP. Больше XP — выше уровень и новые достижения.<br /><br />
                      <strong style={{ color: "var(--text)" }}>Всего XP: {totalXP}</strong></>
                    : <>You earn XP for every question. More XP means higher level and new achievements.<br /><br />
                      <strong style={{ color: "var(--text)" }}>Total XP: {totalXP}</strong></>}
                </PopupBody>
              </Popup>
            )}
          </div>
        )}

        {/* Streak pill */}
        {currentStreak > 0 && (
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => toggle("streak")}
              style={{ ...pillBase, border: "1px solid rgba(255,122,0,0.18)", color: "var(--text-secondary)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="#FF7A00" />
              </svg>
              {streakLabelStr} <span style={{ color: "#FF7A00", fontWeight: 700 }}>{streakDaysStr}</span>
            </button>
            {open === "streak" && (
              <Popup align="left">
                <PopupTitle color="#FF7A00">{ru ? "Стрик" : "Streak"}</PopupTitle>
                <PopupBody>
                  {ru
                    ? <>Занимайся каждый день — стрик не прервётся. Пропустишь день — счётчик сбросится.<br /><br />
                      <strong style={{ color: "#FF7A00" }}>Сейчас: {streakDaysStr}</strong>
                      {bestStreak > currentStreak && <><br /><span style={{ color: "var(--text-muted)", fontSize: 11 }}>Рекорд: {bestStreak} дн.</span></>}</>
                    : <>Study every day to keep your streak going. Miss a day and it resets.<br /><br />
                      <strong style={{ color: "#FF7A00" }}>Now: {streakDaysStr}</strong>
                      {bestStreak > currentStreak && <><br /><span style={{ color: "var(--text-muted)", fontSize: 11 }}>Best: {bestStreak} days</span></>}</>}
                </PopupBody>
              </Popup>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Plan + messages ─────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap justify-end">

        {/* Plan pill — FREE */}
        {!isPro && (
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => toggle("plan")}
              style={{ ...pillBase, padding: "5px 14px", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>
              FREE
            </button>
            {open === "plan" && (
              <Popup align="right">
                <PopupTitle>{ru ? "Бесплатный план" : "Free plan"}</PopupTitle>
                <PopupBody>
                  {ru
                    ? <>10 сообщений каждые 8 часов. Без рекламы.<br />Улучши тариф — и лимит исчезнет навсегда.</>
                    : <>10 messages every 8 hours. No ads.<br />Upgrade to remove the limit forever.</>}
                </PopupBody>
                <PopupCta href={`/${locale}/pricing`}>
                  {ru ? "Улучшить тариф →" : "Upgrade →"}
                </PopupCta>
              </Popup>
            )}
          </div>
        )}

        {/* Plan pill — PRO / ULTRA */}
        {isPro && (
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => toggle("plan")}
              style={{
                ...(isUltima
                  ? { background: "linear-gradient(135deg,#FF7A00,#7C3AED)", boxShadow: "0 2px 12px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" }
                  : { background: "linear-gradient(135deg,#4561E8,#6B8FFF)", boxShadow: "0 2px 12px rgba(69,97,232,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" }),
                ...glass,
                borderRadius: 999,
                border: "none",
                padding: "5px 14px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#fff",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}>
              {isUltima ? "ULTRA" : "PRO"}
            </button>
            {open === "plan" && (
              <Popup align="right">
                <PopupTitle color={isUltima ? "#FF7A00" : "var(--brand)"}>{isUltima ? "ULTRA" : "PRO"}</PopupTitle>
                <PopupBody>
                  {ru
                    ? <>{isUltima ? "Максимальный план." : "Продвинутый план."} Безлимитные сообщения, приоритетный доступ к новым функциям.</>
                    : <>{isUltima ? "Maximum plan." : "Advanced plan."} Unlimited messages, priority access to new features.</>}
                </PopupBody>
              </Popup>
            )}
          </div>
        )}

        {/* Messages + timer pill (free only) */}
        {!isPro && (
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => toggle("messages")}
              style={{
                ...glass,
                background: isLow ? "rgba(245,158,11,0.07)" : "var(--bg-nav)",
                border: `1px solid ${isLow ? "rgba(245,158,11,0.30)" : "var(--border-light)"}`,
                borderRadius: 999,
                boxShadow: "0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: isLow ? "#f59e0b" : "var(--text-secondary)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}>
              <span className="tabular-nums" style={{ color: isLow ? "#f59e0b" : "var(--text)", fontWeight: 700 }}>
                {messagesRemaining}/{limit}
              </span>
              {showTimer && (
                <>
                  <span style={{ opacity: 0.25, fontWeight: 300 }}>·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums font-mono"
                    style={{ fontSize: 12, color: isLow ? "#f59e0b" : "#7c9cff" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatCountdown(msLeft!)}
                  </span>
                </>
              )}
            </button>
            {open === "messages" && (
              <Popup align="right">
                <PopupTitle color={isLow ? "#f59e0b" : "var(--brand)"}>{ru ? "Сообщения" : "Messages"}</PopupTitle>
                <PopupBody>
                  {ru
                    ? <>Бесплатный план — <strong>10 сообщений за 8 часов</strong>. Осталось: <strong style={{ color: isLow ? "#f59e0b" : "var(--text)" }}>{messagesRemaining}</strong>.
                      {showTimer ? <><br />Сброс через <strong>{formatCountdown(msLeft!)}</strong>.</> : <><br />Начни диалог, чтобы запустить счётчик.</>}</>
                    : <>Free plan — <strong>10 messages per 8 hours</strong>. Remaining: <strong style={{ color: isLow ? "#f59e0b" : "var(--text)" }}>{messagesRemaining}</strong>.
                      {showTimer ? <><br />Resets in <strong>{formatCountdown(msLeft!)}</strong>.</> : <><br />Start a chat to begin the timer.</>}</>}
                </PopupBody>
                <PopupCta href={`/${locale}/pricing`}>
                  {ru ? "Убрать лимит →" : "Remove limit →"}
                </PopupCta>
              </Popup>
            )}
          </div>
        )}

        {/* Unlimited (pro only) */}
        {isPro && (
          <div className="inline-flex items-center gap-2"
            style={{
              ...pillBase,
              color: "var(--brand)",
              cursor: "default",
              fontWeight: 500,
            }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4.5 10c0-1.93 1.57-3.5 3.5-3.5S11.5 8.07 11.5 10s-1.57 3.5-3.5 3.5S4.5 11.93 4.5 10zm7 0c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5" />
            </svg>
            {unlimitedStr}
          </div>
        )}

        {/* Убрать лимит (free only) */}
        {!isPro && (
          <Link href={`/${locale}/pricing`}
            className="inline-flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            style={{
              ...glass,
              background: "rgba(69,97,232,0.07)",
              border: "1px solid rgba(69,97,232,0.18)",
              borderRadius: 999,
              boxShadow: "0 2px 16px rgba(69,97,232,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--brand)",
            }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1l1.5 4.5H14l-3.75 2.72 1.43 4.38L8 10l-3.68 2.6 1.43-4.38L2 5.5h4.5L8 1z" />
            </svg>
            {removeLimitStr}
          </Link>
        )}
      </div>
    </div>
  );
}
