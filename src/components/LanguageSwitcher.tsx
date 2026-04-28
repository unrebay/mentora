"use client";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";

interface Props {
  /** Force dark styling (for landing hero / dark nav) */
  dark?: boolean;
  className?: string;
}

export default function LanguageSwitcher({ dark, className }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = locale === "ru" ? "en" : "ru";
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  const textColor = dark
    ? "rgba(255,255,255,0.65)"
    : "var(--text-secondary)";

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={locale === "ru" ? "Switch to English" : "Переключить на русский"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 8,
        border: dark
          ? "1px solid rgba(255,255,255,0.14)"
          : "1px solid var(--border)",
        background: dark
          ? "rgba(255,255,255,0.07)"
          : "var(--card)",
        color: textColor,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: isPending ? "wait" : "pointer",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.15s, background 0.15s",
        lineHeight: 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {/* Globe icon */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      {locale === "ru" ? "EN" : "RU"}
    </button>
  );
}
