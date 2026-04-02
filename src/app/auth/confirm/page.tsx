"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirm() {
  useEffect(() => {
    const supabase = createClient();

    // Parse tokens from URL hash fragment
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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Входим через Telegram...</p>
      </div>
    </main>
  );
}
