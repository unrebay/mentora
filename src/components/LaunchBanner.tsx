"use client";
import { useState, useEffect } from "react";

const DISMISS_KEY = "mentora_launch_banner_dismissed";

export default function LaunchBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-2xl px-4 py-3.5 border"
      style={{
        background: "linear-gradient(135deg, rgba(69,97,232,0.10) 0%, rgba(130,80,255,0.08) 100%)",
        borderColor: "rgba(69,97,232,0.22)",
      }}
    >
      {/* Calendar icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "rgba(69,97,232,0.15)", border: "1px solid rgba(69,97,232,0.25)" }}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="rgba(107,135,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="16" height="15" rx="2.5" />
          <line x1="2" y1="8" x2="18" y2="8" />
          <line x1="6" y1="1" x2="6" y2="5" />
          <line x1="14" y1="1" x2="14" y2="5" />
          <circle cx="10" cy="13" r="1.2" fill="rgba(107,135,255,0.95)" stroke="none" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight" style={{ color: "var(--brand)" }}>
          Публичный запуск — 1 июня
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Ты уже внутри — расскажи друзьям! Все зарегистрированные до 1 июня получат месяц Pro бесплатно.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/profile"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
          style={{ background: "rgba(69,97,232,0.15)", color: "var(--brand)", border: "1px solid rgba(69,97,232,0.2)" }}
        >
          Реф. ссылка <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle" }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <button
          onClick={dismiss}
          className="flex items-center justify-center transition-colors hover:opacity-70"
          style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(69,97,232,0.10)", color: "var(--text-muted)", border: "1px solid rgba(69,97,232,0.15)", flexShrink: 0 }}
          aria-label="Закрыть"
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
