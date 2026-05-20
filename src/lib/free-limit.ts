/**
 * Free-tier message limit — single source of truth.
 *
 * Matches `/api/chat` enforcement (constants below are the canonical values).
 * Pages MUST read free-limit state via these helpers instead of recomputing it
 * locally. See AUDIT_2026_05_20.md — Blocker A.
 *
 * Rule (Andy, 2026-05-20):
 *   10 сообщений на 8 часов rolling window.
 *   Окно стартует с момента ПЕРВОГО сообщения и длится 8 часов.
 *
 * The atomic check-and-increment happens in the Supabase RPC
 * `increment_messages_window` (see api/chat/route.ts). Pages only call this
 * helper to render counters/UI — they never mutate state.
 */

export const FREE_WINDOW_HOURS = 8;
export const FREE_WINDOW_LIMIT = 10;

const HOURS_TO_MS = 3_600_000;

export interface FreeLimitProfileRow {
  messages_today?: number | null;
  messages_window_start?: string | null;
}

export interface FreeLimitState {
  /** Сколько ещё сообщений доступно в текущем окне. null для Pro/Ultima. */
  messagesRemaining: number | null;
  /** Когда окно сбросится (ISO). null если окно ещё не начато. */
  resetAt: string | null;
  /** Окно уже закрылось — пора начинать новое. */
  windowExpired: boolean;
  /** Сколько потрачено в текущем окне (0 если окно expired). */
  usedInWindow: number;
}

/**
 * Compute free-tier state from a profile row.
 * Pass `isPaid = true` for Pro/Ultima → returns nulls.
 *
 * @example
 *   const state = computeFreeLimit(profile, isPro || isUltima);
 *   <span>{state.messagesRemaining} / {FREE_WINDOW_LIMIT}</span>
 */
export function computeFreeLimit(
  profile: FreeLimitProfileRow | null | undefined,
  isPaid: boolean
): FreeLimitState {
  if (isPaid) {
    return { messagesRemaining: null, resetAt: null, windowExpired: false, usedInWindow: 0 };
  }

  const windowStart = profile?.messages_window_start
    ? new Date(profile.messages_window_start)
    : null;

  const now = Date.now();
  const windowExpired =
    !windowStart || now - windowStart.getTime() >= FREE_WINDOW_HOURS * HOURS_TO_MS;

  const usedInWindow = windowExpired ? 0 : profile?.messages_today ?? 0;
  const messagesRemaining = Math.max(0, FREE_WINDOW_LIMIT - usedInWindow);

  const resetAt =
    windowStart && !windowExpired
      ? new Date(windowStart.getTime() + FREE_WINDOW_HOURS * HOURS_TO_MS).toISOString()
      : null;

  return { messagesRemaining, resetAt, windowExpired, usedInWindow };
}

/** Columns to select from `users` to feed `computeFreeLimit`. */
export const FREE_LIMIT_PROFILE_COLUMNS = "messages_today, messages_window_start";
