"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const REF_STORAGE_KEY = "mentora_ref_pending";

/**
 * ReferralProcessor — checks localStorage for a pending referral code
 * (saved on /auth when URL had ?ref=XXX), and once the user is authenticated
 * and on dashboard/onboarding, POSTs it to /api/referral. Then clears it.
 *
 * Covers all signup paths (email, Google OAuth, Telegram), not just email
 * signup which had the inline POST.
 */
export default function ReferralProcessor() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const code = localStorage.getItem(REF_STORAGE_KEY);
        if (!code) return;

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const res = await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, newUserId: user.id }),
        });

        // Clear regardless of result so we don't retry forever (server is
        // idempotent — repeated calls return reason: already_referred).
        localStorage.removeItem(REF_STORAGE_KEY);

        if (!res.ok) {
          // Just log — don't surface error to user
          console.warn("[ReferralProcessor] POST /api/referral non-OK", res.status);
        }
      } catch (e) {
        console.warn("[ReferralProcessor] error", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return null;
}
