"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import MathField from "@/components/MathField";
import SubjectIcon from "@/components/SubjectIcon";
import posthog from "posthog-js";

// ── Type augmentation for hCaptcha on window ──────────────────────────────
declare global {
  interface Window {
    onMentoraCaptchaSuccess?: (token: string) => void;
    onMentoraCaptchaExpired?: () => void;
    onTelegramAuth?: (user: Record<string, string>) => void;
    Telegram?: { Login?: { auth: (opts: Record<string, unknown>, cb: (u: Record<string, string> | null) => void) => void } };
  }
}

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#04060f" }} />}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const [tgLoading, setTgLoading] = useState(false);
  // null = loading widget, true = available, false = blocked/unavailable
  const [tgAvailable, setTgAvailable] = useState<null | boolean>(null);

  const [mode, setMode]         = useState<"signin" | "signup">("signin");
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null); // email address after signup

  const router      = useRouter();
  const searchParams = useSearchParams();
  const supabase    = createClient();
  const captchaRef  = useRef<HTMLDivElement>(null);
  const t = useTranslations("auth");

  // Show OAuth errors from callback redirect
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setError(t("errorOAuth"));
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
        const msg = e instanceof Error ? e.message : t("tryAgain");
        setError(t("errorTelegramLogin") + msg);
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
      script.onload = () => setTgAvailable(true);
      script.onerror = () => setTgAvailable(false);
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
      setError(t("errorConnect"));
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
        setError(t("errorRobot"));
        setLoading(false);
        return;
      }
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaToken ?? undefined,
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          setError(t("errorEmailExists"));
        } else if (error.message.includes("captcha")) {
          setError(t("errorCaptcha"));
        } else {
          setError(error.message);
        }
      } else {
        // Track referral if ref code in URL
        const refCode = searchParams.get("ref");
        if (refCode && signUpData.user?.id) {
          fetch("/api/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: refCode, newUserId: signUpData.user.id }),
          }).catch(() => {}); // non-blocking
        }
        // If no session → email confirmation required
        if (!signUpData.session) {
          setEmailSent(email);
        } else {
          router.push("/onboarding");
          router.refresh();
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(t("errorCredentials"));
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

  // ── Email confirmation screen ──────────────────────────────────────────
  if (emailSent) {
    return (
      <main className="min-h-screen relative flex items-center justify-center px-4 py-12" style={{ background: "#04060f" }}>
        <MathField />
        <div className="relative z-10 w-full max-w-sm text-center animate-fade-in-up">
          <Logo size="md" href="/" className="justify-center mb-10" textColor="white" />
          <div className="glass rounded-3xl p-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "rgba(69,97,232,0.18)", border: "1px solid rgba(107,143,255,0.25)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B8FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{t("checkEmail")}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t("checkEmailDesc")}{" "}
                <span className="text-white font-semibold">{emailSent}</span>.<br/>
                {t("checkEmailActivate")}
              </p>
            </div>
            <div className="rounded-xl p-3 text-xs text-gray-500" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {t("checkEmailNoReceive")}{" "}
              <button className="text-[#6B8FFF] hover:underline font-medium" onClick={() => setEmailSent(null)}>
                {t("tryAgain")}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex">

      {/* ══════════════════════════════════════════════
          LEFT PANEL — Branded dark side with 3D spheres
          Hidden on mobile, 42% on lg+
      ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex relative flex-col overflow-hidden"
        style={{ width: "42%", background: "#04060f", minHeight: "100vh" }}>

        {/* Floating math symbols */}
        <MathField />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <Logo size="sm" href="/" textColor="white" />

          {/* Center quote */}
          <div className="flex-1 flex flex-col justify-center pt-8">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-5"
               style={{ color: "rgba(107,143,255,0.7)" }}>
              {t("leftTagline")}
            </p>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-5">
              {t("leftHeading1")}<br />
              {t("leftHeading2")}<br />
              <span style={{
                background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 45%, #9F7AFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {t("leftHeading3")}
              </span>
            </h2>
            <p className="text-sm leading-relaxed max-w-xs"
               style={{ color: "rgba(255,255,255,0.55)" }}>
              {t("leftSubtitle")}
            </p>
          </div>

          {/* Bottom — subject icons + trust */}
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {["russian-history","mathematics","physics","chemistry","biology","english","astronomy"].map(id => (
                <SubjectIcon key={id} id={id} size={30} style={{ opacity: 0.85 }} />
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span>{t("leftStats1")}</span>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span>{t("leftStats2")}</span>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span>{t("leftStats3")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Form
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10"
        style={{ background: "var(--bg)" }}>

        {/* Mobile logo (hidden on lg+) */}
        <div className="lg:hidden mb-8 w-full max-w-md">
          <Logo size="md" href="/" />
        </div>

        <div className="w-full max-w-md animate-fade-in-up">

          {/* ── Mode toggle pill ── */}
          <div className="relative flex p-1 rounded-2xl mb-6"
            style={{ background: "var(--bg-secondary)" }}>
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-xl transition-all duration-200"
              style={{
                width: "calc(50% - 4px)",
                left: isSignup ? "calc(50%)" : "4px",
                background: "var(--bg-card)",
                boxShadow: "0 1px 5px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            />
            <button
              onClick={() => switchMode("signin")}
              className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10"
              style={{ color: !isSignup ? "var(--text)" : "var(--text-muted)" }}
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => switchMode("signup")}
              className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10"
              style={{ color: isSignup ? "var(--text)" : "var(--text-muted)" }}
            >
              {t("signUpTab")}
            </button>
          </div>

          {/* ── Auth card ── */}
          <div className="rounded-3xl border p-7 space-y-4"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
            }}>

            <div className="mb-1">
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {isSignup ? t("createFreeAccount") : t("welcomeBack")}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {isSignup ? t("noCard") : t("continueLearn")}
              </p>
            </div>

            {/* ── Google OAuth ── */}
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-60"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              {oauthLoading === "google" ? (
                <span className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--border)", borderTopColor: "var(--text-secondary)" }} />
              ) : <GoogleIcon />}
              {t("continueGoogle")}
            </button>

            {/* ── Divider ── */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 border-t" style={{ borderColor: "var(--border-light)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("orEmail")}</span>
              <div className="flex-1 border-t" style={{ borderColor: "var(--border-light)" }} />
            </div>

            {/* ── Email / Password form ── */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8]"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text)" }}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                  {t("password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8]"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text)" }}
                  placeholder={isSignup ? t("passwordPlaceholder") : t("passwordPlaceholderSignIn")}
                />
              </div>

              {/* hCaptcha — only for signup */}
              {isSignup && HCAPTCHA_SITE_KEY && (
                <div className="flex justify-center py-1">
                  <div
                    ref={captchaRef}
                    className="h-captcha"
                    data-sitekey={HCAPTCHA_SITE_KEY}
                    data-callback="onMentoraCaptchaSuccess"
                    data-expired-callback="onMentoraCaptchaExpired"
                    data-theme="auto"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || oauthLoading !== null}
                className="btn-glow w-full py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50 disabled:transform-none"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("loading")}
                    </span>
                  : <span className="inline-flex items-center justify-center gap-2">
                      {isSignup ? t("createAccountBtn") : t("signInBtn")}
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                }
              </button>
            </form>

            {/* Hidden widget: loads Telegram.Login API */}
            <div id="telegram-login-widget" style={{position:"absolute",opacity:0,width:1,height:1,overflow:"hidden",pointerEvents:"none"}} />

            {/* Telegram button */}
            <div>
              {tgAvailable === false ? (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 opacity-50" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19l-2.04 9.6c-.15.68-.54.85-1.1.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.49-4.96c.24-.21-.05-.33-.37-.12L6.8 14.26l-2.96-.92c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.2 1 .13.39.26z"/>
                  </svg>
                  {t("telegramUnavailable")}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={tgLoading || tgAvailable === null}
                  onClick={() => {
                    const tg = window.Telegram;
                    if (tg?.Login?.auth) {
                      tg.Login.auth(
                        { bot_id: 8558784965, request_access: "write" },
                        (user) => {
                          if (user && window.onTelegramAuth) {
                            window.onTelegramAuth(user);
                          } else if (!user) {
                            setError(t("errorTelegramFailed"));
                          }
                        }
                      );
                    } else {
                      setError(t("errorTelegramUnavailable"));
                    }
                }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-60"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  {tgLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: "var(--border)", borderTopColor: "var(--text-secondary)" }} />
                      {t("signingInTelegram")}
                    </>
                  ) : tgAvailable === null ? (
                    <>
                      <span className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: "var(--border-light)", borderTopColor: "var(--text-muted)" }} />
                      {t("checkingTelegram")}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#2AABEE]">
                        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19l-2.04 9.6c-.15.68-.54.85-1.1.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.49-4.96c.24-.21-.05-.33-.37-.12L6.8 14.26l-2.96-.92c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.2 1 .13.39.26z"/>
                      </svg>
                      {t("signInTelegram")}
                    </>
                  )}
                </button>
              )}
            </div>

          </div>{/* /auth card */}

          {/* Switch mode link */}
          <p className="text-center text-sm mt-5" style={{ color: "var(--text-muted)" }}>
            {isSignup ? (
              <>{t("hasAccount")}{" "}
                <button onClick={() => switchMode("signin")}
                  className="font-semibold hover:underline" style={{ color: "var(--brand)" }}>
                  {t("signIn")}
                </button>
              </>
            ) : (
              <>{t("noAccount")}{" "}
                <button onClick={() => switchMode("signup")}
                  className="font-semibold hover:underline" style={{ color: "var(--brand)" }}>
                  {t("signUpFreeLink")}
                </button>
              </>
            )}
          </p>

        </div>{/* /max-w-md */}
      </div>{/* /right panel */}
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
