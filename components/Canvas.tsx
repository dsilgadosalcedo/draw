"use client"

import { useConvexAuth, useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { useEffect, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import "@excalidraw/excalidraw/index.css"
import { useDrawing } from "../context/DrawingContext"

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
  callback: (elements: readonly any[], appState: any) => void,
  delay: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (elements: readonly any[], appState: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(elements, appState)
    }, delay)
  }
}

export default function Canvas() {
  const { isAuthenticated } = useConvexAuth()
  const { currentDrawingId: drawingId } = useDrawing()
  const saveDrawing = useMutation(api.drawings.save)

  // Query drawing data if we have an ID
  const drawing = useQuery(
    api.drawings.get,
    drawingId && isAuthenticated ? { drawingId } : "skip"
  )

  // Debounced handler that performs the save mutation
  const handleSave = useDebouncedCallback((elements, appState) => {
    if (isAuthenticated && drawingId) {
      const serializedAppState = serializeAppState(appState)
      void saveDrawing({
        drawingId,
        elements,
        appState: serializedAppState
      }).catch((err) => console.error("Failed to auto-save drawing:", err))
    }
  }, 1000)

  // Compute initial data - show empty canvas immediately, inject data when available
  const initialData = useMemo(() => {
    // If we have drawing data, use it
    if (drawing !== undefined && drawing !== null) {
      const deserializedAppState = deserializeAppState(drawing.appState)

      // Remove collaborators to prevent Map vs Object crash
      let cleanAppState = deserializedAppState
      if (deserializedAppState && typeof deserializedAppState === "object") {
        cleanAppState = { ...deserializedAppState }
        delete cleanAppState.collaborators
      }

      return {
        elements: drawing.elements ?? null,
        appState: cleanAppState ?? { viewBackgroundColor: "#ffffff" },
        scrollToContent: true
      }
    }

    // Otherwise, show empty canvas
    return {
      elements: null,
      appState: { viewBackgroundColor: "#ffffff" },
      scrollToContent: true
    }
  }, [drawing])

  // --- Render Logic ---

  // Display placeholder if authenticated but no drawing is currently selected/loaded
  if (!isAuthenticated || !drawingId) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-slate-900">
        <p className="text-xl text-gray-500 dark:text-slate-400">
          Select a drawing or create a new one.
        </p>
      </div>
    )
  }

  // Use a key that includes both drawingId and whether we have data
  // This ensures we re-initialize when switching drawings, and also when data arrives
  // When drawingId changes, show empty canvas immediately
  // When data arrives, re-initialize with the loaded data
  const canvasKey =
    drawing !== undefined && drawing !== null
      ? `${drawingId}-loaded`
      : `${drawingId}-empty`

  return (
    <div className="h-full w-full">
      <Excalidraw
        key={canvasKey}
        initialData={initialData}
        onChange={handleSave}
      />
    </div>
  )
}
