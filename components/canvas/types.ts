import { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"

// Branded types for better type safety
export type DrawingId = string & { readonly __brand: "DrawingId" }
export type FolderId = string & { readonly __brand: "FolderId" }

/**
 * Creates a DrawingId from a string
 */
export function createDrawingId(id: string): DrawingId {
  return id as DrawingId
}

/**
 * Creates a FolderId from a string
 */
export function createFolderId(id: string): FolderId {
  return id as FolderId
}

// Type for JSON-serializable AppState (after serialization)
export type SerializedAppState = {
  [key: string]: unknown
}

// Type for the drawing data returned from Convex
export type DrawingData = {
  _id: string
  _creationTime: number
  userId: string
  drawingId: string
  name: string
  elements: readonly OrderedExcalidrawElement[] | null
  appState: SerializedAppState | null
  files?: Record<string, string> // Map of fileId -> URL
} | null

export type EditableNameBadgeProps = {
  drawingId?: string | null
  name?: string | null
  theme?: "light" | "dark"
}

/**
 * Type guard to check if a value is a valid DrawingId
 */
export function isDrawingId(value: unknown): value is DrawingId {
  return typeof value === "string" && value.length > 0
}

/**
 * Type guard to check if a value is a valid FolderId
 */
export function isFolderId(value: unknown): value is FolderId {
  return typeof value === "string" && value.length > 0
}
