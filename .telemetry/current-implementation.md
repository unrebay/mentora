# Current Implementation — Mentora Analytics

> How PostHog is wired in the Mentora codebase.
> Generated: 2026-05-27

---

## SDK and Version

**Package:** `posthog-js` v1.240.6 (browser SDK only)
**Server-side SDK:** not installed (`posthog-node` absent from `package.json`)
**Host:** `https://eu.i.posthog.com` (EU data residency, set via `NEXT_PUBLIC_POSTHOG_HOST`)

---

## Initialization

**File:** `src/components/PostHogProvider.tsx`

PostHog initializes inside a `useEffect` in `PostHogProvider` (a client component). The `useEffect` guards against double-init with `if (!posthog.__loaded)`. Init options:

```ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
  persistence: 'localStorage+cookie',
})
```

`PostHogProvider` wraps the entire Next.js app via the root layout (`src/app/layout.tsx`).

---

## Client vs Server

All tracking is client-side only. No server-side PostHog calls anywhere. `posthog-node` is not installed.

---

## Call Routing

Direct imports in each component — no central wrapper in active use. A hook (`src/hooks/useAnalytics.ts`) was written but is deprecated and never called.

**Active call sites:**
- `src/components/chat/ChatInterface.tsx` — chat events
- `src/components/PaymentSuccessTracker.tsx` — subscription.started
- `src/components/PostHogIdentify.tsx` — identify() on dashboard load
- `src/components/UserDropdown.tsx` — posthog.reset() on logout
- `src/app/[locale]/auth/page.tsx` — user.signed_up, user.logged_in

---

## Identity Management

`PostHogIdentify` mounts on `/dashboard` and calls `posthog.identify(userId, { email, plan })` on every load. `user.signed_up` fires `posthog.identify()` at registration for email signups. `posthog.reset()` fires on logout via `UserDropdown`.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (defaults to `https://eu.i.posthog.com`) |

---

## What Works Well

- Root-level `PostHogProvider` — clean, `!posthog.__loaded` guard prevents double-init.
- EU data residency via env var.
- snake_case / object.action naming applied consistently.
- `PaymentSuccessTracker` clears URL params after firing (prevents re-fire on refresh).
- `persistence: 'localStorage+cookie'` gives cross-session continuity.
