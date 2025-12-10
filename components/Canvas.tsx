"use client"

import { useConvexAuth, useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { useEffect, useRef, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import "@excalidraw/excalidraw/index.css"
import { useDrawing } from "../context/DrawingContext"
import Connecting from "./Connecting"

function serializeAppState(appState: any): any {
  if (appState === null || appState === undefined) {
    return appState
  }

  if (appState instanceof Set) {
    return Array.from(appState)
  }

  if (appState instanceof Map) {
    return Object.fromEntries(appState)
  }

  if (Array.isArray(appState)) {
    return appState.map(serializeAppState)
  }

  if (typeof appState === "object") {
    const serialized: any = {}
    for (const key in appState) {
      if (Object.prototype.hasOwnProperty.call(appState, key)) {
        serialized[key] = serializeAppState(appState[key])
      }
    }
    return serialized
  }

  return appState
}

function deserializeAppState(appState: any): any {
  if (appState === null || appState === undefined) {
    return appState
  }

  if (Array.isArray(appState)) {
    return appState.map(deserializeAppState)
  }

  if (typeof appState === "object") {
    const deserialized: any = {}
    for (const key in appState) {
      if (Object.prototype.hasOwnProperty.call(appState, key)) {
        // Convert followedBy back to Set if it's an array
        if (key === "followedBy" && Array.isArray(appState[key])) {
          deserialized[key] = new Set(appState[key])
        } else if (key === "collaborators") {
          // Remove collaborators to prevent Map vs Object crash
          deserialized[key] = undefined
        } else {
          deserialized[key] = deserializeAppState(appState[key])
        }
      }
    }
    return deserialized
  }

  return appState
}

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
)

function useDebouncedCallback(
  callback: (
    elements: readonly any[],
    appState: any,
    drawingId: string | null
  ) => void,
  delay: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingElementsRef = useRef<readonly any[] | null>(null)
  const pendingAppStateRef = useRef<any>(null)
  const pendingDrawingIdRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCall = useCallback(
    (elements: readonly any[], appState: any, drawingId: string | null) => {
      // Store the latest values along with the drawingId
      pendingElementsRef.current = elements
      pendingAppStateRef.current = appState
      pendingDrawingIdRef.current = drawingId

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        if (
          pendingElementsRef.current &&
          pendingAppStateRef.current &&
          pendingDrawingIdRef.current !== null
        ) {
          callback(
            pendingElementsRef.current,
            pendingAppStateRef.current,
            pendingDrawingIdRef.current
          )
          pendingElementsRef.current = null
          pendingAppStateRef.current = null
          pendingDrawingIdRef.current = null
        }
      }, delay)
    },
    [callback, delay]
  )

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (
      pendingElementsRef.current &&
      pendingAppStateRef.current &&
      pendingDrawingIdRef.current !== null
    ) {
      callback(
        pendingElementsRef.current,
        pendingAppStateRef.current,
        pendingDrawingIdRef.current
      )
      pendingElementsRef.current = null
      pendingAppStateRef.current = null
      pendingDrawingIdRef.current = null
    }
  }, [callback])

  return { debouncedCall, flush }
}

export default function Canvas() {
  const { isAuthenticated } = useConvexAuth()
  const { currentDrawingId: drawingId } = useDrawing()
  const saveDrawing = useMutation(api.drawings.save)
  // Track the current drawing ID to detect drawing changes
  const lastDrawingIdRef = useRef<string | null>(null)

  // Query drawing data if we have an ID
  const drawing = useQuery(
    api.drawings.get,
    drawingId && isAuthenticated ? { drawingId } : "skip"
  )

  // Reset when drawing changes
  useEffect(() => {
    if (drawingId !== lastDrawingIdRef.current) {
      lastDrawingIdRef.current = drawingId
    }
  }, [drawingId])

  // Theme sync removed - page theme is always dark, canvas theme is independent

  // Debounced handler that performs the save mutation
  const { debouncedCall: handleSave, flush: flushSave } = useDebouncedCallback(
    (elements, appState, idToSave) => {
      if (isAuthenticated && idToSave) {
        const serializedAppState = serializeAppState(appState)
        void saveDrawing({
          drawingId: idToSave,
          elements,
          appState: serializedAppState
        }).catch((err) => console.error("Failed to auto-save drawing:", err))
      }
    },
    1000
  )

  // Flush pending saves when drawing is about to change
  useEffect(() => {
    const previousDrawingId = lastDrawingIdRef.current
    if (previousDrawingId && previousDrawingId !== drawingId) {
      // Drawing is about to change, flush any pending saves for the previous drawing
      flushSave()
    }
  }, [drawingId, flushSave])

  // Handler that saves with debounce (theme sync removed - canvas theme is independent)
  const handleChange = (elements: readonly any[], appState: any) => {
    // Save with debounce, passing the current drawingId
    handleSave(elements, appState, drawingId)
  }

  // Compute initial data - show empty canvas immediately, inject data when available
  // Use saved theme from drawing if available, otherwise default to light
  const initialData = useMemo(() => {
    // Default theme for new drawings (canvas can be light or dark independently)
    const defaultCanvasTheme: "light" | "dark" = "light"

    // If we have drawing data, use it and preserve saved theme if it exists
    if (drawing !== undefined && drawing !== null) {
      const deserializedAppState = deserializeAppState(drawing.appState)

      // Remove collaborators to prevent Map vs Object crash
      let cleanAppState = deserializedAppState
      if (deserializedAppState && typeof deserializedAppState === "object") {
        cleanAppState = { ...deserializedAppState }
        delete cleanAppState.collaborators
      }

      // Ensure appState is an object
      if (!cleanAppState || typeof cleanAppState !== "object") {
        cleanAppState = {}
      }

      // Use saved theme if it exists, otherwise use default
      if (!cleanAppState.theme) {
        cleanAppState.theme = defaultCanvasTheme
      }

      return {
        elements: drawing.elements ?? null,
        appState: cleanAppState,
        scrollToContent: true
      }
    }

    // Otherwise, show empty canvas with default theme
    return {
      elements: null,
      appState: {
        viewBackgroundColor:
          defaultCanvasTheme === "dark" ? "#1e1e1e" : "#ffffff",
        theme: defaultCanvasTheme
      },
      scrollToContent: true
    }
  }, [drawing])

  // Determine effective theme for key (to force remount when drawing or theme changes)
  // Use saved theme from drawing if available, otherwise default to light
  // Must be computed before early returns
  const effectiveTheme = useMemo(() => {
    if (drawing?.appState) {
      const deserializedAppState = deserializeAppState(drawing.appState)
      if (deserializedAppState?.theme) {
        return deserializedAppState.theme
      }
    }
    return "light"
  }, [drawing])

  // --- Render Logic ---

  // Display placeholder if authenticated but no drawing is currently selected/loaded
  if (!isAuthenticated || !drawingId) {
    return <Connecting />
  }

  // Use a key that includes drawingId, data state, and theme
  // This ensures we re-initialize when switching drawings, when data arrives, or when theme changes
  const canvasKey =
    drawing !== undefined && drawing !== null
      ? `${drawingId}-loaded-${effectiveTheme}`
      : `${drawingId}-empty-${effectiveTheme}`

  return (
    <div className="h-full w-full">
      <Excalidraw
        key={canvasKey}
        initialData={initialData}
        onChange={handleChange}
      />
    </div>
  )
}
