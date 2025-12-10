import { useCallback, type KeyboardEvent } from "react"

import { type SidebarDrawing } from "../types"

type DrawingActionParams = {
  currentDrawingId: string | null
  allDrawings: SidebarDrawing[] | undefined
  setCurrentDrawingId: (id: string | null) => void
  updateName: (args: { drawingId: string; name: string }) => Promise<unknown>
  removeDrawing: (args: { drawingId: string }) => Promise<unknown>
  moveDrawingToFolder: (args: {
    drawingId: string
    folderId: string | null
  }) => Promise<unknown>
  createNewDrawing: () => void
  setIsOpen: (value: boolean) => void
  editingName: string
  setEditingName: (name: string) => void
  setEditingId: (id: string | null) => void
}

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

