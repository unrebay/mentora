/**
 * Сайт-уровневые футеры. Два экспорта:
 *
 *  <PublicFooter />        — light-вариант (default), на /about, /pricing, /guide,
 *                            /privacy, /terms. Лого + копирайт + 4 ссылки.
 *                            Тонкий, без glass-эффекта.
 *  <PublicFooter dark />   — тёмный вариант. Используется на лендинге (/),
 *                            где CTA-блок над футером — тёмный, и светлый
 *                            футер давал резкий dark→light край.
 *                            Юр-инфо (ИНН/РКН) намеренно не показываем — она
 *                            раскрыта на /privacy и /terms, этого достаточно.
 *  <AppFooter />           — на приватных рабочих страницах (/dashboard, /profile,
 *                            /dashboard/analytics, /dashboard/about).
 *                            Одна строка: версия + ссылка в Telegram-поддержку.
 *
 *  Никуда не подключаем на /auth, /knowledge (full-bleed scenes),
 *  /learn/[subject] (full-screen chat) — там футер мешает UX.
 */
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import { getTranslations, getLocale } from "next-intl/server";
import AppFooterClient from "@/components/AppFooterClient";

const VERSION = "6.0.0";

export async function PublicFooter({ dark }: { dark?: boolean } = {}) {
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

  // ── Цветовая палитра — light vs dark ──────────────────────────────
  // dark вариант синхронизирован с тёмным CTA-блоком лендинга (#111827-tinted)
  // — чтобы переход dark→footer не был виден.
  const bg          = dark ? "#0B1226" : "var(--bg)";
  const borderColor = dark ? "rgba(255,255,255,0.06)" : "var(--border-light)";
  const textColor   = dark ? "rgba(255,255,255,0.55)" : "var(--text-muted)";
  const copyrightOpacity = dark ? 0.6 : 0.7;
  const linkColor   = dark ? "rgba(255,255,255,0.78)" : undefined;

  return (
    <footer
      className={"border-t" + (dark ? "" : " mt-8")}
      style={{
        borderColor,
        background: bg,
        color: textColor,
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
        {/* Левый блок: маленький лого + копирайт */}
        <div className="flex items-center gap-3">
          <Logo size="sm" fontSize="1rem" href="/" textColor={dark ? "rgba(255,255,255,0.92)" : undefined} />
          <span style={{ opacity: copyrightOpacity }}>© 2026 Mentora</span>
        </div>

        {/* Правый блок: 4 ссылки */}
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/repetitor" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7, color: linkColor }}>
            {labels.repetitor}
          </Link>
          <Link href="/podgotovka-k-ege" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7, color: linkColor }}>
            {labels.podgotovka}
          </Link>
          <Link href="/pricing" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7, color: linkColor }}>
            {labels.pricing}
          </Link>
          <Link href="/guide" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7, color: linkColor }}>
            {labels.guide}
          </Link>
          <Link href="/privacy" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7, color: linkColor }}>
            {labels.privacy}
          </Link>
          <Link href="/terms" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.7, color: linkColor }}>
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
