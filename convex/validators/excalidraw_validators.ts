import { v } from "convex/values"

/**
 * Validator for Excalidraw elements.
 * Kept permissive for nested runtime-specific fields, but still enforces the
 * outer array shape and preserves null for backwards compatibility.
 */
export const excalidrawElement = v.union(v.null(), v.array(v.any()))

/**
 * Validator for serialized Excalidraw app state.
 * We keep the top-level value map-shaped while allowing null for older data.
 */
export const excalidrawAppState = v.union(
  v.null(),
  v.record(v.string(), v.any())
)

/**
 * Validator for BinaryFiles from Excalidraw.
 * This accepts the common structured forms plus a permissive fallback for
 * Blob-like payloads that Convex serializes differently.
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
        data: v.union(v.string(), v.bytes())
      }),
      v.any()
    )
  )
)
