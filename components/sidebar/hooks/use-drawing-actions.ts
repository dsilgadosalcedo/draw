import { useCallback, type KeyboardEvent } from "react"

import { type SidebarDrawing } from "../types"

/**
 * Parameters for the useDrawingActions hook
 */
type DrawingActionParams = {
  /** Current active drawing ID */
  currentDrawingId: string | null
  /** All drawings for the current user */
  allDrawings: SidebarDrawing[] | undefined
  /** Function to set the current drawing ID */
  setCurrentDrawingId: (id: string | null) => void
  /** Mutation to update drawing name */
  updateName: (args: { drawingId: string; name: string }) => Promise<unknown>
  /** Mutation to remove a drawing */
  removeDrawing: (args: { drawingId: string }) => Promise<unknown>
  /** Mutation to move drawing to a folder */
  moveDrawingToFolder: (args: {
    drawingId: string
    folderId: string | null
  }) => Promise<unknown>
  /** Function to create a new drawing */
  createNewDrawing: () => void
  /** Function to set sidebar open state */
  setIsOpen: (value: boolean) => void
  /** Current editing name value */
  editingName: string
  /** Function to set editing name */
  setEditingName: (name: string) => void
  /** Function to set editing ID */
  setEditingId: (id: string | null) => void
}

/**
 * Hook for managing drawing actions in the sidebar
 *
 * @param params - Configuration object for drawing actions
 * @returns Object containing action handlers
 *
 * @example
 * ```tsx
 * const drawingActions = useDrawingActions({
 *   currentDrawingId,
 *   allDrawings,
 *   setCurrentDrawingId,
 *   updateName,
 *   removeDrawing,
 *   // ... other params
 * })
 *
 * // Use in component
 * <button onClick={() => drawingActions.handleRemove(drawingId)}>
 *   Delete
 * </button>
 * ```
 */
export function useDrawingActions({
  currentDrawingId,
  allDrawings,
  setCurrentDrawingId,
  updateName,
  removeDrawing,
  moveDrawingToFolder,
  createNewDrawing,
  setIsOpen,
  editingName,
  setEditingName,
  setEditingId
}: DrawingActionParams) {
  const startEditing = useCallback(
    (drawingId: string, currentName: string) => {
      setEditingId(drawingId)
      setEditingName(currentName)
    },
    [setEditingId, setEditingName]
  )

  const saveName = useCallback(
    async (drawingId: string) => {
      if (editingName.trim() === "") {
        setEditingId(null)
        return
      }

      try {
        await updateName({ drawingId, name: editingName.trim() })
        setEditingId(null)
      } catch (error) {
        console.error("Failed to update name:", error)
      }
    },
    [editingName, setEditingId, updateName]
  )

  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditingName("")
  }, [setEditingId, setEditingName])

  const handleNameInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, drawingId: string) => {
      if (e.key === "Enter") {
        e.preventDefault()
        void saveName(drawingId)
      } else if (e.key === "Escape") {
        e.preventDefault()
        cancelEditing()
      }
    },
    [cancelEditing, saveName]
  )

  const handleRemove = useCallback(
    async (drawingId: string) => {
      try {
        if (drawingId === currentDrawingId) {
          const currentMetadata = allDrawings?.find(
            (drawing) => drawing.drawingId === drawingId
          )

          if (currentMetadata?.folderId) {
            const sameFolder =
              allDrawings?.filter(
                (drawing) =>
                  drawing.folderId === currentMetadata.folderId &&
                  drawing.drawingId !== drawingId
              ) ?? []

            if (sameFolder.length > 0) {
              setCurrentDrawingId(sameFolder[0].drawingId)
            } else {
              const otherUncategorized =
                allDrawings?.filter(
                  (drawing) =>
                    !drawing.folderId && drawing.drawingId !== drawingId
                ) ?? []

              if (otherUncategorized.length > 0) {
                setCurrentDrawingId(otherUncategorized[0].drawingId)
              } else {
                createNewDrawing()
              }
            }
          } else {
            const otherUncategorized =
              allDrawings?.filter(
                (drawing) =>
                  !drawing.folderId && drawing.drawingId !== drawingId
              ) ?? []

            if (otherUncategorized.length > 0) {
              setCurrentDrawingId(otherUncategorized[0].drawingId)
            } else {
              createNewDrawing()
            }
          }
        }

        await removeDrawing({ drawingId })
      } catch (error) {
        console.error("Failed to remove drawing:", error)
      }
    },
    [
      allDrawings,
      createNewDrawing,
      currentDrawingId,
      removeDrawing,
      setCurrentDrawingId
    ]
  )

  const handleMoveDrawingToFolder = useCallback(
    async (drawingId: string, folderId: string | null) => {
      try {
        await moveDrawingToFolder({ drawingId, folderId })
      } catch (error) {
        console.error("Failed to move drawing:", error)
      }
    },
    [moveDrawingToFolder]
  )

  const handleSelectDrawing = useCallback(
    (drawingId: string) => {
      setCurrentDrawingId(drawingId)
      setIsOpen(false)
    },
    [setCurrentDrawingId, setIsOpen]
  )

  return {
    startEditing,
    saveName,
    cancelEditing,
    handleNameInputKeyDown,
    handleRemove,
    handleMoveDrawingToFolder,
    handleSelectDrawing
  }
}
