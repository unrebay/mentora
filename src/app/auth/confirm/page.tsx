"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirm() {
  useEffect(() => {
    const supabase = createClient();

    // Supabase client automatically parses #access_token from hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
          subscription.unsubscribe();
          window.location.href = "/dashboard";
        }
      }
    );

    // Also check if session is already set
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        window.location.href = "/dashboard";
      }
    });

    return () => subscription.unsubscribe();
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
