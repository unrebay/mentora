"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirm() {
  useEffect(() => {
    const supabase = createClient();

    // PKCE flow: token_hash arrives as query param (Supabase SSR default)
    const searchParams = new URLSearchParams(window.location.search);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (token_hash && type) {
      supabase.auth
        .verifyOtp({ token_hash, type: type as "magiclink" | "email" })
        .then(({ error }) => {
          if (error) {
            window.location.href = "/auth?error=verify_failed";
          } else {
            window.location.href = "/dashboard";
          }
        });
      return;
    }

    // Legacy implicit flow: tokens in URL hash fragment (fallback)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            window.location.href = "/auth?error=session_failed";
          } else {
            window.location.href = "/dashboard";
          }
        });
    } else {
      window.location.href = "/auth?error=no_token";
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#06060f] flex items-center justify-center relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(69,97,232,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* Glass card */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
        {/* Logo mark */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 0 30px rgba(69,97,232,0.4)" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="2" opacity="0.6" />
            <circle cx="14" cy="14" r="5" fill="white" />
          </svg>
        </div>

        {/* Spinner */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.08)]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#6B8FFF] animate-spin" />
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="font-semibold text-base"
            style={{
              background: "linear-gradient(120deg, #6B8FFF, #ffffff, #9F7AFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
            Входим в Mentora
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            Это займёт секунду…
          </p>
        </div>
      </div>
    </main>
  );
}
