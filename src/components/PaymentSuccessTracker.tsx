"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";

/**
 * Mounted on /dashboard. When YooKassa/payment provider redirects back with
 * ?payment=success&plan=monthly|annual, fires a PostHog conversion event.
 * Idempotent — fires only on first render with the param present.
 */
export default function PaymentSuccessTracker() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("payment") !== "success") return;

    const plan        = params.get("plan") ?? "monthly";
    const tier        = params.get("tier") ?? "pro"; // pro | ultima
    const isAnnual    = plan === "annual";
    const PRICE_TABLE: Record<string, Record<string, number>> = {
      pro:    { monthly: 499,  annual: 2990 },
      ultima: { monthly: 999, annual: 7990 },
    };
    const amount = PRICE_TABLE[tier]?.[plan] ?? PRICE_TABLE.pro.monthly;

    posthog?.capture?.("payment_completed", {
      tier,
      billing_plan: plan,
      amount_rub: amount,
      annual: isAnnual,
    });

    // Optional: also clear the URL so refresh doesn't re-trigger
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("plan");
      url.searchParams.delete("tier");
      window.history.replaceState({}, "", url.toString());
    }
  }, [params]);

  return null;
}
