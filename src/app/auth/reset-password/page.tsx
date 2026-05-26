"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [done, setDone]                 = useState(false);
  const [hasSession, setHasSession]     = useState<boolean | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Verify we actually have a session from the recovery link.
    // If not — send user back to auth page.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setHasSession(true);
      else { window.location.href = "/auth?error=no_session"; }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов.");
      return;
    }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError("Не удалось сохранить пароль. Попробуй ещё раз.");
    else setDone(true);
  }

  // Loading state while we verify session
  if (hasSession === null) {
    return (
      <main className="min-h-screen bg-[#06060f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#6B8FFF] rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#05080f" }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(69,97,232,0.10) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full" style={{ maxWidth: 400 }}>
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 0 24px rgba(69,97,232,0.35)" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8" opacity="0.6" />
              <circle cx="11" cy="11" r="4" fill="white" />
            </svg>
          </div>
        </div>

        <div className="rounded-3xl p-7 space-y-5"
          style={{
            background: "rgba(6,10,30,0.60)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(28px) saturate(1.3)",
            WebkitBackdropFilter: "blur(28px) saturate(1.3)",
            boxShadow: "0 8px 60px rgba(0,0,0,0.55)",
          }}>

          {done ? (
            /* ── Success state ── */
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Пароль обновлён</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Теперь ты можешь войти с новым паролем.
                </p>
              </div>
              <a
                href="/dashboard"
                className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm"
              >
                Перейти в дашборд
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div>
                <h2 className="text-xl font-bold text-white">Новый пароль</h2>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
                  Придумай надёжный пароль (минимум 6 символов).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8] placeholder:text-white/25"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.9)" }}
                    placeholder="Минимум 6 символов"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Повтори пароль
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8] placeholder:text-white/25"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.9)" }}
                    placeholder="Повтори пароль"
                  />
                </div>

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
                  disabled={loading}
                  className="btn-glow w-full py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Сохраняем…
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      Сохранить пароль
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>
          <a href="/auth" className="hover:underline" style={{ color: "rgba(107,143,255,0.60)" }}>← Вернуться к входу</a>
        </p>
      </div>
    </main>
  );
}
