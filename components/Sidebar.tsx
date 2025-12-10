"use client"

import { useMutation, useQuery } from "convex/react"
import { useCallback } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from "next/navigation"

import { api } from "../convex/_generated/api"
import { useDrawing } from "../context/DrawingContext"
import { StorageFooter } from "./sidebar/components/storage-footer"
import { SidebarHeader } from "./sidebar/components/sidebar-header"
import { SidebarShell } from "./sidebar/components/sidebar-shell"
import { FolderSection } from "./sidebar/components/folder-section"
import { DrawingList } from "./sidebar/components/drawing-list"
import { SearchDialog } from "./sidebar/components/search-dialog"
import { NewFolderDialog } from "./sidebar/components/new-folder-dialog"
import { useSidebarState } from "./sidebar/hooks/use-sidebar-state"
import { useDrawingActions } from "./sidebar/hooks/use-drawing-actions"
import { useFolderActions } from "./sidebar/hooks/use-folder-actions"
import { type SidebarDrawing, type SidebarFolder } from "./sidebar/types"

export default function Sidebar() {
  const { currentDrawingId, setCurrentDrawingId } = useDrawing()
  const allDrawings = useQuery(api.drawings.list, {}) as
    | SidebarDrawing[]
    | undefined
  const folders = useQuery(api.folders.list) as SidebarFolder[] | undefined
  const currentDrawing = useQuery(
    api.drawings.get,
    currentDrawingId ? { drawingId: currentDrawingId } : "skip"
  )
  const userStorage = useQuery(api.drawings.getUserStorage)
  const updateName = useMutation(api.drawings.updateName)
  const removeDrawing = useMutation(api.drawings.remove)
  const createFolder = useMutation(api.folders.create)
  const updateFolderName = useMutation(api.folders.updateName)
  const updateFolderAppearance = useMutation(api.folders.updateAppearance)
  const removeFolder = useMutation(api.folders.remove)
  const moveDrawingToFolder = useMutation(api.folders.moveDrawingToFolder)
  const { signOut } = useAuthActions()
  const router = useRouter()

  const {
    isOpen,
    setIsOpen,
    editingId,
    setEditingId,
    editingName,
    setEditingName,
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,
    creatingFolder,
    setCreatingFolder,
    newFolderName,
    setNewFolderName,
    foldersVisible,
    setFoldersVisible,
    expandedFolders,
    toggleFolderExpanded,
    searchDialogOpen,
    setSearchDialogOpen,
    searchQuery,
    setSearchQuery,
    newFolderDialogOpen,
    setNewFolderDialogOpen,
    newFolderDialogName,
    setNewFolderDialogName,
    drawingIdToMove,
    setDrawingIdToMove,
    refs,
    groupedDrawings,
    filteredDrawings
  } = useSidebarState(allDrawings)

  const createNewDrawing = useCallback(() => {
    const newId = crypto.randomUUID()
    setCurrentDrawingId(newId)
    setIsOpen(false)
  }, [setCurrentDrawingId, setIsOpen])

  const drawingActions = useDrawingActions({
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
  })

  const folderHandlers = useFolderActions({
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
  })

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      router.push("/signin")
    } catch (error) {
      console.error("Failed to sign out:", error)
    }
  }, [router, signOut])

  const drawingTheme =
    (currentDrawing?.appState as { theme?: "light" | "dark" } | undefined)
      ?.theme ?? "dark"

  if (!allDrawings) return null

  return (
    <>
      <SidebarShell
        isOpen={isOpen}
        drawingTheme={drawingTheme}
        onOpen={() => setIsOpen(true)}
      >
        <SidebarHeader
          onCollapse={() => setIsOpen(false)}
          onNewDrawing={createNewDrawing}
          onOpenSearch={() => setSearchDialogOpen(true)}
        />

        <FolderSection
          folders={folders}
          drawingsByFolder={groupedDrawings.drawingsByFolder}
          expandedFolders={expandedFolders}
          toggleFolderExpanded={toggleFolderExpanded}
          foldersVisible={foldersVisible}
          onToggleFoldersVisible={() => setFoldersVisible(!foldersVisible)}
          creatingFolder={creatingFolder}
          newFolderName={newFolderName}
          setCreatingFolder={setCreatingFolder}
          setNewFolderName={setNewFolderName}
          newFolderInputRef={refs.newFolderInputRef}
          editingFolderId={editingFolderId}
          editingFolderName={editingFolderName}
          folderInputRef={refs.folderInputRef}
          folderHandlers={folderHandlers}
          drawingHandlers={drawingActions}
          editingId={editingId}
          editingName={editingName}
          inputRef={refs.inputRef}
          currentDrawingId={currentDrawingId}
        />

        <span className="text-sm text-muted-foreground px-4 py-1 mt-2">
          Your drawings
        </span>

        <ScrollArea className="flex-1 space-y-1 px-1">
          <DrawingList
            drawings={groupedDrawings.uncategorizedDrawings}
            folders={folders}
            editingId={editingId}
            editingName={editingName}
            inputRef={refs.inputRef}
            currentDrawingId={currentDrawingId}
            drawingHandlers={drawingActions}
            onOpenNewFolderDialog={folderHandlers.handleOpenNewFolderDialog}
          />
        </ScrollArea>

        <StorageFooter userStorage={userStorage} onSignOut={handleSignOut} />
      </SidebarShell>

      <SearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filteredDrawings={filteredDrawings}
        currentDrawingId={currentDrawingId}
        onSelectDrawing={(drawingId) => setCurrentDrawingId(drawingId)}
        searchInputRef={refs.searchInputRef}
        onCloseSidebar={() => setIsOpen(false)}
      />

      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        newFolderDialogName={newFolderDialogName}
        onFolderNameChange={setNewFolderDialogName}
        onBlur={folderHandlers.handleNewFolderDialogBlur}
        onKeyDown={folderHandlers.handleNewFolderDialogKeyDown}
        inputRef={refs.newFolderDialogInputRef}
      />
    </>
  )
}
