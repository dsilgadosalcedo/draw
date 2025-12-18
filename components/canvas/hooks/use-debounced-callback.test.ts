import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useDebouncedCallback } from "./use-debounced-callback"
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types"
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import React from "react"

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    // Reset timers
    if (typeof globalThis !== "undefined" && globalThis.setTimeout) {
      // Timers are handled by Bun's test runner
    }
  })

  afterEach(() => {
    // Cleanup handled by Bun
  })

  it("should debounce callback calls", async () => {
    const callback = mock(() => Promise.resolve())
    const { result } = renderHook(() => useDebouncedCallback(callback, 100))

    const elements: readonly OrderedExcalidrawElement[] = []
    const appState = {} as AppState
    const files = {} as BinaryFiles
    const drawingId = "test-id"

    // Call multiple times rapidly
    act(() => {
      result.current.debouncedCall(elements, appState, files, drawingId)
      result.current.debouncedCall(elements, appState, files, drawingId)
      result.current.debouncedCall(elements, appState, files, drawingId)
    })

    // Callback should not be called immediately
    expect(callback).not.toHaveBeenCalled()

    // Wait for debounce
    await waitFor(
      () => {
        expect(callback).toHaveBeenCalled()
      },
      { timeout: 200 }
    )

    // Callback should be called once after debounce
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(elements, appState, files, drawingId)
  })

  it("should flush pending calls immediately", () => {
    const callback = mock(() => Promise.resolve())
    const { result } = renderHook(() => useDebouncedCallback(callback, 1000))

    const elements: readonly OrderedExcalidrawElement[] = []
    const appState = {} as AppState
    const files = {} as BinaryFiles
    const drawingId = "test-id"

    act(() => {
      result.current.debouncedCall(elements, appState, files, drawingId)
    })

    // Flush should call immediately
    act(() => {
      result.current.flush()
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(elements, appState, files, drawingId)
  })

  it("should cleanup on unmount", async () => {
    const callback = mock(() => Promise.resolve())
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 100)
    )

    const elements: readonly OrderedExcalidrawElement[] = []
    const appState = {} as AppState
    const files = {} as BinaryFiles
    const drawingId = "test-id"

    act(() => {
      result.current.debouncedCall(elements, appState, files, drawingId)
    })

    unmount()

    // Wait a bit to ensure callback doesn't fire after unmount
    await new Promise((resolve) => setTimeout(resolve, 200))

    // After unmount, callback should not be called
    expect(callback).not.toHaveBeenCalled()
  })

  it("should use latest values when callback executes", async () => {
    const callback = mock(() => Promise.resolve())
    const { result } = renderHook(() => useDebouncedCallback(callback, 100))

    const elements1: readonly OrderedExcalidrawElement[] = []
    const elements2: readonly OrderedExcalidrawElement[] = []
    const appState = {} as AppState
    const files = {} as BinaryFiles
    const drawingId = "test-id"

    act(() => {
      result.current.debouncedCall(elements1, appState, files, drawingId)
    })

    // Call again with different values before timeout
    act(() => {
      result.current.debouncedCall(elements2, appState, files, drawingId)
    })

    await waitFor(
      () => {
        expect(callback).toHaveBeenCalled()
      },
      { timeout: 200 }
    )

    // Should use latest values
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(elements2, appState, files, drawingId)
  })
})
