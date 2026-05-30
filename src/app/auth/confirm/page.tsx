"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Supabase can operate in two modes:
// 1. PKCE (modern): email contains token_hash → verifyOtp({ token_hash, type })
// 2. Implicit/legacy: email contains token + user email → verifyOtp({ email, token, type })
// Both modes send a link to this page. For type=recovery we NEVER auto-verify on mount
// because Apple Mail / iCloud pre-fetches all email links as plain HTTP GET requests,
// which would consume the one-time token before the user ever clicks "Reset password".
type State = "loading" | "ready_recovery" | "verifying" | "error_token_used" | "error_generic";

const BG = (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
      style={{ background: "radial-gradient(ellipse, rgba(69,97,232,0.12) 0%, transparent 70%)" }} />
    <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[300px] rounded-full"
      style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
  </div>
);

const LogoMark = () => (
  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
    style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 0 30px rgba(69,97,232,0.4)" }}>
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="2" opacity="0.6" />
      <circle cx="14" cy="14" r="5" fill="white" />
    </svg>
  </div>
);

const Spinner = () => (
  <div className="relative w-10 h-10">
    <div className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.08)]" />
    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#6B8FFF] animate-spin" />
  </div>
);

export default function AuthConfirm() {
  const [state, setState] = useState<State>("loading");
  // PKCE mode
  const [tokenHash, setTokenHash] = useState("");
  // Legacy OTP mode
  const [otpToken, setOtpToken] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  // Shared
  const [tokenType, setTokenType] = useState("recovery");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const th    = sp.get("token_hash") ?? "";
    const token = sp.get("token")      ?? "";
    const email = sp.get("email")      ?? "";
    const type  = sp.get("type")       ?? "";

    // Supabase redirects here with ?error=... when link is expired/already used
    const supaError = sp.get("error");
    if (supaError) {
      setState("error_token_used");
      return;
    }

    // PKCE mode: token_hash present
    if (th && type) {
      if (type === "recovery") {
        setTokenHash(th);
        setTokenType(type);
        setState("ready_recovery");
        return;
      }
      doVerifyHash(th, type);
      return;
    }

    // Legacy OTP mode: token + email present
    if (token && email && type) {
      if (type === "recovery") {
        setOtpToken(token);
        setOtpEmail(email);
        setTokenType(type);
        setState("ready_recovery");
        return;
      }
      doVerifyOtp(token, email, type);
      return;
    }

    // Legacy implicit flow: tokens in URL hash
    const hash          = window.location.hash.substring(1);
    const hp            = new URLSearchParams(hash);
    const access_token  = hp.get("access_token");
    const refresh_token = hp.get("refresh_token");
    const hashType      = hp.get("type");

    if (access_token && refresh_token) {
      const supabase = createClient();
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            window.location.href = "/auth?error=session_failed";
          } else if (hashType === "recovery") {
            window.location.href = "/auth/reset-password";
          } else {
            window.location.href = "/dashboard";
          }
        });
      return;
    }

    window.location.href = "/auth?error=no_token";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PKCE verification via token_hash
  async function doVerifyHash(th: string, type: string) {
    setState("verifying");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: th,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: type as any,
    });
    if (error) {
      setState(type === "recovery" ? "error_token_used" : "error_generic");
    } else if (type === "recovery") {
      window.location.href = "/auth/reset-password";
    } else {
      window.location.href = "/dashboard";
    }
  }

  // Legacy OTP verification via email + token
  async function doVerifyOtp(token: string, email: string, type: string) {
    setState("verifying");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: type as any,
    });
    if (error) {
      setState(type === "recovery" ? "error_token_used" : "error_generic");
    } else if (type === "recovery") {
      window.location.href = "/auth/reset-password";
    } else {
      window.location.href = "/dashboard";
    }
  }

  // Triggered by the confirmation button for recovery type
  async function handleConfirmReset() {
    if (tokenHash) {
      await doVerifyHash(tokenHash, tokenType);
    } else if (otpToken && otpEmail) {
      await doVerifyOtp(otpToken, otpEmail, tokenType);
    } else {
      setState("error_token_used");
    }
  }

  // Recovery confirmation screen
  if (state === "ready_recovery") {
    return (
      <main className="min-h-screen bg-[#06060f] flex items-center justify-center relative overflow-hidden">
        {BG}
        <div className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 rounded-3xl text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            maxWidth: 360,
          }}>
          <LogoMark />
          <div>
            <p className="font-bold text-lg text-white mb-1">Сброс пароля</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Нажми кнопку, чтобы перейти к форме нового пароля
            </p>
          </div>
          <button
            onClick={handleConfirmReset}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 0 20px rgba(69,97,232,0.4)" }}
          >
            Задать новый пароль →
          </button>
          <a href="/auth" className="text-xs" style={{ color: "rgba(107,143,255,0.55)" }}>
            ← Вернуться к входу
          </a>
        </div>
      </main>
    );
  }

  // Token-used / expired error
  if (state === "error_token_used" || state === "error_generic") {
    return (
      <main className="min-h-screen bg-[#06060f] flex items-center justify-center relative overflow-hidden">
        {BG}
        <div className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 rounded-3xl text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            maxWidth: 360,
          }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-lg text-white mb-1">Ссылка устарела</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Ссылка для сброса пароля уже была использована или истекла.
              Запроси новую.
            </p>
          </div>
          <a
            href="/auth?mode=forgot"
            className="w-full block text-center py-3.5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 0 20px rgba(69,97,232,0.35)" }}
          >
            Запросить новую ссылку
          </a>
          <a href="/auth" className="text-xs" style={{ color: "rgba(107,143,255,0.55)" }}>
            ← Вернуться к входу
          </a>
        </div>
      </main>
    );
  }

  // Loading / verifying
  return (
    <main className="min-h-screen bg-[#06060f] flex items-center justify-center relative overflow-hidden">
      {BG}
      <div className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
        <LogoMark />
        <Spinner />
        <div className="text-center">
          <p className="font-semibold text-base"
            style={{
              background: "linear-gradient(120deg, #6B8FFF, #ffffff, #9F7AFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
            {state === "verifying" ? "Проверяем ссылку…" : "Входим в Mentora"}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            Это займёт секунду…
          </p>
        </div>
      </div>
    </main>
  );
}
