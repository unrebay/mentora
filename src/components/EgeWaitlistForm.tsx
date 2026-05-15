"use client";

import { useState } from "react";

interface Props {
  locale?: string;
}

export default function EgeWaitlistForm({ locale = "ru" }: Props) {
  const isEn = locale === "en";
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setError("");
    setState("loading");
    try {
      const res = await fetch("/api/ege-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), telegram: telegram.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || (isEn ? "Submission failed" : "Не удалось отправить"));
        setState("error");
        return;
      }
      setState("ok");
    } catch {
      setError(isEn ? "Network error" : "Сетевая ошибка");
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <div
        className="max-w-md mx-auto rounded-2xl p-5 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.04))",
          border: "1px solid rgba(16,185,129,0.30)",
          color: "var(--text)",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>✓</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          {isEn ? "You're on the wait-list" : "Ты в списке"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          {isEn
            ? "We'll notify you the moment ЕГЭ-mode launches in autumn 2026."
            : "Сообщим первым, как только ЕГЭ-режим заработает осенью 2026."}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-md mx-auto flex flex-col gap-2.5"
    >
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={isEn ? "you@example.com" : "твой email"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
        style={{
          background: "var(--bg-card)",
          color: "var(--text)",
          border: "1px solid var(--border-light)",
        }}
      />
      <input
        type="text"
        placeholder={isEn ? "or Telegram: @username" : "или Telegram: @username"}
        value={telegram}
        onChange={(e) => setTelegram(e.target.value)}
        className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
        style={{
          background: "var(--bg-card)",
          color: "var(--text)",
          border: "1px solid var(--border-light)",
        }}
      />
      <button
        type="submit"
        disabled={state === "loading" || (!email.trim() && !telegram.trim())}
        className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
          boxShadow: "0 6px 20px rgba(69,97,232,0.35), 0 1px 0 rgba(255,255,255,0.22) inset",
        }}
      >
        {state === "loading"
          ? (isEn ? "Submitting…" : "Отправляем…")
          : (isEn ? "Notify me when ЕГЭ-mode launches" : "Сообщить о запуске ЕГЭ-режима")}
      </button>
      {error && (
        <div style={{ color: "#EF4444", fontSize: 12, textAlign: "center" }}>{error}</div>
      )}
      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
        {isEn
          ? "No spam. One email — the moment ЕГЭ-mode goes live."
          : "Без спама. Одно письмо — в момент запуска."}
      </div>
    </form>
  );
}
