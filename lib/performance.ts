/**
 * Performance monitoring utilities
 */

/**
 * Measure execution time of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(
      `[Performance] ${name} failed after ${duration.toFixed(2)}ms:`,
      error
    )
    throw error
  }
}

/**
 * Measure synchronous execution time
 */
export function measurePerformanceSync<T>(name: string, fn: () => T): T {
  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(
      `[Performance] ${name} failed after ${duration.toFixed(2)}ms:`,
      error
    )
    throw error
  }
}

/**
 * Track component render time
 */
export function trackComponentRender(componentName: string): () => void {
  const start = performance.now()
  return () => {
    const duration = performance.now() - start
    if (process.env.NODE_ENV === "development") {
      console.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`)
    }
  }
}

/**
 * Track API response time
 */
export function trackApiResponse(endpoint: string, startTime: number): void {
  const duration = performance.now() - startTime
  if (process.env.NODE_ENV === "development") {
    console.log(`[API] ${endpoint}: ${duration.toFixed(2)}ms`)
  }
  // TODO: Send to analytics service
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  timing?: PerformanceTiming
} {
  if (typeof window === "undefined") {
    return {}
  }

  const metrics: {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
    timing?: PerformanceTiming
  } = {}

  // Memory metrics (Chrome only)
  if ("memory" in performance) {
    const memory = (
      performance as {
        memory: {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }
      }
    ).memory
    metrics.memory = memory
  }

  // Navigation timing
  if (performance.timing) {
    metrics.timing = performance.timing
  }

  return metrics
}
