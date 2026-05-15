"use client";
import { useState } from "react";
import DemoChat from "@/components/DemoChat";
import DemoChatModal from "@/components/DemoChatModal";

/**
 * Wrapper around <DemoChat /> that adds a small «развернуть» (expand) button
 * in the top-right corner. Click opens <DemoChatModal /> — a centered card
 * with the demo chat focused over a blurred backdrop, dismissable via X / ESC.
 *
 * Used on desktop landing in the hero column so users can pop the demo out of
 * the cramped hero layout into a focused centered card.
 */
export default function DemoChatWithExpand({ label }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={label ?? "Развернуть демо-чат"}
          title={label ?? "Развернуть"}
          className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            width: 30,
            height: 30,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <DemoChat />
      </div>
      <DemoChatModal open={open} onClose={() => setOpen(false)} ctaLabel={label} />
    </>
  );
}
