import { useEffect, useRef, useCallback } from "react"
import { AppState, BinaryFiles } from "@excalidraw/excalidraw/types"
import { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"

export function useDebouncedCallback(
  callback: (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
    drawingId: string | null,
    revision: number
  ) => void,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingElementsRef = useRef<readonly OrderedExcalidrawElement[] | null>(
    null
  )
  const pendingAppStateRef = useRef<AppState | null>(null)
  const pendingFilesRef = useRef<BinaryFiles | null>(null)
  const pendingDrawingIdRef = useRef<string | null>(null)
  const pendingRevisionRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCall = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
      drawingId: string | null,
      revision: number
    ) => {
      // Store the latest values along with the drawingId
      pendingElementsRef.current = elements
      pendingAppStateRef.current = appState
      pendingFilesRef.current = files
      pendingDrawingIdRef.current = drawingId
      pendingRevisionRef.current = revision

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        if (
          pendingElementsRef.current &&
          pendingAppStateRef.current &&
          pendingFilesRef.current &&
          pendingDrawingIdRef.current !== null
        ) {
          callback(
            pendingElementsRef.current,
            pendingAppStateRef.current,
            pendingFilesRef.current,
            pendingDrawingIdRef.current,
            pendingRevisionRef.current
          )
          pendingElementsRef.current = null
          pendingAppStateRef.current = null
          pendingFilesRef.current = null
          pendingDrawingIdRef.current = null
          pendingRevisionRef.current = 0
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
      pendingFilesRef.current &&
      pendingDrawingIdRef.current !== null
    ) {
      callback(
        pendingElementsRef.current,
        pendingAppStateRef.current,
        pendingFilesRef.current,
        pendingDrawingIdRef.current,
        pendingRevisionRef.current
      )
      pendingElementsRef.current = null
      pendingAppStateRef.current = null
      pendingFilesRef.current = null
      pendingDrawingIdRef.current = null
      pendingRevisionRef.current = 0
    }
  }, [callback])

  return { debouncedCall, flush }
}
