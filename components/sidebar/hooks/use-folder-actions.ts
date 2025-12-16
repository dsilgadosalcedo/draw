import { useCallback, type KeyboardEvent } from "react"

import { type SidebarFolder } from "../types"

type FolderActionParams = {
  folders: SidebarFolder[] | undefined
  createFolder: (args: { name: string }) => Promise<{ folderId: string }>
  updateFolderName: (args: {
    folderId: string
    name: string
  }) => Promise<unknown>
  updateFolderAppearance: (args: {
    folderId: string
    icon: string
    color: string
  }) => Promise<unknown>
  removeFolder: (args: { folderId: string }) => Promise<unknown>
  moveDrawingToFolder: (args: {
    drawingId: string
    folderId: string | null
  }) => Promise<unknown>
  editingFolderName: string
  setEditingFolderName: (value: string) => void
  setEditingFolderId: (value: string | null) => void
  newFolderName: string
  setNewFolderName: (value: string) => void
  setCreatingFolder: (value: boolean) => void
  drawingIdToMove: string | null
  setDrawingIdToMove: (value: string | null) => void
  newFolderDialogName: string
  setNewFolderDialogName: (value: string) => void
  setNewFolderDialogOpen: (value: boolean) => void
}

export function useFolderActions({
  folders,
  createFolder,
  updateFolderName,
  updateFolderAppearance,
  removeFolder,
  moveDrawingToFolder,
  editingFolderName,
  setEditingFolderName,
  setEditingFolderId,
  newFolderName,
  setNewFolderName,
  setCreatingFolder,
  drawingIdToMove,
  setDrawingIdToMove,
  newFolderDialogName,
  setNewFolderDialogName,
  setNewFolderDialogOpen
}: FolderActionParams) {
  const startEditingFolder = useCallback(
    (folderId: string, currentName: string) => {
      setEditingFolderId(folderId)
      setEditingFolderName(currentName)
    },
    [setEditingFolderId, setEditingFolderName]
  )

  const saveFolderName = useCallback(
    async (folderId: string) => {
      if (editingFolderName.trim() === "") {
        setEditingFolderId(null)
        return
      }
      try {
        await updateFolderName({
          folderId,
          name: editingFolderName.trim()
        })
        setEditingFolderId(null)
      } catch (error) {
        console.error("Failed to update folder name:", error)
      }
    },
    [editingFolderName, setEditingFolderId, updateFolderName]
  )

  const cancelEditingFolder = useCallback(() => {
    setEditingFolderId(null)
    setEditingFolderName("")
  }, [setEditingFolderId, setEditingFolderName])

  const handleFolderNameInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, folderId: string) => {
      if (e.key === "Enter") {
        e.preventDefault()
        void saveFolderName(folderId)
      } else if (e.key === "Escape") {
        e.preventDefault()
        cancelEditingFolder()
      }
    },
    [cancelEditingFolder, saveFolderName]
  )

  const handleRemoveFolder = useCallback(
    async (folderId: string) => {
      try {
        await removeFolder({ folderId })
      } catch (error) {
        console.error("Failed to remove folder:", error)
      }
    },
    [removeFolder]
  )

  const handleCreateFolder = useCallback(async () => {
    if (newFolderName.trim() === "") {
      setCreatingFolder(false)
      setNewFolderName("")
      return
    }
    try {
      await createFolder({ name: newFolderName.trim() })
      setCreatingFolder(false)
      setNewFolderName("")
    } catch (error) {
      console.error("Failed to create folder:", error)
    }
  }, [createFolder, newFolderName, setCreatingFolder, setNewFolderName])

  const handleNewFolderKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        void handleCreateFolder()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setCreatingFolder(false)
        setNewFolderName("")
      }
    },
    [handleCreateFolder, setCreatingFolder, setNewFolderName]
  )

  const handleUpdateFolderAppearance = useCallback(
    async (folderId: string, updates: { icon?: string; color?: string }) => {
      const folder = folders?.find((f) => f.folderId === folderId)
      if (!folder) return

      const icon = updates.icon ?? folder.icon ?? "folder"
      const color = updates.color ?? folder.color ?? "default"

      try {
        await updateFolderAppearance({ folderId, icon, color })
      } catch (error) {
        console.error("Failed to update folder appearance:", error)
      }
    },
    [folders, updateFolderAppearance]
  )

  const handleOpenNewFolderDialog = useCallback(
    (drawingId: string) => {
      setDrawingIdToMove(drawingId)
      setNewFolderDialogName("")
      setNewFolderDialogOpen(true)
    },
    [setDrawingIdToMove, setNewFolderDialogName, setNewFolderDialogOpen]
  )

  const handleCreateFolderAndMove = useCallback(async () => {
    if (!drawingIdToMove || !newFolderDialogName.trim()) {
      setNewFolderDialogOpen(false)
      setDrawingIdToMove(null)
      setNewFolderDialogName("")
      return
    }
    try {
      const { folderId } = await createFolder({
        name: newFolderDialogName.trim()
      })
      await moveDrawingToFolder({ drawingId: drawingIdToMove, folderId })
      setNewFolderDialogOpen(false)
      setDrawingIdToMove(null)
      setNewFolderDialogName("")
    } catch (error) {
      console.error("Failed to create folder and move drawing:", error)
    }
  }, [
    createFolder,
    drawingIdToMove,
    moveDrawingToFolder,
    newFolderDialogName,
    setDrawingIdToMove,
    setNewFolderDialogName,
    setNewFolderDialogOpen
  ])

  const handleNewFolderDialogBlur = useCallback(() => {
    if (!newFolderDialogName.trim()) return
    window.setTimeout(() => {
      if (newFolderDialogName.trim()) {
        void handleCreateFolderAndMove()
      }
    }, 200)
  }, [handleCreateFolderAndMove, newFolderDialogName])

  const handleNewFolderDialogKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        void handleCreateFolderAndMove()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setNewFolderDialogOpen(false)
        setDrawingIdToMove(null)
        setNewFolderDialogName("")
      }
    },
    [
      handleCreateFolderAndMove,
      setDrawingIdToMove,
      setNewFolderDialogName,
      setNewFolderDialogOpen
    ]
  )

  return {
    startEditingFolder,
    saveFolderName,
    cancelEditingFolder,
    handleFolderNameInputKeyDown,
    handleRemoveFolder,
    handleCreateFolder,
    handleNewFolderKeyDown,
    handleUpdateFolderAppearance,
    handleOpenNewFolderDialog,
    handleCreateFolderAndMove,
    handleNewFolderDialogBlur,
    handleNewFolderDialogKeyDown
  }
}



