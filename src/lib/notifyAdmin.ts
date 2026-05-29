/**
 * Centralized admin notification via Telegram.
 * Uses TELEGRAM_SUPPORT_BOT_TOKEN with fallback to TELEGRAM_BOT_TOKEN.
 * Fire-and-forget — never throws, never blocks.
 */
export function notifyAdmin(text: string): void {
  const BOT_TOKEN =
    process.env.TELEGRAM_SUPPORT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

/** Current time formatted for Telegram messages (Moscow timezone) */
export function mskNow(): string {
  return new Date().toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour12: false,
  });
}
