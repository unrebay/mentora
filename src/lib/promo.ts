// ── Annual-plan launch promo ────────────────────────────────────────────────
// Buying an ANNUAL plan before the cutoff grants extra months on top of 12.
// Single source of truth: both the payment webhook (grants the bonus) and the
// pricing banner (shows the offer) read these constants.
//
// 👉 TO EXTEND OR END THE PROMO: edit ANNUAL_PROMO_UNTIL below. That's it.
//    When the date passes, the banner hides itself and the webhook stops adding
//    the bonus automatically — no other changes needed.

// Cutoff (inclusive until this instant). Launch promo: 1 month from the
// 1 June 2026 launch → through 30 June 2026, 23:59 MSK.
// To extend/end the promo later, just change this date.
export const ANNUAL_PROMO_UNTIL = new Date("2026-06-30T20:59:59Z");

// Bonus added to the annual 365 days during the promo (+3 months ≈ 90 days).
export const ANNUAL_PROMO_BONUS_DAYS = 90;

/** Is the annual promo currently running? */
export function annualPromoActive(now: Date = new Date()): boolean {
  return now.getTime() < ANNUAL_PROMO_UNTIL.getTime();
}

/** Human date for the RU banner, e.g. "1 июля" (rendered in MSK / UTC+3). */
export function annualPromoDateLabelRu(): string {
  const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  const msk = new Date(ANNUAL_PROMO_UNTIL.getTime() + 3 * 60 * 60 * 1000);
  return `${msk.getUTCDate()} ${months[msk.getUTCMonth()]}`;
}
