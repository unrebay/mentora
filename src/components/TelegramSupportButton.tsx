"use client";
import { useState } from "react";

const TG_URL = "https://t.me/mentora_su_bot";

function TgIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.008 9.461c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.604.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.605l-2.95-.924c-.642-.2-.654-.642.136-.951l11.527-4.448c.537-.194 1.006.131.609.966z"/>
    </svg>
  );
}

interface Props {
  /** Visual size: "sm" for inline/compact, "md" for standalone */
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

/**
 * Glass Telegram support button — links to @mentora_su_bot.
 * Uses muted teal palette with hover glow.
 */
export default function TelegramSupportButton({
  size = "md",
  label = "Написать в поддержку",
  className = "",
}: Props) {
  const [hover, setHover] = useState(false);
  const sm = size === "sm";

  return (
    <a
      href={TG_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Открыть Telegram-поддержку Mentora"
      className={`inline-flex items-center gap-2 font-medium transition-all duration-200 select-none ${
        sm ? "px-3 py-1.5 text-[11.5px] rounded-xl" : "px-5 py-2.5 text-sm rounded-2xl"
      } ${className}`}
      style={{
        background: hover
          ? "rgba(56,189,213,0.13)"
          : "rgba(56,189,213,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${hover ? "rgba(56,189,213,0.30)" : "rgba(56,189,213,0.18)"}`,
        color: hover ? "#8de4f4" : "#6dcfe8",
        boxShadow: hover
          ? "0 0 22px rgba(56,189,213,0.18), 0 2px 12px rgba(56,189,213,0.10), inset 0 1px 0 rgba(255,255,255,0.07)"
          : "0 0 10px rgba(56,189,213,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
        transform: hover ? "translateY(-1px)" : "none",
        textDecoration: "none",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <TgIcon size={sm ? 13 : 15} />
      {label}
    </a>
  );
}
