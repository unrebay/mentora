"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import DemoVideoModal from "@/components/DemoVideoModal";

export default function DemoScrollButton() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-7 py-3.5 border border-white/20 text-gray-300 font-medium rounded-full hover:border-white/40 hover:text-white transition-colors backdrop-blur-sm inline-flex items-center gap-2"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        {/* Play icon */}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
        {t("demo")}
      </button>
      <DemoVideoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
