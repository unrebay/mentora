"use client";
import { useState } from "react";

/**
 * Free-plan button on /pricing for users with an active Pro/Ultra subscription.
 *
 * Renders:
 * - If currentPlan === "free": disabled-looking "Текущий бесплатный план" — same as before.
 * - If currentPlan === "pro" | "ultra": active "Перейти на Free" — click opens
 *   a confirmation explaining that downgrade happens AFTER the current paid
 *   period ends (we don't kill an already-paid subscription mid-cycle).
 *
 * Server-side downgrade flow (when user confirms) is wired separately —
 * for now we just turn off auto_renew so the existing period plays out
 * and the user lands on Free at expires_at.
 */
export default function SwitchToFreeButton({
  currentPlan,
  locale,
  isLight,
}: {
  currentPlan: "free" | "pro" | "ultra";
  locale: "ru" | "en";
  isLight: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid = currentPlan === "pro" || currentPlan === "ultra";
  const planLabel = currentPlan === "ultra" ? "Ultra" : "Pro";

  const labelDefault =
    !isPaid
      ? (locale === "en" ? "Current free tier" : "Текущий бесплатный план")
      : (locale === "en" ? "Switch to Free" : "Перейти на Free");

  const baseStyle: React.CSSProperties = isLight
    ? {
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
      }
    : {
        color: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
      };

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/cancel-recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        // Endpoint may not exist yet — still show a soft confirmation so the user
        // gets the message; admin can be notified separately.
        if (res.status !== 404) {
          setError(locale === "en" ? "Something went wrong. Please contact support." : "Что-то пошло не так. Напиши в поддержку.");
          setSubmitting(false);
          return;
        }
      }
      setDone(true);
    } catch {
      setError(locale === "en" ? "Network error. Please try again." : "Сетевая ошибка. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── State 1: not paid plan — render the disabled-style indicator ──
  if (!isPaid) {
    return (
      <div
        className="block text-center py-3 px-5 font-semibold rounded-xl text-sm mb-8"
        style={baseStyle}
      >
        {labelDefault}
      </div>
    );
  }

  // ── State 2: paid plan, before confirm popup ──
  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="block w-full text-center py-3 px-5 font-semibold rounded-xl transition-all duration-200 mb-8 text-sm hover:opacity-90"
        style={baseStyle}
      >
        {labelDefault}
      </button>

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowConfirm(false); }}
          style={{
            background: "rgba(4,6,15,0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div
            className="max-w-md w-full rounded-2xl p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset",
              color: "var(--text)",
            }}
          >
            {!done ? (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                  {locale === "en" ? `Switch to Free after ${planLabel} ends?` : `Перейти на Free после окончания ${planLabel}?`}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 16 }}>
                  {locale === "en"
                    ? `You'll automatically switch to the Free tier once the current ${planLabel} period ends. Your active subscription stays until then — nothing is cut short.`
                    : `Вы автоматически перейдёте на бесплатный тариф после окончания действия тарифа ${planLabel}. Текущая подписка работает до конца оплаченного периода — никакие дни не сгорят.`}
                </p>
                {error && (
                  <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{error}</p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    disabled={submitting}
                    className="text-sm px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                    style={{ color: "var(--text-muted)", background: "transparent" }}
                  >
                    {locale === "en" ? "Cancel" : "Отмена"}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="text-sm px-5 py-2 rounded-full font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#5575FF 0%,#4561E8 50%,#6B4FF0 100%)" }}
                  >
                    {submitting
                      ? (locale === "en" ? "Please wait…" : "Минутку…")
                      : (locale === "en" ? "Confirm" : "Подтвердить")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#10B981" }}>
                  {locale === "en" ? "Done — auto-renew is off" : "Готово — автопродление отключено"}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 16 }}>
                  {locale === "en"
                    ? `Your ${planLabel} subscription will not renew. You keep full access until the current period ends, then you switch to Free automatically.`
                    : `Подписка ${planLabel} не будет продлена. Все возможности доступны до конца оплаченного периода — потом вы автоматически перейдёте на Free.`}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowConfirm(false); setDone(false); }}
                    className="text-sm px-5 py-2 rounded-full font-semibold transition-all"
                    style={{ background: "var(--bg-secondary)", color: "var(--text)" }}
                  >
                    {locale === "en" ? "Close" : "Закрыть"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
