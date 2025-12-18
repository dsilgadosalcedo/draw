import { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"

// Type for JSON-serializable AppState (after serialization)
export type SerializedAppState = {
  [key: string]: unknown
}

// Type for the drawing data returned from Convex
export type DrawingData = {
  _id: string
  _creationTime: number
  userId: string
  drawingId: string
  name: string
  elements: readonly OrderedExcalidrawElement[] | null
  appState: SerializedAppState | null
  files?: Record<string, string> // Map of fileId -> URL
} | null

export type EditableNameBadgeProps = {
  drawingId?: string | null
  name?: string | null
  theme?: "light" | "dark"
}
