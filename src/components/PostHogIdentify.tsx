"use client"
import { useEffect } from "react"
import posthog from "posthog-js"

interface Props {
  userId: string
  email?: string
  plan?: string
}

export function PostHogIdentify({ userId, email, plan }: Props) {
  useEffect(() => {
    if (userId) {
      posthog.identify(userId, { email, plan })
    }
  }, [userId, email, plan])
  return null
}
