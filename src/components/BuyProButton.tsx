"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isLoggedIn: boolean;
  isPro: boolean;
  plan: "monthly" | "annual";
}

export default function BuyProButton({ isLoggedIn, isPro, plan }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (isPro) {
    return (
      <div className="block text-center py-2.5 px-5 bg-green-50 text-green-700 font-semibold rounded-xl border-2 border-green-200 text-sm">
        ✓ Подписка активна
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
        alert("Что-то пошло не так. Попробуйте снова.");
      }
    } catch { alert("Ошибка соединения. Попробуйте снова."); }
    finally { setLoading(false); }
  };

  return (
    <button onClick={handleClick} disabled={loading}
      className={"block w-full text-center py-2.5 px-5 font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm " +
        (plan === "annual" ? "bg-gray-800 text-white hover:bg-gray-900" : "bg-brand-600 text-white hover:bg-brand-700")}>
      {loading ? "Переходим к оплате..." : plan === "annual" ? "Оформить годовой план →" : "Попробовать Pro →"}
    </button>
  );
}
