import posthog from 'posthog-js'

export function useAnalytics() {
  return {
    track: (event: string, props?: Record<string, unknown>) => {
      posthog.capture(event, props)
    },
    identify: (userId: string, props?: Record<string, unknown>) => {
      posthog.identify(userId, props)
    },
  }
}
