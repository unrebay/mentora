# Delta: Audit (2026-05-27) → Tracking Plan v1

## Changes Applied (P0 — in this commit)

### Renamed
| Old | New | File |
|---|---|---|
| `message_sent` | `chat.message_sent` + `message_index` | ChatInterface.tsx |
| `first_message_sent` | `user.activated` | ChatInterface.tsx |
| `message_edited` | `chat.message_edited` | ChatInterface.tsx |
| `chat_error` | `chat.error` (`status` → `status_code`, `error` → `error_message`) | ChatInterface.tsx |
| `payment_completed` | `subscription.started` (`tier` → `plan`, `billing_plan` → `billing_cycle`) | PaymentSuccessTracker.tsx |

### Fixed
| Issue | Fix |
|---|---|
| `message_sent` fired twice (quickSend + handleSend) | Removed from quickSend, kept only in handleSend |
| Both ProBanners and PaymentSuccessTracker fired on payment=success | Removed posthog from ProBanners; PaymentSuccessTracker is single source of truth |
| No tracking on registration | `user.signed_up` + `posthog.identify()` in auth/page.tsx (email + telegram) |
| No tracking on login | `user.logged_in` in auth/page.tsx (email + telegram) |
| No `posthog.reset()` on logout | Added to UserDropdown.tsx logout button |

### Added
- `user.signed_up` — email + telegram registration
- `user.logged_in` — email + telegram login

### Deprecated (stubs, safe to git rm)
- `src/hooks/useAnalytics.ts` — was never imported; now a no-op stub

## P1 — Post-Launch Additions
- `subject.selected` — subject picker tracking
- `knowledge.viewed` — secondary feature
- `subscription.cancelled`, `subscription.expired`

## P2 — Requires Infrastructure
- `subscription.renewed` — needs posthog-node for YooKassa webhook
