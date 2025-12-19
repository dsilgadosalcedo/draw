import { v } from "convex/values"

/**
 * Validator for Excalidraw element structure
 * Excalidraw elements have a common structure with id, type, and other properties
 */
export const excalidrawElement = v.any() // TODO: Define more specific structure when Excalidraw types are available

/**
 * Validator for Excalidraw AppState
 * AppState contains view settings, theme, and other UI state
 */
export const excalidrawAppState = v.any() // TODO: Define more specific structure when Excalidraw types are available

/**
 * Validator for BinaryFiles from Excalidraw
 * BinaryFiles is a record mapping file IDs to file data
 */
export const binaryFiles = v.optional(
  v.record(
    v.string(),
    v.union(
      v.object({
        dataURL: v.string(),
        mimeType: v.optional(v.string())
      }),
      v.object({
        mimeType: v.string(),
        data: v.union(v.string(), v.any()) // Uint8Array or string
      }),
      v.any() // Blob or other formats
    )
  )
)
