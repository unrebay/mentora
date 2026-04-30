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

// ── Type augmentation ────────────────────────────────────────────────────────
declare global {
  interface Window {
    onMentoraCaptchaSuccess?: (token: string) => void;
    onMentoraCaptchaExpired?: () => void;
    onTelegramAuth?: (user: Record<string, string>) => void;
    Telegram?: { Login?: { auth: (opts: Record<string, unknown>, cb: (u: Record<string, string> | null) => void) => void } };
  }
}

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

// ── Deterministic star field ─────────────────────────────────────────────────
function sr(s: number) { const x = Math.sin(s) * 73856; return x - Math.floor(x); }
const STARS = Array.from({ length: 55 }, (_, i) => ({
  top:     sr(i * 3.71 + 1) * 100,
  left:    sr(i * 7.13 + 2) * 100,
  size:    sr(i * 11.3 + 3) * 1.8 + 0.5,
  opacity: sr(i * 5.9  + 4) * 0.35 + 0.1,
  pulse:   sr(i * 13.7 + 5) > 0.7,          // ~30% stars twinkle
}));

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
  const [tgLoading, setTgLoading]     = useState(false);
  const [tgAvailable, setTgAvailable] = useState<null | boolean>(null);
  const [mode, setMode]         = useState<"signin" | "signup">("signin");
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const captchaRef   = useRef<HTMLDivElement>(null);
  const t = useTranslations("auth");

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setError(t("errorOAuth"));
  }, [searchParams]);

  useEffect(() => {
    window.onMentoraCaptchaSuccess = (token: string) => setCaptchaToken(token);
    window.onMentoraCaptchaExpired = () => setCaptchaToken(null);
    return () => { delete window.onMentoraCaptchaSuccess; delete window.onMentoraCaptchaExpired; };
  }, []);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) return;
    if (document.getElementById("hcaptcha-script")) return;
    const script = document.createElement("script");
    script.id = "hcaptcha-script"; script.src = "https://js.hcaptcha.com/1/api.js";
    script.async = true; script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => { setCaptchaToken(null); }, [mode]);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      setTgLoading(true);
      try {
        const res  = await fetch("/api/auth/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
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
      script.setAttribute("data-size", "large"); script.setAttribute("data-radius", "10");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write"); script.setAttribute("data-userpic", "false");
      script.async = true;
      script.onload  = () => setTgAvailable(true);
      script.onerror = () => setTgAvailable(false);
      container.appendChild(script);
    }
    return () => { delete window.onTelegramAuth; };
  }, []);

  async function handleOAuth(provider: "google") {
    setOauthLoading(provider); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined },
    });
    if (error) { setError(t("errorConnect")); setOauthLoading(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    if (mode === "signup") {
      if (HCAPTCHA_SITE_KEY && !captchaToken) { setError(t("errorRobot")); setLoading(false); return; }
      const { data: signUpData, error } = await supabase.auth.signUp({ email, password, options: { captchaToken: captchaToken ?? undefined } });
      if (error) {
        if (error.message.includes("already registered")) setError(t("errorEmailExists"));
        else if (error.message.includes("captcha"))       setError(t("errorCaptcha"));
        else                                               setError(error.message);
      } else {
        const refCode = searchParams.get("ref");
        if (refCode && signUpData.user?.id) {
          fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: refCode, newUserId: signUpData.user.id }) }).catch(() => {});
        }
        if (!signUpData.session) setEmailSent(email);
        else { router.push("/onboarding"); router.refresh(); }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(t("errorCredentials"));
      else { router.push("/dashboard"); router.refresh(); }
    }
    setLoading(false);
  }

  function switchMode(next: "signin" | "signup") { setMode(next); setError(null); }
  const isSignup = mode === "signup";

  // ── Email confirmation screen ─────────────────────────────────────────────
  if (emailSent) {
    return (
      <main className="min-h-screen relative flex items-center justify-center px-4 py-12" style={{ background: "#04060f" }}>
        <GalaxyBg />
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}><MathField /></div>
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
                {t("checkEmailDesc")}{" "}<span className="text-white font-semibold">{emailSent}</span>.<br/>{t("checkEmailActivate")}
              </p>
            </div>
            <div className="rounded-xl p-3 text-xs text-gray-500" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {t("checkEmailNoReceive")}{" "}
              <button className="text-[#6B8FFF] hover:underline font-medium" onClick={() => setEmailSent(null)}>{t("tryAgain")}</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Main auth screen ──────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#04060f" }}>

      {/* ── Galaxy background ─────────────────────────────────────── */}
      <GalaxyBg />

      {/* ── Math formulas — full screen ────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <MathField />
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-5 py-10"
        style={{ zIndex: 10 }}>

        {/* Logo */}
        <div className="mb-6">
          <Logo size="sm" href="/" textColor="white" />
        </div>

        {/* Headline — new positioning */}
        <div className="text-center mb-8 max-w-xs sm:max-w-sm">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-3"
             style={{ color: "rgba(107,143,255,0.7)" }}>
            {t("leftTagline")}
          </p>
          <h1 className="font-black leading-tight text-white mb-3"
              style={{ fontSize: "clamp(22px, 5vw, 32px)" }}>
            {t("leftHeading1")}{" "}{t("leftHeading2")}{" "}
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 45%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              {t("leftHeading3")}
            </span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            {t("leftSubtitle")}
          </p>
        </div>

        {/* ── Mode toggle — SEPARATE from card, like a navbar pill ── */}
        <div className="w-full mb-3 animate-fade-in-up" style={{ maxWidth: 400 }}>
          <div className="relative flex p-1 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            }}>
            {/* Sliding indicator */}
            <div className="absolute top-1 bottom-1 rounded-xl transition-all duration-200"
              style={{
                width: "calc(50% - 4px)",
                left: isSignup ? "calc(50%)" : "4px",
                background: "rgba(255,255,255,0.11)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
              }} />
            <button
              onClick={() => switchMode("signin")}
              className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
              style={{ zIndex: 1, color: !isSignup ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.32)" }}
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => switchMode("signup")}
              className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
              style={{ zIndex: 1, color: isSignup ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.32)" }}
            >
              {t("signUpTab")}
            </button>
          </div>
        </div>

        {/* ── Glass card ─────────────────────────────────────────────── */}
        <div className="w-full animate-fade-in-up" style={{ maxWidth: 400 }}>
          <div className="rounded-3xl p-7 space-y-4"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.13)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow: "0 8px 60px rgba(0,0,0,0.55), 0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}>

            {/* Card heading */}
            <div className="mb-1">
              <h2 className="text-xl font-bold text-white">
                {isSignup ? t("createFreeAccount") : t("welcomeBack")}
              </h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                {isSignup ? t("noCard") : t("continueLearn")}
              </p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-60"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
            >
              {oauthLoading === "google"
                ? <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.7)" }} />
                : <GoogleIcon />}
              {t("continueGoogle")}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{t("orEmail")}</span>
              <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Email / Password form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8] placeholder:text-white/25"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>{t("password")}</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"}
                  className="w-full px-4 py-3 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8] placeholder:text-white/25"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                  placeholder={isSignup ? t("passwordPlaceholder") : t("passwordPlaceholderSignIn")}
                />
              </div>

              {/* hCaptcha */}
              {isSignup && HCAPTCHA_SITE_KEY && (
                <div className="flex justify-center py-1">
                  <div ref={captchaRef} className="h-captcha"
                    data-sitekey={HCAPTCHA_SITE_KEY}
                    data-callback="onMentoraCaptchaSuccess"
                    data-expired-callback="onMentoraCaptchaExpired"
                    data-theme="auto" />
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

              <button type="submit" disabled={loading || oauthLoading !== null}
                className="btn-glow w-full py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50 disabled:transform-none">
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

            {/* Hidden Telegram widget loader */}
            <div id="telegram-login-widget" style={{ position:"absolute", opacity:0, width:1, height:1, overflow:"hidden", pointerEvents:"none" }} />

            {/* Telegram button */}
            <div>
              {tgAvailable === false ? (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
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
                      tg.Login.auth({ bot_id: 8558784965, request_access: "write" }, (user) => {
                        if (user && window.onTelegramAuth) window.onTelegramAuth(user);
                        else if (!user) setError(t("errorTelegramFailed"));
                      });
                    } else { setError(t("errorTelegramUnavailable")); }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-60"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                >
                  {tgLoading ? (
                    <><span className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: "rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.7)" }} />{t("signingInTelegram")}</>
                  ) : tgAvailable === null ? (
                    <><span className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.4)" }} />{t("checkingTelegram")}</>
                  ) : (
                    <><svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#2AABEE]">
                        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19l-2.04 9.6c-.15.68-.54.85-1.1.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.49-4.96c.24-.21-.05-.33-.37-.12L6.8 14.26l-2.96-.92c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.2 1 .13.39.26z"/>
                      </svg>{t("signInTelegram")}</>
                  )}
                </button>
              )}
            </div>

          </div>{/* /glass card */}
        </div>

        {/* Switch mode link */}
        <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {isSignup ? (
            <>{t("hasAccount")}{" "}
              <button onClick={() => switchMode("signin")} className="font-semibold hover:underline" style={{ color: "#6B8FFF" }}>{t("signIn")}</button>
            </>
          ) : (
            <>{t("noAccount")}{" "}
              <button onClick={() => switchMode("signup")} className="font-semibold hover:underline" style={{ color: "#6B8FFF" }}>{t("signUpFreeLink")}</button>
            </>
          )}
        </p>

        {/* Subject icons + stats */}
        <div className="flex items-center gap-2 mt-8 flex-wrap justify-center">
          {["russian-history","mathematics","physics","chemistry","biology","english","astronomy"].map(id => (
            <SubjectIcon key={id} id={id} size={28} style={{ opacity: 0.55 }} />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
          <span>{t("leftStats1")}</span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
          <span>{t("leftStats2")}</span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
          <span>{t("leftStats3")}</span>
        </div>

      </div>{/* /content */}
    </main>
  );
}

// ── Galaxy background component ──────────────────────────────────────────────
function GalaxyBg() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Nebula blobs */}
      <div style={{ position:"absolute", top:"-18%", left:"-8%", width:"68%", height:"68%",
        background:"radial-gradient(ellipse, rgba(69,97,232,0.25) 0%, transparent 65%)", filter:"blur(65px)" }} />
      <div style={{ position:"absolute", top:"15%", right:"-12%", width:"60%", height:"58%",
        background:"radial-gradient(ellipse, rgba(159,122,255,0.18) 0%, transparent 65%)", filter:"blur(60px)" }} />
      <div style={{ position:"absolute", bottom:"-12%", left:"18%", width:"58%", height:"52%",
        background:"radial-gradient(ellipse, rgba(255,90,0,0.1) 0%, transparent 65%)", filter:"blur(70px)" }} />
      <div style={{ position:"absolute", top:"50%", left:"25%", width:"40%", height:"40%",
        background:"radial-gradient(ellipse, rgba(0,180,200,0.07) 0%, transparent 65%)", filter:"blur(50px)" }} />
      {/* Star field */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position:"absolute", top:`${s.top}%`, left:`${s.left}%`,
          width:`${s.size}px`, height:`${s.size}px`,
          borderRadius:"50%", background:"white", opacity:s.opacity,
          animation: s.pulse ? `pulse ${2 + (i % 3)}s ease-in-out infinite alternate` : undefined,
        }} />
      ))}
      {/* Neural connection lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
        <line x1="5%"  y1="20%" x2="25%" y2="45%" stroke="#6B8FFF" strokeWidth="0.5" />
        <line x1="25%" y1="45%" x2="55%" y2="30%" stroke="#6B8FFF" strokeWidth="0.5" />
        <line x1="55%" y1="30%" x2="80%" y2="55%" stroke="#9F7AFF" strokeWidth="0.5" />
        <line x1="80%" y1="55%" x2="90%" y2="25%" stroke="#9F7AFF" strokeWidth="0.5" />
        <line x1="15%" y1="70%" x2="40%" y2="60%" stroke="#4561E8" strokeWidth="0.5" />
        <line x1="40%" y1="60%" x2="65%" y2="75%" stroke="#4561E8" strokeWidth="0.5" />
        <line x1="65%" y1="75%" x2="85%" y2="80%" stroke="#6B8FFF" strokeWidth="0.5" />
        <line x1="30%" y1="15%" x2="60%" y2="10%" stroke="#9F7AFF" strokeWidth="0.5" />
        <line x1="60%" y1="10%" x2="75%" y2="35%" stroke="#6B8FFF" strokeWidth="0.5" />
        {/* Node dots at intersections */}
        {[
          ["5%","20%"], ["25%","45%"], ["55%","30%"], ["80%","55%"], ["90%","25%"],
          ["15%","70%"], ["40%","60%"], ["65%","75%"], ["85%","80%"],
          ["30%","15%"], ["60%","10%"], ["75%","35%"],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill={i % 3 === 0 ? "#6B8FFF" : i % 3 === 1 ? "#9F7AFF" : "#4561E8"} opacity="0.5" />
        ))}
      </svg>
      <style>{`
        @keyframes pulse { from { opacity: 0.1; } to { opacity: 0.55; } }
      `}</style>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
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
