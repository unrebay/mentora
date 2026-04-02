"use client"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import posthog from "posthog-js"

export function PaymentSuccessTracker() {
  const params = useSearchParams()
  useEffect(() => {
    if (params.get("payment") === "success") {
      posthog.capture("payment_completed", { plan: "pro", amount: 499 })
    }
  }, [params])
  return null
}
