"use client"

import { useAction, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useEffect, useRef, useMemo, useCallback, useState } from "react"
import dynamic from "next/dynamic"
import "@excalidraw/excalidraw/index.css"
import { useDrawing } from "../../../context/drawing-context"
import { AppState, BinaryFiles } from "@excalidraw/excalidraw/types"
import { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import { cn } from "@/lib/utils"
import { type DrawingData } from "../types"
import { serializeAppState, deserializeAppState } from "../utils/serialization"
import { useDebouncedCallback } from "../hooks/use-debounced-callback"
import { loadFiles } from "../utils/file-loader"
import { EditableNameBadge } from "./editable-name-badge"
import { ErrorBoundary } from "@/components/error-boundary"
import { reportError, getConvexErrorMessage } from "@/lib/error-handling"

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
)

export default function Canvas() {
  const { currentDrawingId: drawingId } = useDrawing()
  const saveDrawing = useAction(api.drawings.saveWithFiles)
  // Track the current drawing ID to detect drawing changes
  const lastDrawingIdRef = useRef<string | null>(null)
  // Track the last loaded drawing data to show while new drawing loads
  const lastDrawingDataRef = useRef<{
    drawingId: string | null
    data: DrawingData
  }>({
    drawingId: null,
    data: null
  })

  // State for dual Excalidraw instances with crossfade
  const [drawing01, setDrawing01] = useState<{
    drawingId: string | null
    data: DrawingData
  } | null>(null)
  const [drawing02, setDrawing02] = useState<{
    drawingId: string | null
    data: DrawingData
  } | null>(null)
  const [beforeAppearingBox01Fade, setBeforeAppearingBox01Fade] = useState<
    boolean | null
  >(null)
  const [beforeAppearingBox02Fade, setBeforeAppearingBox02Fade] = useState<
    boolean | null
  >(null)
  const [fadingOutBox02, setFadingOutBox02] = useState(false)
  const [fadingOutBox01, setFadingOutBox01] = useState(false)
  const [initialFadeInBox01, setInitialFadeInBox01] = useState(false)
  const [drawingTheme01, setDrawingTheme01] = useState<"light" | "dark">("dark")
  const [drawingTheme02, setDrawingTheme02] = useState<"light" | "dark">("dark")

  // Refs to track current box states without causing effect re-runs
  const drawing01Ref = useRef(drawing01)
  const drawing02Ref = useRef(drawing02)
  // Ref to track the current fade timeout so we can cancel it if a new transition starts
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Keep refs in sync with state
  useEffect(() => {
    drawing01Ref.current = drawing01
  }, [drawing01])

  useEffect(() => {
    drawing02Ref.current = drawing02
  }, [drawing02])

  // Query drawing data if we have an ID
  const drawing = useQuery(api.drawings.get, drawingId ? { drawingId } : "skip")

  // Update last loaded drawing data when drawing loads for the current drawingId
  useEffect(() => {
    if (drawing !== undefined && drawingId) {
      lastDrawingDataRef.current = { drawingId, data: drawing }
    }
  }, [drawing, drawingId])

  // Handle drawing transitions with crossfade animation
  // Note: We intentionally set state synchronously here to ensure the new drawing
  // is rendered behind (z-10) before starting the fade animation on the old drawing.
  // This is necessary for the crossfade transition to work correctly.
  // The linter warning about setState in effects is expected and acceptable here.
  useEffect(() => {
    // Only proceed if drawing is loaded (not undefined) and we have a drawingId
    if (drawing === undefined || !drawingId) {
      return
    }

    // Skip if this drawing is already displayed in one of the boxes AND the data hasn't changed
    // Use refs to get current values without triggering effect re-runs
    const existingIn01 = drawing01Ref.current?.drawingId === drawingId
    const existingIn02 = drawing02Ref.current?.drawingId === drawingId

    // If drawing exists in a box, update it with new data (e.g., when name changes from undefined to "Drawing")
    if (existingIn01) {
      setDrawing01({ drawingId, data: drawing })
      return
    }

    if (existingIn02) {
      setDrawing02({ drawingId, data: drawing })
      return
    }

    const newDrawingData = { drawingId, data: drawing }

    // Cancel any pending fade timeout from a previous transition
    // This prevents race conditions when switching quickly
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
      // Reset fade states that might be stuck from previous transition
      // This ensures clean state for the new transition
      // Using setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setFadingOutBox01(false)
        setFadingOutBox02(false)
        setBeforeAppearingBox01Fade(null)
        setBeforeAppearingBox02Fade(null)
        setInitialFadeInBox01(false)
      }, 0)
    }

    // Check if drawing01 is occupied (use refs to avoid dependency issues)
    const isBox01Occupied = drawing01Ref.current !== null

    if (!isBox01Occupied) {
      // Box 01 is empty, use it for the new drawing
      // Step 1 & 2: Set state synchronously using React's automatic batching
      // Set beforeAppearingBox01Fade to true (will render with z-10, behind)
      // and set the loaded drawing to box 01
      setInitialFadeInBox01(drawing02Ref.current === null)
      setBeforeAppearingBox01Fade(true)
      setDrawing01(newDrawingData)

      // Step 3: If drawing02 exists, fade it out
      if (drawing02Ref.current !== null) {
        // Start fade out animation on drawing02 (it stays at z-20 but fades out)
        setFadingOutBox02(true)

        // Step 4: After fade completes, clean up
        fadeTimeoutRef.current = setTimeout(() => {
          // After drawing02 fades out completely:
          // - Set beforeAppearingBox01Fade to null (box01 gets z-20 and becomes visible)
          // - Set drawing02 to null (make it available for next drawing)
          setBeforeAppearingBox01Fade(null)
          setDrawing02(null)
          setBeforeAppearingBox02Fade(null)
          setFadingOutBox02(false)
          fadeTimeoutRef.current = null
        }, 500) // Match the CSS transition duration

        return () => {
          if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current)
            fadeTimeoutRef.current = null
          }
        }
      } else {
        // No drawing02 to fade, immediately make box01 visible
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setBeforeAppearingBox01Fade(null)
          setInitialFadeInBox01(false)
        }, 500)
      }
    } else {
      // Box 01 is occupied, use box 02
      setInitialFadeInBox01(false)
      // Step 1 & 2: Set state synchronously using React's automatic batching
      // Set beforeAppearingBox02Fade to true (will render with z-10, behind)
      // and set the loaded drawing to box 02
      setBeforeAppearingBox02Fade(true)
      setDrawing02(newDrawingData)

      // Step 3: Fade out drawing01
      if (drawing01Ref.current !== null) {
        // Start fade out animation on drawing01 (it stays at z-20 but fades out)
        setFadingOutBox01(true)

        // Step 4: After fade completes, clean up
        fadeTimeoutRef.current = setTimeout(() => {
          // After drawing01 fades out completely:
          // - Set beforeAppearingBox02Fade to null (box02 gets z-20 and becomes visible)
          // - Set drawing01 to null (make it available for next drawing)
          setBeforeAppearingBox02Fade(null)
          setDrawing01(null)
          setBeforeAppearingBox01Fade(null)
          setFadingOutBox01(false)
          fadeTimeoutRef.current = null
        }, 500) // Match the CSS transition duration

        return () => {
          if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current)
            fadeTimeoutRef.current = null
          }
        }
      } else {
        // No drawing01 to fade, immediately make box02 visible
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setBeforeAppearingBox02Fade(null)
        }, 0)
      }
    }
    // Note: We intentionally exclude drawing01 and drawing02 from dependencies
    // to prevent the effect from re-running when we update them, which would
    // cancel the fade timeout before it can complete.
    // We use refs (drawing01Ref, drawing02Ref) to access current values instead.
  }, [drawing, drawingId])

  // Debounced handler that performs the save mutation
  const { debouncedCall: handleSave, flush: flushSave } = useDebouncedCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
      idToSave: string | null
    ) => {
      if (idToSave) {
        const serializedAppState = serializeAppState(appState)
        void saveDrawing({
          drawingId: idToSave,
          elements,
          appState: serializedAppState,
          files
        }).catch((err) => {
          const errorMessage = getConvexErrorMessage(err)
          reportError(err)
          console.error("Failed to auto-save drawing:", errorMessage)
        })
      }
    },
    1000
  )

  // Flush pending saves when drawing changes
  useEffect(() => {
    const previousDrawingId = lastDrawingIdRef.current
    if (previousDrawingId && previousDrawingId !== drawingId) {
      // Drawing is about to change, flush any pending saves for the previous drawing
      flushSave()
    }
    lastDrawingIdRef.current = drawingId
  }, [drawingId, flushSave])

  // Create change handlers for each box that capture the correct drawingId
  const handleChange01 = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (drawing01?.drawingId) {
        handleSave(elements, appState, files, drawing01.drawingId)
        if (appState.theme) {
          setDrawingTheme01(appState.theme === "light" ? "light" : "dark")
        }
      }
    },
    [drawing01, handleSave]
  )

  const handleChange02 = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (drawing02?.drawingId) {
        handleSave(elements, appState, files, drawing02.drawingId)
        if (appState.theme) {
          setDrawingTheme02(appState.theme === "light" ? "light" : "dark")
        }
      }
    },
    [drawing02, handleSave]
  )

  // State to store loaded files for each drawing
  const [files01, setFiles01] = useState<BinaryFiles | undefined>(undefined)
  const [files02, setFiles02] = useState<BinaryFiles | undefined>(undefined)

  // Load files when drawing data changes
  useEffect(() => {
    if (drawing01?.data?.files) {
      loadFiles(drawing01.data.files)
        .then((files) => {
          setFiles01(files)
        })
        .catch((err) => {
          reportError(err)
          console.error("Failed to load files for drawing 01:", err)
          // Set empty files on error to allow drawing to render
          setFiles01({})
        })
    } else {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setFiles01(undefined)
      }, 0)
    }
  }, [drawing01?.data?.files, drawing01?.drawingId])

  useEffect(() => {
    if (drawing02?.data?.files) {
      loadFiles(drawing02.data.files)
        .then((files) => {
          setFiles02(files)
        })
        .catch((err) => {
          reportError(err)
          console.error("Failed to load files for drawing 02:", err)
          // Set empty files on error to allow drawing to render
          setFiles02({})
        })
    } else {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setFiles02(undefined)
      }, 0)
    }
  }, [drawing02?.data?.files, drawing02?.drawingId])

  // Helper to compute initial data for a specific drawing
  const computeInitialData = useCallback(
    (drawingData: DrawingData | null, files?: BinaryFiles) => {
      const defaultCanvasTheme: "light" | "dark" = "dark"

      if (drawingData !== null && drawingData !== undefined) {
        const deserializedAppState = deserializeAppState(drawingData.appState)

        // Remove collaborators to prevent Map vs Object crash
        let cleanAppState: Partial<AppState> = deserializedAppState || {}
        if (deserializedAppState && typeof deserializedAppState === "object") {
          cleanAppState = { ...deserializedAppState }
          delete (cleanAppState as { collaborators?: unknown }).collaborators
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
          elements: drawingData.elements ?? null,
          appState: cleanAppState,
          files,
          scrollToContent: true
        }
      }

      // Otherwise, show empty canvas with default theme
      return {
        elements: null,
        appState: {
          theme: defaultCanvasTheme
        },
        scrollToContent: true
      }
    },
    []
  )

  // Compute initial data for each box
  const initialData01 = useMemo(
    () => computeInitialData(drawing01?.data ?? null, files01),
    [drawing01, files01, computeInitialData]
  )
  const initialData02 = useMemo(
    () => computeInitialData(drawing02?.data ?? null, files02),
    [drawing02, files02, computeInitialData]
  )

  const keyWithFiles = useCallback(
    (drawingId: string | null, files?: BinaryFiles) => {
      const version =
        files && Object.keys(files).length > 0
          ? `files-${Object.keys(files).sort().join("-")}`
          : "nofiles"
      return drawingId ? `${drawingId}-${version}` : "empty"
    },
    []
  )

  const isReadyWithFiles = useCallback(
    (
      drawingEntry: { data: DrawingData } | null,
      files?: BinaryFiles
    ): boolean => {
      const urls = drawingEntry?.data?.files
      if (!urls || Object.keys(urls).length === 0) return true
      if (!files) return false
      return Object.keys(files).length === Object.keys(urls).length
    },
    []
  )

  const getDrawingTheme = useCallback(
    (drawingData?: DrawingData | null): "light" | "dark" => {
      const theme = (
        drawingData?.appState as { theme?: "light" | "dark" } | undefined
      )?.theme
      return theme === "light" ? "light" : "dark"
    },
    []
  )

  // Keep theme state in sync when a drawing loads or changes
  // Using useMemo to derive theme instead of setState in effect
  const computedTheme01 = useMemo(
    () => getDrawingTheme(drawing01?.data),
    [drawing01?.data, getDrawingTheme]
  )
  const computedTheme02 = useMemo(
    () => getDrawingTheme(drawing02?.data),
    [drawing02?.data, getDrawingTheme]
  )

  // Sync computed themes to state when they change
  useEffect(() => {
    setDrawingTheme01(computedTheme01)
  }, [computedTheme01])

  useEffect(() => {
    setDrawingTheme02(computedTheme02)
  }, [computedTheme02])

  return (
    <ErrorBoundary>
      <div className="h-full w-full relative">
        {/* drawing box 01 */}
        {drawing01 && isReadyWithFiles(drawing01, files01) && (
          <div
            className={cn(
              "absolute top-0 left-0 h-full w-full transition-opacity duration-500",
              initialFadeInBox01
                ? "z-20 opacity-0"
                : beforeAppearingBox01Fade === true
                  ? "z-10 opacity-100"
                  : fadingOutBox01
                    ? "z-20 opacity-0"
                    : "z-20 opacity-100"
            )}
          >
            <EditableNameBadge
              key={`${drawing01.drawingId ?? "drawing-01"}-${drawing01.data?.name ?? "unnamed"}`}
              drawingId={drawing01.drawingId}
              name={drawing01.data?.name}
              theme={drawingTheme01}
            />
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Failed to load drawing. Please try refreshing.
                  </p>
                </div>
              }
            >
              <Excalidraw
                key={keyWithFiles(drawing01.drawingId, files01)}
                initialData={initialData01}
                onChange={handleChange01}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* drawing box 02 */}
        {drawing02 && isReadyWithFiles(drawing02, files02) && (
          <div
            className={cn(
              "absolute top-0 left-0 h-full w-full transition-opacity duration-500",
              beforeAppearingBox02Fade === true
                ? "z-10 opacity-100"
                : fadingOutBox02
                  ? "z-20 opacity-0"
                  : "z-20 opacity-100"
            )}
          >
            <EditableNameBadge
              key={`${drawing02.drawingId ?? "drawing-02"}-${drawing02.data?.name ?? "unnamed"}`}
              drawingId={drawing02.drawingId}
              name={drawing02.data?.name}
              theme={drawingTheme02}
            />
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Failed to load drawing. Please try refreshing.
                  </p>
                </div>
              }
            >
              <Excalidraw
                key={keyWithFiles(drawing02.drawingId, files02)}
                initialData={initialData02}
                onChange={handleChange02}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
