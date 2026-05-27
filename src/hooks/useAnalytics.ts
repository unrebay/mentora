// DEPRECATED — never imported anywhere in the codebase.
// Direct posthog imports are used instead (see .telemetry/tracking-plan.yaml).
// Safe to git rm in a future cleanup sprint.
export function useAnalytics() {
  return {
    track: (_event: string, _props?: Record<string, unknown>) => {},
    identify: (_userId: string, _props?: Record<string, unknown>) => {},
  }
}
