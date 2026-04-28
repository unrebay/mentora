"use client";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition, useState } from "react";

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
  const [hovered, setHovered] = useState(false);

  function toggle() {
    const next = locale === "ru" ? "en" : "ru";
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isPending}
      aria-label={locale === "ru" ? "Switch to English" : "Переключить на русский"}
      className={className}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "var(--border)"}`,
        background: hovered
          ? dark ? "rgba(255,255,255,0.10)" : "var(--bg-secondary)"
          : "transparent",
        backdropFilter: hovered ? "blur(12px)" : undefined,
        WebkitBackdropFilter: hovered ? "blur(12px)" : undefined,
        color: dark ? "rgba(255,255,255,0.65)" : "var(--text-secondary)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        cursor: isPending ? "wait" : "pointer",
        opacity: isPending ? 0.5 : 1,
        transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {locale.toUpperCase()}
    </button>
  );
}
