"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function PricingFAQ({ dark = true }: { dark?: boolean }) {
  const t = useTranslations("faq");
  const [open, setOpen] = useState<number | null>(null);

  const FAQ = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ];

  const cardBg      = dark ? "rgba(255,255,255,0.04)"   : "var(--bg-card)";
  const cardBorder  = dark ? "rgba(255,255,255,0.08)"   : "var(--border)";
  const activeBorder= dark ? "rgba(107,143,255,0.45)"  : "var(--brand)";
  const activeShadow= dark ? "0 0 0 1px rgba(107,143,255,0.45)" : "0 0 0 1px var(--brand)";
  const qColor      = dark ? "rgba(255,255,255,0.85)"  : "var(--text)";
  const aColor      = dark ? "rgba(255,255,255,0.45)"  : "var(--text-muted)";
  const iconBg      = dark ? "rgba(255,255,255,0.07)"  : "var(--bg-secondary)";
  const iconColor   = dark ? "rgba(255,255,255,0.4)"   : "var(--text-muted)";
  const brandBg     = dark ? "#4561E8"                 : "var(--brand)";

  return (
    <div className="space-y-2">
      {FAQ.map(({ q, a }, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            background: cardBg,
            border: `1px solid ${open === i ? activeBorder : cardBorder}`,
            boxShadow: open === i ? activeShadow : "none",
            backdropFilter: dark ? "blur(12px)" : undefined,
          }}
        >
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-sm leading-snug" style={{ color: qColor }}>{q}</span>
            <span
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: open === i ? brandBg : iconBg,
                transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 6h8M6 2v8" style={{ color: open === i ? "white" : iconColor }} />
              </svg>
            </span>
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: open === i ? "300px" : "0px" }}
          >
            <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: aColor }}>
              {a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
