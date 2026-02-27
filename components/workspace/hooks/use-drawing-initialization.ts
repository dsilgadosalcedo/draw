"use client"

import { useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useDrawing } from "../../../context/drawing-context"

export function useDrawingInitialization() {
  const { currentDrawingId, setCurrentDrawingId, isHydrated } = useDrawing()
  const shouldInitialize = isHydrated && !currentDrawingId
  const latestDrawingId = useQuery(
    api.drawings.getLatest,
    shouldInitialize ? {} : "skip"
  )
  const allDrawings = useQuery(
    api.drawings.list,
    shouldInitialize ? {} : "skip"
  )

  useEffect(() => {
    // Only initialize if we have data and no current drawing ID
    if (!shouldInitialize) {
      return
    }

    if (latestDrawingId !== undefined && allDrawings !== undefined) {
      // If there are drawings but all are in folders, start a new uncategorized drawing
      const hasUncategorized = allDrawings.some((d) => !d.folderId)

      if (!hasUncategorized) {
        setCurrentDrawingId(crypto.randomUUID())
        return
      }

      if (latestDrawingId) {
        // Found previous work -> Load it
        setCurrentDrawingId(latestDrawingId)
      } else {
        // No previous work -> Create new ID and set it (Canvas will auto-insert on save)
        setCurrentDrawingId(crypto.randomUUID())
      }
    }
  }, [allDrawings, latestDrawingId, setCurrentDrawingId, shouldInitialize])
}
