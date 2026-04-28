"use client";
import { useState } from "react";

const TG_BOT = "mentora_su_bot";

// Teal palette
const C = "56,189,213";

function TgIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.008 9.461c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.604.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.605l-2.95-.924c-.642-.2-.654-.642.136-.951l11.527-4.448c.537-.194 1.006.131.609.966z"/>
    </svg>
  );
}

interface Props {
  size?: "sm" | "md";
  label?: string;
  className?: string;
  /** When provided, opens bot with deep link: t.me/bot?start=CODE — bot auto-identifies user */
  supportCode?: string;
}

export default function TelegramSupportButton({
  size = "md",
  label = "Написать в поддержку",
  className = "",
  supportCode,
}: Props) {
  const [hover, setHover] = useState(false);
  const sm = size === "sm";

  // Deep link: t.me/bot?start=CODE passes code directly to /start handler
  const href = supportCode
    ? `https://t.me/${TG_BOT}?start=${encodeURIComponent(supportCode)}`
    : `https://t.me/${TG_BOT}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Открыть Telegram-поддержку Mentora"
      className={`inline-flex items-center gap-2 font-semibold transition-all duration-200 select-none ${
        sm ? "px-3 py-1.5 text-[11.5px] rounded-xl" : "px-5 py-2.5 text-sm rounded-2xl"
      } ${className}`}
      style={{
        background: hover
          ? `linear-gradient(180deg, rgba(${C},0.26) 0%, rgba(${C},0.10) 100%)`
          : `linear-gradient(180deg, rgba(${C},0.18) 0%, rgba(${C},0.06) 100%)`,
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        border: `1px solid rgba(${C},${hover ? "0.38" : "0.22"})`,
        color: hover ? `rgb(${C})` : `rgba(${C},0.85)`,
        boxShadow: hover
          ? `0 2px 8px rgba(0,0,0,0.12), 0 6px 24px rgba(${C},0.22), inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(${C},0.18)`
          : `0 1px 3px rgba(0,0,0,0.08), 0 3px 12px rgba(${C},0.14), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(${C},0.10)`,
        transform: hover ? "translateY(-1.5px)" : "none",
        textDecoration: "none",
        textShadow: `0 1px 2px rgba(${C},0.20)`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <TgIcon size={sm ? 13 : 15} />
      {label}
    </a>
  );
}
