import { AppState } from "@excalidraw/excalidraw/types"
import { type SerializedAppState } from "../types"

// Helper function to serialize any value (handles nested structures)
export function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (value instanceof Set) {
    return Array.from(value).map(serializeValue)
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([k, v]) => [k, serializeValue(v)])
    )
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }

  if (typeof value === "object") {
    const serialized: SerializedAppState = {}
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        serialized[key] = serializeValue(
          (value as Record<string, unknown>)[key]
        )
      }
    }
    return serialized
  }

  return value
}

export function serializeAppState(
  appState: AppState | null | undefined
): SerializedAppState | null | undefined {
  const serialized = serializeValue(appState)
  return serialized as SerializedAppState | null | undefined
}

// Helper function to deserialize any value (handles nested structures)
export function deserializeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(deserializeValue)
  }

  if (typeof value === "object") {
    const deserialized: Record<string, unknown> = {}
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const val = (value as Record<string, unknown>)[key]
        // Convert followedBy back to Set if it's an array
        if (key === "followedBy" && Array.isArray(val)) {
          deserialized[key] = new Set(val.map(deserializeValue))
        } else if (key === "collaborators") {
          // Remove collaborators to prevent Map vs Object crash
          deserialized[key] = undefined
        } else {
          deserialized[key] = deserializeValue(val)
        }
      }
    }
    return deserialized
  }

  return value
}

export function deserializeAppState(
  appState: SerializedAppState | null | undefined
): Partial<AppState> | null | undefined {
  const deserialized = deserializeValue(appState)
  return deserialized as Partial<AppState> | null | undefined
}
