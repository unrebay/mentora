"use client";
import { useTranslations } from "next-intl";

export default function DemoScrollButton() {
  const t = useTranslations("landing");
  return (
    <button
      type="button"
      onClick={() => {
        const el = document.getElementById("demo");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          document.querySelector<HTMLInputElement>("#demo input")?.focus();
        }, 400);
      }}
      className="px-7 py-3.5 border border-white/20 text-gray-300 font-medium rounded-full hover:border-white/40 hover:text-white transition-colors backdrop-blur-sm"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      {t("demo")}
    </button>
  );
}
