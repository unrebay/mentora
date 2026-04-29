"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type PlanKey = "monthly" | "annual" | "ultima_monthly" | "ultima_annual";

interface Props {
  isLoggedIn: boolean;
  isPro: boolean;
  isUltima?: boolean;
  plan: PlanKey;
}

export default function BuyProButton({ isLoggedIn, isPro, isUltima = false, plan }: Props) {
  const t = useTranslations("buyPro");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isUltimaPlan = plan.startsWith("ultima");
  const isAnnual = plan.endsWith("annual");

  // Already on correct or higher plan
  if (isUltimaPlan && isUltima) {
    return (
      <div className="block text-center py-2.5 px-5 bg-emerald-800/60 text-emerald-300 font-semibold rounded-xl border border-emerald-700/50 text-sm">
        {t("ultraActive")}
      </div>
    );
  }
  if (!isUltimaPlan && isPro) {
    return (
      <div className="block text-center py-2.5 px-5 bg-green-50 text-green-700 font-semibold rounded-xl border-2 border-green-200 text-sm">
        {t("proActive")}
      </div>
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
