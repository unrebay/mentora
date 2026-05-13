"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface PaymentItem {
  id: string;
  status: string;
  plan: string;
  amount: number;        // copecks
  created_at: string;
  started_at?: string | null;
  expires_at?: string | null;
}

interface Props {
  locale: "ru" | "en";
  isPro: boolean;
  isUltima: boolean;
  trialExpiresAt?: string | null;       // ISO; if trial, the date access ends
  planExpiresAt?: string | null;        // ISO; future column users.plan_expires_at — null until recurring-billing milestone lands
  autoRenew?: boolean | null;           // future column users.auto_renew — null = unknown / not yet wired
  cardLast4?: string | null;            // future column users.card_last4 — null until save_payment_method flow
  payments: PaymentItem[];              // subscriptions table rows for this user, newest first
}

const PLAN_LABEL: Record<string, string> = {
  monthly: "Pro · месяц", annual: "Pro · год",
  pro: "Pro", "ultima": "Ultra", "ultima_monthly": "Ultra · месяц", "ultima_annual": "Ultra · год",
};
const STATUS_RU: Record<string, { label: string; color: string }> = {
  active:   { label: "Оплачено",   color: "#10b981" },
  succeeded:{ label: "Оплачено",   color: "#10b981" },
  inactive: { label: "Не оплачено", color: "#94a3b8" },
  pending:  { label: "В обработке", color: "#f59e0b" },
  canceled: { label: "Отменён",     color: "#ef4444" },
  failed:   { label: "Ошибка",      color: "#ef4444" },
};
const STATUS_EN: Record<string, { label: string; color: string }> = {
  active:   { label: "Paid",        color: "#10b981" },
  succeeded:{ label: "Paid",        color: "#10b981" },
  inactive: { label: "Not paid",    color: "#94a3b8" },
  pending:  { label: "Processing",  color: "#f59e0b" },
  canceled: { label: "Cancelled",   color: "#ef4444" },
  failed:   { label: "Failed",      color: "#ef4444" },
};

