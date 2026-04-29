"use client";

/**
 * WhatsNewBanner — shown to logged-in users on the dashboard.
 * Dismissed on ✕ click and stores the dismissed version in localStorage.
 * Re-appears when CHANGELOG[0].version changes.
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { LATEST } from "@/lib/changelog";

export default function WhatsNewBanner() {
  const t = useTranslations("whatsNew");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("mentora_whats_new_dismissed");
      if (dismissed !== LATEST.version) setVisible(true);
    } catch {
      // localStorage недоступен (приватный режим) — не показываем
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem("mentora_whats_new_dismissed", LATEST.version); } catch {}
  }

  if (!visible) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-4 border"
      style={{
        background: "linear-gradient(135deg, rgba(69,97,232,0.06) 0%, rgba(107,143,255,0.04) 100%)",
        borderColor: "rgba(69,97,232,0.18)",
      }}
    >
      {/* Иконка */}
      <span className="text-2xl leading-none mt-0.5 shrink-0">{LATEST.badge}</span>

      {/* Текст */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(69,97,232,0.12)", color: "#4561E8" }}
          >
            v{LATEST.version} · {t("label")}
          </span>
          <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            {LATEST.title}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {LATEST.dashboardHint ?? LATEST.description}
        </p>
      </div>

      {/* Закрыть */}
      <button
        onClick={dismiss}
        aria-label={t("hide")}
        className="shrink-0 mt-0.5 rounded-lg p-1 transition-colors hover:bg-[var(--bg-secondary)]"
        style={{ color: "var(--text-muted)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
