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
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#4561E8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-sm">Входим...</p>
      </div>
    </main>
  );
}