function formatAmount(copecks: number) {
  return `${(copecks / 100).toLocaleString("ru-RU")} ₽`;
}
function formatDate(iso: string, locale: "ru" | "en") {
  try {
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

/* ── Section card — shared shell so all 4 manage blocks have a consistent frame ── */
function Card({ accent = "var(--border)", children, className = "" }: { accent?: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 border ${className}`}
      style={{
        borderColor: accent,
        background: "var(--bg-card)",
      }}
    >
      {children}
    </div>
  );
}

/* ── 1. Active subscription summary ──────────────────────────────────────── */
function ActivePlanCard({ locale, isPro, isUltima, trialExpiresAt, planExpiresAt }: Pick<Props, "locale" | "isPro" | "isUltima" | "trialExpiresAt" | "planExpiresAt">) {
  const planLabel = isUltima ? "Ultra" : isPro ? "Pro" : "Free";
  const planAccent = isUltima ? "#F5B400" : isPro ? "#4561E8" : "#9ca3af";
  const isTrial = trialExpiresAt && new Date(trialExpiresAt) > new Date();

  const planSub = isUltima
    ? (locale === "en" ? "Top tier — every Mentora capability" : "Максимальный план — все возможности Mentora")
    : isPro
      ? (locale === "en" ? "Pro subscription active" : "Pro подписка активна")
      : (locale === "en" ? "10 messages per 8 hours · no card" : "10 сообщений за 8 часов · без карты");

  const expiryNote = planExpiresAt
    ? `${locale === "en" ? "Until" : "До"} ${formatDate(planExpiresAt, locale)}`
    : isTrial && trialExpiresAt
      ? `${locale === "en" ? "Trial · until" : "Триал · до"} ${formatDate(trialExpiresAt, locale)}`
      : null;

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        borderColor: `${planAccent}40`,
        background: `linear-gradient(135deg, ${planAccent}12, ${planAccent}04 60%, var(--bg-card))`,
      }}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div style={{ minWidth: 0 }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--text-muted)" }}>
            {locale === "en" ? "Current plan" : "Текущий план"}
          </div>
          <div className="text-2xl font-black leading-none" style={{ color: planAccent }}>{planLabel}</div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>{planSub}</p>
          {expiryNote && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{expiryNote}</p>
          )}
        </div>
        <a
          href="#tariffs"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: `${planAccent}22`,
            color: planAccent,
            border: `1px solid ${planAccent}55`,
          }}
        >
          {isPro ? (locale === "en" ? "Switch plan" : "Сменить тариф") : (locale === "en" ? "Upgrade to Pro" : "Перейти на Pro")}
        </a>
      </div>
    </div>
  );
}

/* ── 2. Payment method ───────────────────────────────────────────────────── */
function PaymentMethodCard({ locale, isPro, cardLast4 }: Pick<Props, "locale" | "isPro" | "cardLast4">) {
  if (!isPro) return null;

  return (
    <Card>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
        {locale === "en" ? "Payment method" : "Способ оплаты"}
      </div>
      {cardLast4 ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 16" width="36" height="24" fill="none" aria-hidden>
              <rect width="24" height="16" rx="2" fill="var(--bg-secondary)" stroke="var(--border)" />
              <rect x="2" y="11" width="20" height="2" fill="var(--border)" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>•••• {cardLast4}</span>
          </div>
          <button
            type="button"
            disabled
            title={locale === "en" ? "Coming soon" : "Скоро"}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold opacity-50 cursor-not-allowed"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            {locale === "en" ? "Change" : "Изменить"}
          </button>
        </div>
      ) : (
        // No saved card yet — billing is currently one-shot Checkout. Will populate
        // once the recurring-billing milestone lands (save_payment_method=true).
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {locale === "en"
            ? "Payments go through ЮKassa as one-time checkouts — no card is stored. Auto-renewal with saved card lands before launch (June 1)."
            : "Платежи проходят через ЮKassa разовыми чекаутами — карта не сохраняется. Автопродление с сохранением карты появится до запуска (1 июня)."}
        </p>
      )}
    </Card>
  );
}

/* ── 3. Payment history — collapsed initially to 1 row, "Показать ещё" expands by 5 ── */
function PaymentHistoryCard({ locale, payments }: Pick<Props, "locale" | "payments">) {
  // Initial: show only the most recent (1). Each click of "Показать ещё" adds 5 more.
  const [shown, setShown] = useState(1);
  const visible = payments.slice(0, shown);
  const remaining = payments.length - shown;
  const nextChunk = Math.min(5, remaining);
  const statusMap = locale === "en" ? STATUS_EN : STATUS_RU;

  return (
    <Card>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
        <span>{locale === "en" ? "Payment history" : "История платежей"}</span>
        {payments.length > 0 && (
          <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            {locale === "en" ? `${payments.length} total` : `Всего ${payments.length}`}
          </span>
        )}
      </div>

      {payments.length === 0 ? (
        <p className="text-xs leading-relaxed py-2" style={{ color: "var(--text-muted)" }}>
          {locale === "en"
            ? "No payments yet. Your purchase history will appear here."
            : "Платежей пока нет. История покупок появится здесь."}
        </p>
      ) : (
        <>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            <AnimatePresence initial={false}>
              {visible.map((p) => {
                const meta = statusMap[p.status] ?? { label: p.status, color: "var(--text-muted)" };
                return (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    style={{ borderColor: "var(--border)" }}
                    className="border-t first:border-t-0 py-3 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {PLAN_LABEL[p.plan] ?? p.plan}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatDate(p.created_at, locale)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: `${meta.color}1A`, color: meta.color, border: `1px solid ${meta.color}33` }}>
                        {meta.label}
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
                        {formatAmount(p.amount)}
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setShown((s) => s + nextChunk)}
              className="mt-3 w-full text-xs font-semibold py-2 rounded-xl transition-colors"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {locale === "en"
                ? `Show ${nextChunk} more`
                : `Показать ещё ${nextChunk}`}
            </button>
          )}
          {remaining === 0 && shown > 1 && (
            <button
              type="button"
              onClick={() => setShown(1)}
              className="mt-3 w-full text-xs font-semibold py-2 rounded-xl transition-colors"
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {locale === "en" ? "Hide" : "Свернуть"}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

/* ── 4. Cancel subscription — info-text + (future) action button ─────────── */
function CancelCard({ locale, isPro, autoRenew, planExpiresAt }: Pick<Props, "locale" | "isPro" | "autoRenew" | "planExpiresAt">) {
  if (!isPro) return null;

  // For the milestone-pre-recurring state we just show an informational note.
  // After recurring lands, this becomes an action button with a confirm modal.
  return (
    <Card>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
        {locale === "en" ? "Cancel subscription" : "Отмена подписки"}
      </div>
      {autoRenew === false ? (
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {locale === "en"
            ? `Auto-renewal is off. Your access ${planExpiresAt ? `runs until ${formatDate(planExpiresAt, locale)}, then` : ""} will return to Free.`
            : `Автопродление выключено. Доступ ${planExpiresAt ? `действует до ${formatDate(planExpiresAt, locale)}, потом` : ""} вернётся на Free.`}
        </p>
      ) : (
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {locale === "en"
            ? "Right now payments are one-time — your subscription does not auto-renew. You won’t be charged again unless you buy another plan. Auto-renewal will be unlocked starting from level 2."
            : "Сейчас платежи разовые — подписка не продлевается автоматически. С тебя не спишут повторно, пока не купишь новый тариф. Возможность автопродления подписки будет разблокирована со второго уровня."}
        </p>
      )}
    </Card>
  );
}

/** Top section — just the active plan summary. Rendered at the very top of /pricing. */
export function ActivePlanSection(props: Props) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <ActivePlanCard {...props} />
    </div>
  );
}

/** Bottom section — payment method, history, cancel. Rendered AFTER the tariff cards
 *  + promo banner on /pricing. Order: who pays first, then what they can manage. */
export function PaymentInfoSection(props: Props) {
  if (!props.isPro) return null;
  return (
    <div className="space-y-3 sm:space-y-4">
      <PaymentMethodCard {...props} />
      <PaymentHistoryCard {...props} />
      <CancelCard {...props} />
    </div>
  );
}

/** Backwards-compatible default: renders both sections stacked. */
export default function ManageSubscription(props: Props) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <ActivePlanCard {...props} />
      <PaymentMethodCard {...props} />
      <PaymentHistoryCard {...props} />
      <CancelCard {...props} />
    </div>
  );
}
