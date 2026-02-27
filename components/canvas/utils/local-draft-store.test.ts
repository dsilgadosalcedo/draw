import { describe, it, expect, beforeEach } from "bun:test"
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import {
  getLocalDraft,
  saveLocalDraft,
  markLocalDraftSynced,
  pruneOldLocalDrafts
} from "./local-draft-store"

describe("local draft store", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear()
    }
  })

  it("should save and read draft values", () => {
    const drawingId = "drawing-save-read"
    const elements: readonly OrderedExcalidrawElement[] = []

    saveLocalDraft({
      drawingId,
      elements,
      appState: { theme: "dark" },
      revision: 1,
      dirty: true
    })

    const stored = getLocalDraft(drawingId)
    expect(stored?.drawingId).toBe(drawingId)
    expect(stored?.revision).toBe(1)
    expect(stored?.dirty).toBe(true)
  })

  it("should mark synced only when revision matches", () => {
    const drawingId = "drawing-mark-synced"
    const elements: readonly OrderedExcalidrawElement[] = []

    saveLocalDraft({
      drawingId,
      elements,
      appState: { theme: "dark" },
      revision: 2,
      dirty: true
    })

    markLocalDraftSynced(drawingId, 1)
    expect(getLocalDraft(drawingId)?.dirty).toBe(true)

    markLocalDraftSynced(drawingId, 2)
    expect(getLocalDraft(drawingId)?.dirty).toBe(false)
  })

  it("should prune invalid draft payloads", () => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem("draw:draft:v1:invalid", "not-json")
    pruneOldLocalDrafts()

    expect(window.localStorage.getItem("draw:draft:v1:invalid")).toBeNull()
  })
})
