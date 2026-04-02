"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isLoggedIn: boolean;
  isPro: boolean;
}

export default function BuyProButton({ isLoggedIn, isPro }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (isPro) {
    return (
      <div className="block text-center py-3 px-6 bg-green-50 text-green-700 font-semibold rounded-xl border-2 border-green-200">
        ✓ Подписка активна
      </div>
    );
  }

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/auth?next=/pricing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", { method: "POST" });
      const data = await res.json();

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else if (data.error === "Already subscribed") {
        router.push("/dashboard");
      } else {
        alert("Что-то пошло не так. Попробуйте снова.");
      }
    } catch {
      alert("Ошибка соединения. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="block w-full text-center py-3 px-6 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Переходим к оплате..." : "Попробовать Pro →"}
    </button>
  );
}
