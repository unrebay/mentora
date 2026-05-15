"use client";
import { useState } from "react";
import DemoChatModal from "@/components/DemoChatModal";

/**
 * Button that opens <DemoChatModal />. Lives on mobile landing as the
 * replacement for the previously embedded <DemoChat /> block.
 */
export default function DemoChatModalTrigger({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full max-w-sm inline-flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, rgba(69,97,232,0.92) 0%, rgba(107,143,255,0.92) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow:
            "0 10px 32px rgba(69,97,232,0.40), 0 1px 0 rgba(255,255,255,0.20) inset, 0 0 0 1px rgba(255,255,255,0.06) inset",
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {label}
      </button>
      <DemoChatModal open={open} onClose={() => setOpen(false)} ctaLabel={label} />
    </>
  );
}
