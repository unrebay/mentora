"use client";
import { useState, useEffect } from "react";

interface Props {
  giftClaimed: boolean;
  isUltima: boolean;
  /** True if user registered before June 1, 2026 and is eligible */
  eligible: boolean;
}

const GIFT_FROM = new Date("2026-06-01T00:00:00+03:00").getTime();
const EXPIRES_LABEL = "1 января 2027";

export default function GiftProBanner({ giftClaimed: initialClaimed, isUltima, eligible }: Props) {
  // Not eligible — registered after June 1
  if (!eligible) return null;
  const [claimed, setClaimed] = useState(initialClaimed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const available = now >= GIFT_FROM;

  // Count down until June 1
  const msLeft = Math.max(0, GIFT_FROM - now);
  const daysLeft = Math.floor(msLeft / 86400000);
  const hoursLeft = Math.floor((msLeft % 86400000) / 3600000);

  async function handleClaim() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/claim-gift", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setClaimed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  // Already claimed
  if (claimed) {
    return (
      <div style={{
        background: "linear-gradient(135deg, rgba(69,97,232,0.08) 0%, rgba(16,185,129,0.06) 100%)",
        border: "1px solid rgba(69,97,232,0.2)",
        borderRadius: 16,
        padding: "18px 20px",
        display: "flex",
        gap: 14,
        alignItems: "center",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
            {isUltima ? "Подарок зарезервирован" : "Pro активирован"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {isUltima
              ? "Ты уже на Ultima — максимальном плане. Подарок зафиксирован в твоём аккаунте."
              : `Pro работает до ${EXPIRES_LABEL}. Спасибо, что с нами с самого начала!`}
          </div>
        </div>
      </div>
    );
  }

  // Gift available — show claim button
  if (available) {
    return (
      <div style={{
        background: "linear-gradient(135deg, rgba(69,97,232,0.1) 0%, rgba(107,135,255,0.06) 100%)",
        border: "1px solid rgba(107,135,255,0.28)",
        borderRadius: 16,
        padding: "18px 20px",
        display: "flex",
        gap: 14,
        alignItems: "center",
        flexWrap: "wrap" as const,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: "rgba(69,97,232,0.15)",
          border: "1px solid rgba(69,97,232,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b87ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
            Подарок от Mentora — Pro до {EXPIRES_LABEL}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Ты зарегистрировался до официального запуска. Активируй Pro бесплатно прямо сейчас.
          </div>
          {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{error}</div>}
        </div>
        <button
          onClick={handleClaim}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(69,97,232,0.4)",
            transition: "opacity 0.15s ease",
          }}
        >
          {loading ? "Активируем..." : "Получить подарок"}
        </button>
      </div>
    );
  }

  // Gift not yet available — show preview with countdown
  return (
    <div style={{
      background: "rgba(69,97,232,0.05)",
      border: "1px solid rgba(69,97,232,0.14)",
      borderRadius: 16,
      padding: "16px 20px",
      display: "flex",
      gap: 14,
      alignItems: "center",
      flexWrap: "wrap" as const,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: "rgba(69,97,232,0.1)",
        border: "1px solid rgba(69,97,232,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b87ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
          Подарок откроется 1 июня — Pro до {EXPIRES_LABEL}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Ты в числе первых пользователей Mentora. Через{" "}
          <span style={{ color: "#6b87ff", fontWeight: 600 }}>
            {daysLeft > 0 ? `${daysLeft} дн. ${hoursLeft} ч.` : `${hoursLeft} ч.`}
          </span>{" "}
          кнопка активации появится прямо здесь.
        </div>
      </div>
      <button
        disabled
        style={{
          background: "rgba(69,97,232,0.12)",
          color: "rgba(107,135,255,0.5)",
          border: "1px solid rgba(69,97,232,0.15)",
          borderRadius: 12,
          padding: "10px 20px",
          fontWeight: 700,
          fontSize: 14,
          cursor: "not-allowed",
          flexShrink: 0,
        }}
      >
        1 июня →
      </button>
    </div>
  );
}
