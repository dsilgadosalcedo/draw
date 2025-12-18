import "@testing-library/jest-dom"
import { beforeAll, afterEach, mock } from "bun:test"

// Setup happy-dom environment
if (
  typeof globalThis.window === "undefined" ||
  typeof globalThis.document === "undefined"
) {
  // @ts-expect-error - happy-dom types
  const { Window } = await import("happy-dom")
  // @ts-expect-error - happy-dom types
  const window = new Window()
  globalThis.window = window as unknown as Window & typeof globalThis
  globalThis.document = window.document as unknown as Document
  globalThis.navigator = window.navigator as unknown as Navigator
  globalThis.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement
  globalThis.Element = window.Element as unknown as typeof Element
}

// Mock Convex client
beforeAll(() => {
  // Mock Convex hooks
  global.mockConvexQuery = mock(() => undefined)
  global.mockConvexMutation = mock(() => Promise.resolve(null))
  global.mockConvexAction = mock(() => Promise.resolve(null))
})

// Cleanup after each test
afterEach(() => {
  // Reset all mocks
  if (global.mockConvexQuery) global.mockConvexQuery.mockClear()
  if (global.mockConvexMutation) global.mockConvexMutation.mockClear()
  if (global.mockConvexAction) global.mockConvexAction.mockClear()
})

// Global test utilities
declare global {
  var mockConvexQuery: ReturnType<typeof mock>
  var mockConvexMutation: ReturnType<typeof mock>
  var mockConvexAction: ReturnType<typeof mock>
}

// Helper to create mock Convex query result
export function createMockQuery<T>(data: T) {
  return mock(() => data)
}

// Helper to create mock Convex mutation
export function createMockMutation() {
  return mock(() => Promise.resolve(null))
}

// Helper to create mock Convex action
export function createMockAction() {
  return mock(() => Promise.resolve(null))
}
