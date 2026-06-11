"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AbroadWaitlistForm({ locale }: { locale: string }) {
  const t = useTranslations("abroad");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot — real users never fill it
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setStatus("error");
      setErrorMsg(t("errorInvalid"));
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/abroad-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale, company }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg(t("errorGeneric"));
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-2xl px-6 py-8" style={{ background: "rgba(14,159,110,0.10)", border: "1px solid rgba(14,159,110,0.3)" }}>
        <p className="font-semibold mb-1" style={{ color: "#0E9F6E" }}>{t("successTitle")}</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("successDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" noValidate>
      {/* Honeypot field — hidden from humans */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none h-0 w-0"
      />
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
        className="flex-1 px-5 py-3.5 rounded-xl text-sm outline-none transition-shadow focus:ring-2"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        style={{
          background: "linear-gradient(135deg, #5575FF 0%, #4561E8 50%, #6B4FF0 100%)",
          boxShadow: "0 6px 20px rgba(69,97,232,0.4)",
        }}
      >
        {status === "sending" ? t("submitting") : t("submitBtn")}
      </button>
      {status === "error" && (
        <p className="text-xs sm:absolute sm:translate-y-14 text-left" style={{ color: "#E0565B" }} role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
