"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

type PlanKey = "monthly" | "annual" | "ultima_monthly" | "ultima_annual";

interface Props {
  /** When provided AND the user already owns this plan/higher, render the
   *  active-badge as a clickable Link to this href (typically /profile#subscription)
   *  instead of a dead-end <div>. */
  manageHref?: string;
  isLoggedIn: boolean;
  isPro: boolean;
  isUltima?: boolean;
  plan: PlanKey;
}

export default function BuyProButton({ isLoggedIn, isPro, isUltima = false, plan, manageHref }: Props) {
  const t = useTranslations("buyPro");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isUltimaPlan = plan.startsWith("ultima");
  const isAnnual = plan.endsWith("annual");

  // Already on correct or higher plan — render the badge. If a manageHref is
  // provided, make it a clickable link to subscription management (so a logged-in
  // user actually has a way to change/cancel their plan from /pricing). Otherwise
  // keep the inert div for landing/logged-out previews.
  if (isUltimaPlan && isUltima) {
    const cls = "block text-center py-2.5 px-5 bg-emerald-800/60 text-emerald-300 font-semibold rounded-xl border border-emerald-700/50 text-sm transition-colors hover:bg-emerald-700/70";
    return manageHref ? (
      <Link href={manageHref} className={cls}>{t("ultraActive")}</Link>
    ) : (
      <div className={cls}>{t("ultraActive")}</div>
    );
  }
  if (!isUltimaPlan && isPro) {
    const cls = "block text-center py-2.5 px-5 bg-green-50 text-green-700 font-semibold rounded-xl border-2 border-green-200 text-sm transition-colors hover:bg-green-100";
    return manageHref ? (
      <Link href={manageHref} className={cls}>{t("proActive")}</Link>
    ) : (
      <div className={cls}>{t("proActive")}</div>
    );
  }

  const handleClick = async () => {
    if (!isLoggedIn) { router.push("/auth?next=/pricing"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else if (data.error === "Already subscribed") {
        router.push("/dashboard");
      } else {
        alert(t("errorGeneric"));
      }
    } catch { alert(t("errorConnection")); }
    finally { setLoading(false); }
  };

  const label = loading
    ? t("loading")
    : isAnnual
      ? (isUltimaPlan ? t("getUltraAnnual") : t("getAnnual"))
      : (isUltimaPlan ? t("getUltra") : t("getPro"));

  const buttonStyle = isUltimaPlan
    ? "bg-white text-gray-900 hover:bg-gray-100"
    : isAnnual
      ? "bg-gray-800 text-white hover:bg-gray-900"
      : "bg-brand-600 text-white hover:bg-brand-700";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`block w-full text-center py-2.5 px-5 font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm ${buttonStyle}`}
    >
      {label}
    </button>
  );
}
