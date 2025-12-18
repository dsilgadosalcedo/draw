import { describe, it, expect } from "bun:test"
import {
  serializeAppState,
  deserializeAppState,
  serializeValue,
  deserializeValue
} from "./serialization"
import type { AppState } from "@excalidraw/excalidraw/types"

describe("serialization", () => {
  describe("serializeValue", () => {
    it("should handle null and undefined", () => {
      expect(serializeValue(null)).toBe(null)
      expect(serializeValue(undefined)).toBe(undefined)
    })

    it("should serialize Set to array", () => {
      const set = new Set([1, 2, 3])
      const result = serializeValue(set)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([1, 2, 3])
    })

    it("should serialize Map to object", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"]
      ])
      const result = serializeValue(map)
      expect(typeof result).toBe("object")
      expect(result).toEqual({
        key1: "value1",
        key2: "value2"
      })
    })

    it("should serialize arrays", () => {
      const arr = [1, 2, { nested: "value" }]
      const result = serializeValue(arr)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([1, 2, { nested: "value" }])
    })

    it("should serialize nested objects", () => {
      const obj = {
        level1: {
          level2: {
            value: "test"
          }
        }
      }
      const result = serializeValue(obj)
      expect(result).toEqual(obj)
    })

    it("should handle primitive values", () => {
      expect(serializeValue(42)).toBe(42)
      expect(serializeValue("string")).toBe("string")
      expect(serializeValue(true)).toBe(true)
    })
  })

  describe("deserializeValue", () => {
    it("should handle null and undefined", () => {
      expect(deserializeValue(null)).toBe(null)
      expect(deserializeValue(undefined)).toBe(undefined)
    })

    it("should deserialize followedBy array to Set", () => {
      const arr = [1, 2, 3]
      const obj = { followedBy: arr, other: "value" }
      const result = deserializeValue(obj) as Record<string, unknown>
      expect(result.followedBy).toBeInstanceOf(Set)
      expect(Array.from(result.followedBy as Set<unknown>)).toEqual([1, 2, 3])
    })

    it("should remove collaborators field", () => {
      const obj = { collaborators: { user1: "data" }, other: "value" }
      const result = deserializeValue(obj) as Record<string, unknown>
      expect(result.collaborators).toBeUndefined()
      expect(result.other).toBe("value")
    })

    it("should deserialize arrays", () => {
      const arr = [1, 2, 3]
      const result = deserializeValue(arr)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([1, 2, 3])
    })

    it("should handle nested structures", () => {
      const obj = {
        level1: {
          level2: {
            value: "test"
          }
        }
      }
      const result = deserializeValue(obj)
      expect(result).toEqual(obj)
    })
  })

  describe("serializeAppState", () => {
    it("should serialize AppState with Map", () => {
      const appState: Partial<AppState> = {
        viewBackgroundColor: "#ffffff",
        gridSize: 20
      }
      const result = serializeAppState(appState as AppState)
      expect(result).toBeDefined()
      expect(typeof result).toBe("object")
    })

    it("should handle null AppState", () => {
      const result = serializeAppState(null)
      expect(result).toBe(null)
    })

    it("should handle undefined AppState", () => {
      const result = serializeAppState(undefined)
      expect(result).toBe(undefined)
    })

    it("should serialize AppState with Set", () => {
      const appState: Partial<AppState> = {
        viewBackgroundColor: "#ffffff",
        followedBy: new Set(["user1", "user2"])
      }
      const result = serializeAppState(appState as AppState)
      expect(result).toBeDefined()
      if (result && typeof result === "object") {
        expect(
          Array.isArray((result as { followedBy?: unknown }).followedBy)
        ).toBe(true)
      }
    })
  })

  describe("deserializeAppState", () => {
    it("should deserialize AppState with followedBy Set", () => {
      const serialized = {
        viewBackgroundColor: "#ffffff",
        followedBy: [1, 2, 3],
        other: "value"
      }
      const result = deserializeAppState(serialized)
      expect(result).toBeDefined()
      if (result && typeof result === "object") {
        expect((result as { followedBy?: unknown }).followedBy).toBeInstanceOf(
          Set
        )
      }
    })

    it("should remove collaborators from deserialized AppState", () => {
      const serialized = {
        viewBackgroundColor: "#ffffff",
        collaborators: { user1: "data" },
        other: "value"
      }
      const result = deserializeAppState(serialized)
      expect(result).toBeDefined()
      if (result && typeof result === "object") {
        expect(
          (result as { collaborators?: unknown }).collaborators
        ).toBeUndefined()
      }
    })

    it("should handle null AppState", () => {
      const result = deserializeAppState(null)
      expect(result).toBe(null)
    })

    it("should handle undefined AppState", () => {
      const result = deserializeAppState(undefined)
      expect(result).toBe(undefined)
    })
  })
})
