"use client";
import { useEffect, useState } from "react";
import DemoChat from "@/components/DemoChat";

/**
 * DemoChatModal — fullscreen overlay with blur backdrop, wraps <DemoChat />.
 * Used on mobile landing so the demo opens "on top of everything", focused,
 * instead of being a static section below the hero.
 *
 * Desktop landing keeps the embedded <DemoChat /> in the hero column — no
 * modal needed there because the demo already lives in the user's first view.
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

  // Lock body scroll when modal is open + close on ESC
  useEffect(() => {
    if (!open) return;
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
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
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        // Pointer events off when closed (so the modal is invisible AND not clickable)
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onClick={(e) => {
        // Click on backdrop closes modal; click inside chat shell doesn't bubble out
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Blurred dimmed backdrop ──────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "rgba(4,6,15,0.72)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        }}
        onClick={onClose}
      />

      {/* ── Close button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть демо-чат"
        className="absolute z-10 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
        style={{
          top: "max(env(safe-area-inset-top, 0px) + 14px, 18px)",
          right: 16,
          width: 36,
          height: 36,
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          color: "white",
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* ── Chat shell ────────────────────────────────────────────────── */}
      <div
        className="relative z-[1] flex-1 flex flex-col overflow-hidden"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px) + 66px, 70px)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 16px, 16px)",
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <div className="flex-1 overflow-hidden">
          <DemoChat />
        </div>
      </div>
    </div>
  );
}
