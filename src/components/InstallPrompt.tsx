"use client";
import { useEffect, useState } from "react";

/**
 * Кастомный install prompt для PWA. Стандартный Chrome/Edge "Install app"
 * mini-bar заменяется на наш брендованный.
 *
 *  - Слушает `beforeinstallprompt`, гасит дефолтный UI, показывает нашу плашку
 *  - При accept → вызывает deferred.prompt() и ждёт userChoice
 *  - При dismiss → не показываем 14 дней (localStorage)
 *  - iOS Safari не стреляет beforeinstallprompt; для iOS оставляем отдельный
 *    flow "Поделиться → На главный экран" — позже отдельной плашкой.
 */
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mentora-install-dismissed-at";
const DISMISS_WINDOW_DAYS = 14;

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const lastDismiss = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recent = Date.now() - lastDismiss < DISMISS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (recent) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden || !deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setHidden(true);
    setDeferred(null);
  }

  function later() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Установить Mentora"
      style={{
        position: "fixed",
        left: 16, right: 16, bottom: 16,
        zIndex: 9999,
        background: "rgba(6,6,18,0.92)",
        backdropFilter: "blur(16px) saturate(1.6)",
        WebkitBackdropFilter: "blur(16px) saturate(1.6)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 18,
        padding: 14,
        color: "#fff",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: 460,
        margin: "0 auto",
      }}
    >
      <img
        src="/icon-192.png"
        alt=""
        width={44}
        height={44}
        style={{ borderRadius: 10, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Установить Mentora</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
          Иконка на экране, мгновенный запуск, работает офлайн.
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          onClick={later}
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 999,
            padding: "8px 12px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Позже
        </button>
        <button
          type="button"
          onClick={install}
          style={{
            background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Установить
        </button>
      </div>
    </div>
  );
}
