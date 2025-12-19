/**
 * Analytics utilities (privacy-focused)
 */

/**
 * Track a user action (anonymized)
 */
export function trackAction(
  action: string,
  properties?: Record<string, unknown>
): void {
  // TODO: Integrate with analytics service (e.g., PostHog, Plausible)
  // Example:
  // if (window.plausible) {
  //   window.plausible(action, { props: properties })
  // }

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", action, properties)
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  trackAction("pageview", { path })
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string): void {
  trackAction("feature_used", { feature })
}

/**
 * Track drawing creation
 */
export function trackDrawingCreated(): void {
  trackAction("drawing_created")
}

/**
 * Track collaboration event
 */
export function trackCollaboration(action: "shared" | "joined"): void {
  trackAction("collaboration", { action })
}

/**
 * Initialize analytics
 */
export function initAnalytics(): void {
  if (typeof window === "undefined") {
    return
  }

  // TODO: Initialize analytics service
  // Example:
  // if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
  //   // Initialize service
  // }

  if (process.env.NODE_ENV === "development") {
    console.log("Analytics initialized")
  }
}
