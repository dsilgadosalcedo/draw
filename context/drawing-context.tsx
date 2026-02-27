"use client"

import { createContext, use, useState, ReactNode, useCallback } from "react"

interface DrawingContextType {
  currentDrawingId: string | null
  setCurrentDrawingId: (id: string | null) => void
  isHydrated: boolean
}

const DrawingContext = createContext<DrawingContextType | undefined>(undefined)

const CURRENT_DRAWING_STORAGE_KEY = "draw:currentDrawingId:v1"

export const DrawingProvider = ({ children }: { children: ReactNode }) => {
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(
    () => {
      if (typeof window === "undefined") {
        return null
      }

      const storedDrawingId = window.localStorage.getItem(
        CURRENT_DRAWING_STORAGE_KEY
      )
      if (!storedDrawingId || storedDrawingId.trim().length === 0) {
        return null
      }

      return storedDrawingId
    }
  )

  const setCurrentDrawingIdWithPersistence = useCallback(
    (id: string | null) => {
      setCurrentDrawingId(id)

      if (typeof window === "undefined") {
        return
      }

      if (id && id.trim().length > 0) {
        window.localStorage.setItem(CURRENT_DRAWING_STORAGE_KEY, id)
        return
      }

      window.localStorage.removeItem(CURRENT_DRAWING_STORAGE_KEY)
    },
    []
  )

  return (
    <DrawingContext.Provider
      value={{
        currentDrawingId,
        setCurrentDrawingId: setCurrentDrawingIdWithPersistence,
        isHydrated: true
      }}
    >
      {children}
    </DrawingContext.Provider>
  )
}

export const useDrawing = () => {
  const context = use(DrawingContext)
  if (context === undefined) {
    throw new Error("useDrawing must be used within a DrawingProvider")
  }
  return context
}
