"use client";
import { useEffect, useState } from "react";
import DemoChat from "@/components/DemoChat";

/**
 * DemoChatModal — centered card with blurred backdrop. Wraps <DemoChat />.
 *
 * Layout: a single centered card (max-w-md, ≤85vh) on top of a fully blurred,
 * darkened backdrop — NOT a full-screen takeover. This keeps the demo focused
 * and centered both horizontally and vertically regardless of viewport size.
 *
 * Used on mobile landing (via the «Открыть живое демо» trigger) and from the
 * desktop hero (via the «развернуть» button on the embedded DemoChat).
 */
export default function DemoChatModal({
  open,
  onClose,
  ctaLabel,
}: {
  open: boolean;
  onClose: () => void;
  ctaLabel?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open && !mounted) return null;

  return (
    <div
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label={ctaLabel ?? "Demo chat"}
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 pt-20 sm:pt-3"
      style={{
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Blurred dimmed backdrop — covers the whole viewport */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "rgba(4,6,15,0.82)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        }}
        onClick={onClose}
      />

      {/* Centered card */}
      <div
        className="relative z-[1] w-full max-w-md mx-auto rounded-3xl overflow-hidden flex flex-col"
        style={{
          height: "min(720px, calc(100vh - 100px))",
          background: "rgba(8,10,24,0.94)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.10) inset, 0 0 0 1px rgba(69,97,232,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — top-right inside the card */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть демо-чат"
          className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            width: 32,
            height: 32,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "white",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Chat content — fills the card with breathing room (поля) */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-4 sm:p-6 pt-12 sm:pt-12">
          <DemoChat inModal />
        </div>
      </div>
    </div>
  );
}
