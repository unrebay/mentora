"use client";
import { useLocale } from "next-intl";

/**
 * Минимальный футер для приватных рабочих страниц.
 *
 * Делаем client-компонентом, чтобы его можно было свободно использовать
 * как из server pages (например /dashboard/page.tsx), так и из "use client"
 * страниц (например /dashboard/about/page.tsx, который весь client-side).
 *
 * Содержит ровно одну строку: «Mentora x.y.z · Поддержка в Telegram».
 */
export default function AppFooterClient({ version }: { version: string }) {
  const locale = useLocale();
  const isEn = locale === "en";
  return (
    <footer
      className="py-4 border-t"
      style={{
        borderColor: "var(--border-light)",
        background: "var(--bg)",
        color: "var(--text-muted)",
      }}
    >
      <div
        className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-2 text-[11px]"
        style={{ opacity: 0.6 }}
      >
        <span>Mentora {version}</span>
        <span aria-hidden>·</span>
        <a
          href="https://t.me/mentora_support_bot"
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-100 transition-opacity"
          style={{ opacity: 0.75 }}
        >
          {isEn ? "Telegram support" : "Поддержка в Telegram"}
        </a>
      </div>
    </footer>
  );
}
