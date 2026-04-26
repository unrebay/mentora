"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import posthog from "posthog-js";

// ─── Activation Banner (shown after successful payment) ───────────────────────
export function ProActivationBanner({ plan }: { plan: string }) {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const isUltima = plan === "ultima";

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setVisible(true);
      const billingPlan = searchParams.get("plan") || "monthly";
      posthog.capture("payment_completed", {
        plan: isUltima ? "ultima" : "pro",
        billing_plan: billingPlan,
        amount: billingPlan === "annual" ? 2990 : 499,
      });
      // Auto-dismiss after 12s
      const t = setTimeout(() => dismiss(), 12000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  const gradient = isUltima
    ? "linear-gradient(135deg, #7C3AED 0%, #4561E8 100%)"
    : "linear-gradient(135deg, #4561E8 0%, #0cc8a0 100%)";

  return (
    <div
      className="mb-6 relative overflow-hidden rounded-2xl px-5 py-4 text-white"
      style={{
        background: gradient,
        boxShadow: isUltima ? "0 4px 24px rgba(124,58,237,0.35)" : "0 4px 24px rgba(69,97,232,0.35)",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(-6px)" : "translateY(0)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: i % 2 === 0 ? 5 : 3, height: i % 2 === 0 ? 5 : 3,
              left: `${10 + i * 11}%`, top: `${15 + (i * 17) % 60}%`,
              background: "rgba(255,255,255,0.7)",
              animation: `mentoraSpark ${1 + (i % 3) * 0.5}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-white leading-tight">
            {isUltima ? "Ultra активирован!" : "Pro активирован!"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
            {isUltima
              ? "Безлимитные сообщения, фото задач и AI-иллюстрации — всё доступно прямо сейчас."
              : "Безлимитные сообщения активированы. Учись без ограничений!"}
          </p>
        </div>
        <button onClick={dismiss}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
          style={{ color: "rgba(255,255,255,0.7)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Expiry Warning Banner (shown when Pro/trial expires within 3 days) ────────
export function ProExpiryBanner({
  trialExpiresAt,
  planExpiresAt,
  isPro,
}: {
  trialExpiresAt: string | null;
  planExpiresAt?: string | null;
  isPro: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  const expiresAt = planExpiresAt ?? trialExpiresAt;

  if (!isPro || !expiresAt || dismissed) return null;

  const expiresDate = new Date(expiresAt);
  const now = new Date();
  const msDiff = expiresDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(msDiff / (1000 * 3600 * 24));

  // Only show within 3 days before expiry
  if (daysLeft > 3 || daysLeft <= 0) return null;

  const dismiss = () => {
    setFading(true);
    setTimeout(() => setDismissed(true), 400);
  };

  const label = daysLeft === 1 ? "завтра" : daysLeft === 2 ? "послезавтра" : `через ${daysLeft} дня`;
  const expiresFormatted = expiresDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 border relative"
      style={{
        background: "rgba(245,158,11,0.08)",
        borderColor: "rgba(245,158,11,0.35)",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(-4px)" : "translateY(0)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(245,158,11,0.15)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: "#b45309" }}>
          Pro истекает {label} — {expiresFormatted}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(180,83,9,0.75)" }}>
          Продли подписку, чтобы не потерять безлимитный доступ.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/pricing"
          className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors text-white"
          style={{ background: "#f59e0b" }}>
          Продлить
        </Link>
        <button onClick={dismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
