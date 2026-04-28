"use client";
import { useState } from "react";

const IG_URL = "https://www.instagram.com/mentora.su";

// Pink/rose palette
const C = "225,48,108";

function IgIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

interface Props {
  size?: "sm" | "md";
  label?: string;
  className?: string;
  /** Show Meta disclaimer below button. Defaults to true for md, false for sm. */
  showDisclaimer?: boolean;
}

export default function InstagramButton({
  size = "md",
  label = "Instagram",
  className = "",
  showDisclaimer,
}: Props) {
  const [hover, setHover] = useState(false);
  const sm = size === "sm";
  const disclaimer = showDisclaimer ?? !sm;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <a
        href={IG_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Открыть Instagram Mentora"
        className={`inline-flex items-center gap-2 font-semibold transition-all duration-200 select-none ${
          sm ? "px-3 py-1.5 text-[11.5px] rounded-xl" : "px-4 py-2 text-sm rounded-xl"
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
        <IgIcon size={sm ? 13 : 15} />
        {label}
      </a>
      {disclaimer && (
        <p
          className="text-center"
          style={{
            fontSize: "9px",
            lineHeight: 1.3,
            color: "var(--text-muted)",
            opacity: 0.45,
            maxWidth: 220,
          }}
        >
          Instagram — продукт Meta Platforms Inc. Деятельность Meta признана экстремистской и запрещена в РФ
        </p>
      )}
    </div>
  );
}
