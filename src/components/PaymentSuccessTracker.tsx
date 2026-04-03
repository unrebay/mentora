"use client"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import posthog from "posthog-js"

export function PaymentSuccessTracker() {
  const params = useSearchParams()
  useEffect(() => {
    if (params.get("payment") === "success") {
      const params=new URLSearchParams(window.location.search); const plan=params.get('plan')||'monthly'; posthog.capture('payment_completed',{ plan: 'pro', billing_plan: plan, amount: plan==='annual'?2990:399 })
    }
  }, [params])
  return null
}
