"use client";
import { useState } from "react";

interface Props {
  message: string;
}

export default function AdminMessageBanner({ message }: Props) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  async function dismiss() {
    setFading(true);
    setTimeout(() => setVisible(false), 350);
    // Fire-and-forget — clear from DB so banner doesn't reappear
    fetch("/api/admin/dismiss-message", { method: "POST" }).catch(() => {});
  }

  if (!visible) return null;

  return (
    <div
      className="mb-6 relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(107,135,255,0.13) 0%, rgba(124,58,237,0.10) 100%)",
        border: "1px solid rgba(107,135,255,0.30)",
        padding: "18px 20px",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(-6px) scale(0.98)" : "translateY(0) scale(1)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Subtle sparkle dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 2 === 0 ? 4 : 2.5,
              height: i % 2 === 0 ? 4 : 2.5,
              left: `${8 + i * 14}%`,
              top: `${20 + (i * 19) % 55}%`,
              background: "rgba(107,135,255,0.5)",
              animation: `mentoraSpark ${1.2 + (i % 3) * 0.4}s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center gap-4">
        {/* Gift icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: 42, height: 42,
            background: "rgba(107,135,255,0.15)",
            border: "1px solid rgba(107,135,255,0.30)",
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
            stroke="#6B8FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold mb-0.5" style={{ color: "var(--text)" }}>
            Подарок от Mentora 🎁
          </div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            {message}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all hover:opacity-70"
          style={{
            width: 28, height: 28,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.4)",
          }}
          aria-label="Закрыть"
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
