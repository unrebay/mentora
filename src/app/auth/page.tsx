"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

// ── Type augmentation for hCaptcha on window ──────────────────────────────
declare global {
  interface Window {
    onMentoraCaptchaSuccess?: (token: string) => void;
    onMentoraCaptchaExpired?: () => void;
    onTelegramAuth?: (user: Record<string, string>) => void;
    Telegram?: { Login?: { auth: (opts: Record<string, unknown>, cb: (u: Record<string, string>) => void) => void } };
  }
}

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const [tgLoading, setTgLoading] = useState(false);

  const [mode, setMode]         = useState<"signin" | "signup">("signin");
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const router      = useRouter();
  const searchParams = useSearchParams();
  const supabase    = createClient();
  const captchaRef  = useRef<HTMLDivElement>(null);

  // Show OAuth errors from callback redirect
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setError("Ошибка входа через внешний сервис. Попробуй снова.");
  }, [searchParams]);

  // Register hCaptcha callbacks on window
  useEffect(() => {
    window.onMentoraCaptchaSuccess = (token: string) => setCaptchaToken(token);
    window.onMentoraCaptchaExpired = () => setCaptchaToken(null);
    return () => {
      delete window.onMentoraCaptchaSuccess;
      delete window.onMentoraCaptchaExpired;
    };
  }, []);

  // Load hCaptcha script once
  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) return;
    if (document.getElementById("hcaptcha-script")) return;
    const script = document.createElement("script");
    script.id    = "hcaptcha-script";
    script.src   = "https://js.hcaptcha.com/1/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Reset captcha when switching modes
  useEffect(() => {
    setCaptchaToken(null);
  }, [mode]);

  // Telegram Login Widget
  useEffect(() => {
    const supabaseClient = createClient();
    window.onTelegramAuth = async (user) => {
      setTgLoading(true);
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        // Redirect to Supabase magic link — it verifies and sends to /auth/callback
        window.location.href = json.action_link;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "попробуй снова";
        alert("Ошибка входа через Telegram: " + msg);
        setTgLoading(false);
      }
    };

    const container = document.getElementById("telegram-login-widget");
    if (container && !container.querySelector("script")) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", "mentora_su_bot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "10");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-userpic", "false");
      script.async = true;
      container.appendChild(script);
    }

    return () => { delete window.onTelegramAuth; };
  }, []);

  // ── OAuth ─────────────────────────────────────────────────────────────
  async function handleOAuth(provider: "google") {
    setOauthLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: provider === "google"
          ? { access_type: "offline", prompt: "consent" }
          : undefined,
      },
    });
    if (error) {
      setError("Не удалось подключиться. Попробуй ещё раз.");
      setOauthLoading(null);
    }
    // On success browser will redirect — no need to reset state
  }

  // ── Email/Password ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signup") {
      if (HCAPTCHA_SITE_KEY && !captchaToken) {
        setError("Пожалуйста, подтверди, что ты не робот.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaToken ?? undefined,
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          setError("Этот email уже зарегистрирован. Войди или восстанови пароль.");
        } else if (error.message.includes("captcha")) {
          setError("Не прошла проверка капчи. Попробуй снова.");
        } else {
          setError(error.message);
        }
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Неверный email или пароль.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
    setLoading(false);
  }

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
  }

  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="md" href="/" />
          <p className="text-gray-500 mt-2 text-sm">
            {isSignup ? "Создай бесплатный аккаунт" : "Войди в свой аккаунт"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">

          {/* ── OAuth buttons ── */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {oauthLoading === "google" ? (
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {isSignup ? "Зарегистрироваться через Google" : "Войти через Google"}
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">или через email</span>
            </div>
          </div>

          {/* ── Email / Password form ── */}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition"
                placeholder={isSignup ? "минимум 6 символов" : "••••••••"}
              />
            </div>

            {/* hCaptcha — only for signup & when site key is set */}
            {isSignup && HCAPTCHA_SITE_KEY && (
              <div className="flex justify-center py-1">
                <div
                  ref={captchaRef}
                  className="h-captcha"
                  data-sitekey={HCAPTCHA_SITE_KEY}
                  data-callback="onMentoraCaptchaSuccess"
                  data-expired-callback="onMentoraCaptchaExpired"
                  data-theme="light"
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs text-center bg-red-50 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 text-sm"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Загрузка...
                  </span>
                : isSignup ? "Создать аккаунт" : "Войти"
              }
            </button>
          </form>

          {/* Hidden widget: loads Telegram.Login API */}
          <div id="telegram-login-widget" style={{position:"absolute",opacity:0,width:1,height:1,overflow:"hidden",pointerEvents:"none"}} />

          <div className="mt-3">
            <button
              type="button"
              disabled={tgLoading}
              onClick={() => {
                const tg = window.Telegram;
                if (tg?.Login?.auth) {
                  tg.Login.auth(
                    { bot_id: 8558784965, request_access: "write" },
                    (user) => { if (user && window.onTelegramAuth) window.onTelegramAuth(user); }
                  );
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {tgLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Входим через Telegram...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#2AABEE]"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19-2.04 9.6c-.15.68-.54.85-1.1.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.49-4.96c.24-.21-.05-.33-.37-.12L6.8 14.26l-2.96-.92c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.2 1 .13.39.26z"/></svg>
                  Войти через Telegram
                </>
              )}
            </button>
          </div>
        </div>

        {/* Switch mode */}
        <p className="text-center text-sm text-gray-500 mt-5">
          {isSignup ? (
            <>Уже есть аккаунт?{" "}
              <button onClick={() => switchMode("signin")} className="text-brand-600 font-medium hover:underline">
                Войти
              </button>
            </>
          ) : (
            <>Нет аккаунта?{" "}
              <button onClick={() => switchMode("signup")} className="text-brand-600 font-medium hover:underline">
                Зарегистрироваться бесплатно
              </button>
            </>
          )}
        </p>

      </div>
    </main>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}