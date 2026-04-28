"use client";
import { useState } from "react";

interface Props {
  code: string;
}

export default function SupportCodeCopy({ code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        Код поддержки
      </p>
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-base font-bold tracking-widest px-4 py-2 rounded-xl select-all"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            letterSpacing: "0.18em",
          }}
        >
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: copied ? "rgba(69,97,232,0.15)" : "var(--bg-secondary)",
            border: `1px solid ${copied ? "rgba(69,97,232,0.4)" : "var(--border)"}`,
            color: copied ? "#4561E8" : "var(--text-secondary)",
          }}
          title="Скопировать код"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="2,9 6,13 14,4" />
              </svg>
              Скопировано
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="1" width="9" height="11" rx="2" />
                <path d="M10 4H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2" />
              </svg>
              Скопировать
            </>
          )}
        </button>
      </div>
      <p className="text-xs max-w-[260px]" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
        Укажи этот код боту поддержки — он сразу найдёт твой аккаунт
      </p>
    </div>
  );
}
