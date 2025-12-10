"use client"

import { useConvexAuth, useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { useEffect, useRef, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import "@excalidraw/excalidraw/index.css"
import { useDrawing } from "../context/DrawingContext"
import Connecting from "./Connecting"
import { useTheme } from "next-themes"

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
  const { theme: currentTheme, resolvedTheme, setTheme } = useTheme()

  // Track if we're initializing to prevent theme syncs during initialization
  const isInitializingRef = useRef(true)
  // Track the last theme we synced FROM Excalidraw TO next-themes to prevent loops
  const lastSyncedFromExcalidrawRef = useRef<string | null>(null)
  // Track the current drawing ID to detect drawing changes
  const lastDrawingIdRef = useRef<string | null>(null)

  // Query drawing data if we have an ID
  const drawing = useQuery(
    api.drawings.get,
    drawingId && isAuthenticated ? { drawingId } : "skip"
  )

  // Reset initialization flag when drawing changes
  useEffect(() => {
    if (drawingId !== lastDrawingIdRef.current) {
      lastDrawingIdRef.current = drawingId
      isInitializingRef.current = true
      lastSyncedFromExcalidrawRef.current = null
    }
  }, [drawingId])

  // Mark initialization as complete once drawing data is loaded and theme is resolved
  useEffect(() => {
    if (isInitializingRef.current && resolvedTheme && drawing !== undefined) {
      // Small delay to ensure Excalidraw has initialized with correct theme
      const timer = setTimeout(() => {
        isInitializingRef.current = false
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [drawing, resolvedTheme])

  // Sync theme from Excalidraw appState to next-themes (only when user explicitly changes it)
  const syncThemeToPage = useCallback(
    (appState: any) => {
      // Don't sync during initialization - only sync when user explicitly changes theme
      if (isInitializingRef.current || !appState?.theme) {
        return
      }

      const excalidrawTheme = appState.theme === "dark" ? "dark" : "light"
      // Only sync if the theme actually changed and it's different from what we last synced
      if (
        lastSyncedFromExcalidrawRef.current !== excalidrawTheme &&
        currentTheme !== excalidrawTheme
      ) {
        lastSyncedFromExcalidrawRef.current = excalidrawTheme
        setTheme(excalidrawTheme)
      }
    },
    [setTheme, currentTheme]
  )

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

  // Handler that syncs theme immediately and saves with debounce
  const handleChange = (elements: readonly any[], appState: any) => {
    // Sync theme immediately (not debounced) so UI updates right away
    syncThemeToPage(appState)

    // Save with debounce, passing the current drawingId
    handleSave(elements, appState, drawingId)
  }

  // Compute initial data - show empty canvas immediately, inject data when available
  // Always use next-themes theme, ignoring saved theme from drawing
  const initialData = useMemo(() => {
    // Always use resolvedTheme or currentTheme from next-themes provider
    const themeToUse: "light" | "dark" =
      resolvedTheme === "dark"
        ? "dark"
        : resolvedTheme === "light"
          ? "light"
          : currentTheme === "dark"
            ? "dark"
            : "light"

    // If we have drawing data, use it but override theme with next-themes theme
    if (drawing !== undefined && drawing !== null) {
      const deserializedAppState = deserializeAppState(drawing.appState)

      // Remove collaborators to prevent Map vs Object crash
      let cleanAppState = deserializedAppState
      if (deserializedAppState && typeof deserializedAppState === "object") {
        cleanAppState = { ...deserializedAppState }
        delete cleanAppState.collaborators
      }

      // Ensure theme is set in appState (always use next-themes theme, ignore saved theme)
      if (!cleanAppState || typeof cleanAppState !== "object") {
        cleanAppState = {}
      }
      cleanAppState.theme = themeToUse

      return {
        elements: drawing.elements ?? null,
        appState: cleanAppState,
        scrollToContent: true
      }
    }

    // Otherwise, show empty canvas with next-themes theme
    return {
      elements: null,
      appState: {
        viewBackgroundColor: themeToUse === "dark" ? "#1e1e1e" : "#ffffff",
        theme: themeToUse
      },
      scrollToContent: true
    }
  }, [drawing, resolvedTheme, currentTheme])

  // Determine effective theme for key (to force remount when theme changes)
  // Always use next-themes theme, ignoring saved theme from drawing
  // Must be computed before early returns
  const effectiveTheme = useMemo(() => {
    return resolvedTheme || currentTheme || "light"
  }, [resolvedTheme, currentTheme])

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

  // Don't render Excalidraw until theme is resolved to prevent theme flickering
  if (!resolvedTheme) {
    return <Connecting />
  }

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
