/**
 * Сайт-уровневые футеры. Два экспорта:
 *
 *  <PublicFooter />  — на публичных страницах (/, /about, /pricing,
 *                      /guide, /privacy, /terms). Лого + копирайт + 4
 *                      ссылки. Тонкий, без glass-эффекта, малозаметный.
 *                      Юр-инфо (ИНН/РКН) намеренно не показываем — она
 *                      раскрыта на /privacy и /terms, этого достаточно.
 *                      Async серверный компонент — чтобы дергать
 *                      next-intl серверные хелперы.
 *
 *  <AppFooter />     — на приватных рабочих страницах (/dashboard,
 *                      /profile, /dashboard/analytics, /dashboard/about).
 *                      Одна строка: версия + ссылка в Telegram-поддержку.
 *                      Client-компонент (поэтому работает и из server,
 *                      и из "use client" родителя — /dashboard/about).
 *
 *  Никуда не подключаем на /auth, /knowledge (full-bleed scenes),
 *  /learn/[subject] (full-screen chat) — там футер мешает UX.
 */
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import { getTranslations, getLocale } from "next-intl/server";
import AppFooterClient from "@/components/AppFooterClient";

const VERSION = "5.1.0";

export async function PublicFooter() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const isEn = locale === "en";

  // Подписи ссылок: пытаемся брать из nav, если ключа нет — fallback по локали.
  const labels = {
    pricing:  safe(() => t("pricing"),  isEn ? "Pricing" : "Тарифы"),
    guide:    safe(() => t("guide"),    isEn ? "Guide"   : "Гайд"),
    privacy:  isEn ? "Privacy"  : "Конфиденциальность",
    terms:    isEn ? "Terms"    : "Условия",
  };

  return (
    <footer
      className="border-t mt-8"
      style={{
        borderColor: "var(--border-light)",
        background: "var(--bg)",
        color: "var(--text-muted)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
        {/* Левый блок: маленький лого + копирайт */}
        <div className="flex items-center gap-3">
          <Logo size="sm" fontSize="1rem" href="/" />
          <span className="opacity-70">© 2026 Mentora</span>
        </div>

        {/* Правый блок: 4 ссылки */}
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/pricing" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7 }}>
            {labels.pricing}
          </Link>
          <Link href="/guide" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7 }}>
            {labels.guide}
          </Link>
          <Link href="/privacy" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7 }}>
            {labels.privacy}
          </Link>
          <Link href="/terms" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7 }}>
            {labels.terms}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/* AppFooter — реэкспорт клиентского варианта (нужен чтобы из "use client"
   страниц (например /dashboard/about) тоже можно было его смонтировать). */
export function AppFooter() {
  return <AppFooterClient version={VERSION} />;
}

/* helper: возвращает результат t-callable или fallback, если ключа в messages нет */
function safe(fn: () => string, fallback: string): string {
  try {
    const v = fn();
    return v && !v.startsWith("nav.") ? v : fallback;
  } catch {
    return fallback;
  }
}
