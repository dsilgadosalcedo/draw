/**
 * Error tracking and monitoring utilities
 */

import { reportError } from "./error-handling"

/**
 * Initialize error tracking (e.g., Sentry)
 * Call this once in your app initialization
 */
export function initErrorTracking(): void {
  if (typeof window === "undefined") {
    return // Server-side, skip initialization
  }

  // TODO: Initialize Sentry or other error tracking service
  // Example:
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.init({
  //     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  //     environment: process.env.NODE_ENV,
  //     tracesSampleRate: 1.0,
  //   })
  // }

  // Log initialization
  if (process.env.NODE_ENV === "development") {
    console.log("Error tracking initialized")
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string): void {
  // TODO: Set user context in error tracking service
  // Example:
  // Sentry.setUser({ id: userId, email })
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  // TODO: Clear user context in error tracking service
  // Example:
  // Sentry.setUser(null)
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  // TODO: Track event in analytics service
  // Example:
  // Sentry.addBreadcrumb({
  //   category: 'custom',
  //   message: eventName,
  //   level: 'info',
  //   data: properties,
  // })

  if (process.env.NODE_ENV === "development") {
    console.log("Event tracked:", eventName, properties)
  }
}

/**
 * Report error with additional context
 */
export function reportErrorWithContext(
  error: unknown,
  context: Record<string, unknown>
): void {
  reportError(error, context)
  // Additional error tracking service reporting would go here
}
