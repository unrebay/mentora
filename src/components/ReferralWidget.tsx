"use client";
import { useState, useEffect } from "react";

interface ReferralData {
  code: string;
  link: string;
  totalInvited: number;
  completed: number;
  rewarded: number;
}

export default function ReferralWidget() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  const copyLink = () => {
    if (!data?.link) return;
    navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return (
    <div className="s-raised rounded-2xl border p-5 animate-pulse" style={{ borderColor: "var(--border-light)" }}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
  );

  return (
    <div className="s-raised rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border-light)" }}>
      <div>
        <p className="text-sm font-semibold t-primary mb-0.5">Пригласи друга — получи 3 дня Pro</p>
        <p className="text-xs t-muted">Друг регистрируется по ссылке → оба получают бонус</p>
      </div>

      {/* Link copy area */}
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2.5 rounded-xl text-xs t-secondary font-mono truncate s-input border" style={{ borderColor: "var(--border)" }}>
          {data.link}
        </div>
        <button onClick={copyLink}
          className="shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors"
          style={{ background: copied ? "#16a34a" : "var(--brand)" }}>
          {copied ? "✓ Скопировано" : "Копировать"}
        </button>
      </div>

      {/* Stats */}
      {data.completed > 0 && (
        <div className="flex gap-4 text-xs t-secondary">
          <span>👥 Приглашено: <strong className="t-primary">{data.totalInvited}</strong></span>
          <span>✅ Зарегистрировалось: <strong className="t-primary">{data.completed}</strong></span>
          {data.rewarded > 0 && <span>🎁 Бонусов получено: <strong className="t-primary">{data.rewarded}</strong></span>}
        </div>
      )}
    </div>
  );
}
