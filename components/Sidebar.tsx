"use client"

import { useMutation, useQuery } from "convex/react"
import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
  const sharedDrawings = useQuery(api.drawings.listShared) as
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
  const addCollaborator = useMutation(api.drawings.addCollaboratorByEmail)
  const leaveCollaboration = useMutation(api.drawings.leaveCollaboration)
  const createFolder = useMutation(api.folders.create)
  const updateFolderName = useMutation(api.folders.updateName)
  const updateFolderAppearance = useMutation(api.folders.updateAppearance)
  const removeFolder = useMutation(api.folders.remove)
  const moveDrawingToFolder = useMutation(api.folders.moveDrawingToFolder)
  const { signOut } = useAuthActions()
  const router = useRouter()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareTargetDrawingId, setShareTargetDrawingId] = useState<
    string | null
  >(null)
  const [shareEmail, setShareEmail] = useState("")
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const shareTargetName = useMemo(() => {
    if (!shareTargetDrawingId || !allDrawings) return null
    return (
      allDrawings.find((d) => d.drawingId === shareTargetDrawingId)?.name ??
      null
    )
  }, [allDrawings, shareTargetDrawingId])

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

  const sharedDrawingsWithFlag = useMemo(
    () =>
      (sharedDrawings ?? []).map((drawing) => ({
        ...drawing,
        isShared: true
      })),
    [sharedDrawings]
  )

  const getShareFriendlyError = useCallback((error: unknown): string => {
    const raw =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to add collaborator"

    const normalized = raw.toLowerCase()
    if (normalized.includes("user not found")) {
      return "No user with that email was found."
    }
    if (normalized.includes("already a collaborator")) {
      return "That user is already a collaborator."
    }
    if (normalized.includes("only the owner")) {
      return "Only the owner can share this drawing."
    }
    if (normalized.includes("share with yourself")) {
      return "You already own this drawing."
    }
    if (normalized.includes("unauthorized")) {
      return "You need permission to share this drawing."
    }

    return "Could not add collaborator. Please try again."
  }, [])

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

  const handleOpenShareDialog = useCallback((drawingId: string) => {
    setShareTargetDrawingId(drawingId)
    setShareDialogOpen(true)
    setShareEmail("")
    setShareError(null)
  }, [])

  const handleShareSubmit = useCallback(async () => {
    if (!shareTargetDrawingId) return
    if (!shareEmail.trim()) {
      setShareError("Please enter an email.")
      return
    }

    setShareLoading(true)
    setShareError(null)

    try {
      await addCollaborator({
        drawingId: shareTargetDrawingId,
        email: shareEmail.trim()
      })
      setShareDialogOpen(false)
      setShareTargetDrawingId(null)
      setShareEmail("")
    } catch (error) {
      setShareError(getShareFriendlyError(error))
    } finally {
      setShareLoading(false)
    }
  }, [addCollaborator, getShareFriendlyError, shareEmail, shareTargetDrawingId])

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

  const handleLeaveCollaboration = useCallback(
    async (drawingId: string) => {
      try {
        await leaveCollaboration({ drawingId })
        if (currentDrawingId === drawingId) {
          const nextOwned = allDrawings?.find(
            (drawing) => drawing.drawingId !== drawingId
          )
          const nextShared = sharedDrawingsWithFlag.find(
            (drawing) => drawing.drawingId !== drawingId
          )
          const nextId = nextOwned?.drawingId ?? nextShared?.drawingId ?? null
          if (nextId) {
            setCurrentDrawingId(nextId)
          } else {
            createNewDrawing()
          }
        }
      } catch (error) {
        console.error("Failed to leave collaboration:", error)
      }
    },
    [
      allDrawings,
      createNewDrawing,
      currentDrawingId,
      leaveCollaboration,
      setCurrentDrawingId,
      sharedDrawingsWithFlag
    ]
  )

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

        <ScrollArea className="flex-1 space-y-1 px-1">
          {sharedDrawingsWithFlag.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground px-3 py-1 block">
                Shared drawings
              </span>
              <DrawingList
                variant="shared"
                drawings={sharedDrawingsWithFlag}
                folders={folders}
                editingId={null}
                editingName=""
                inputRef={refs.inputRef}
                currentDrawingId={currentDrawingId}
                drawingHandlers={drawingActions}
                onOpenNewFolderDialog={() => {}}
                onLeave={handleLeaveCollaboration}
                emptyLabel="No shared drawings yet"
              />
              <div className="h-2" />
            </>
          )}

          <span className="text-sm text-muted-foreground px-3 py-1 block">
            Your drawings
          </span>

          <DrawingList
            drawings={groupedDrawings.uncategorizedDrawings}
            folders={folders}
            editingId={editingId}
            editingName={editingName}
            inputRef={refs.inputRef}
            currentDrawingId={currentDrawingId}
            drawingHandlers={drawingActions}
            onOpenNewFolderDialog={folderHandlers.handleOpenNewFolderDialog}
            variant="owned"
            onShare={handleOpenShareDialog}
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

      <Dialog
        open={shareDialogOpen}
        onOpenChange={(open) => {
          setShareDialogOpen(open)
          if (!open) {
            setShareTargetDrawingId(null)
            setShareError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share drawing</DialogTitle>
            <DialogDescription>
              {shareTargetName
                ? `Add a collaborator to "${shareTargetName}".`
                : "Add a collaborator by email."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="username"
              autoFocus
            />
            {shareError && (
              <p className="text-sm text-destructive">{shareError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleShareSubmit}
              disabled={
                shareLoading ||
                !shareTargetDrawingId ||
                shareEmail.trim().length === 0
              }
            >
              {shareLoading ? "Adding..." : "Add collaborator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
