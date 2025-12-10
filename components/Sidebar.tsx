"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { useDrawing } from "../context/DrawingContext"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  MoreVertical,
  PanelRightCloseIcon,
  LogOut,
  LineSquiggleIcon,
  SearchIcon,
  PanelLeftIcon,
  Pencil,
  Trash2,
  HardDrive,
  Folder,
  FolderPlus,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./ui/input"
import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator
} from "./ui/dropdown-menu"
import { Separator } from "./ui/separator"

// Helper function to format bytes to KB/MB
function formatStorage(bytes: number): string {
  if (bytes < 1024 * 1024) {
    // Less than 1 MB, show in KB
    return `${(bytes / 1024).toFixed(0)} KB`
  } else {
    // 1 MB or more, show in MB with 2 decimals
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}

export default function Sidebar() {
  const { currentDrawingId, setCurrentDrawingId } = useDrawing()
  const allDrawings = useQuery(api.drawings.list, {})
  const folders = useQuery(api.folders.list)
  const currentDrawing = useQuery(
    api.drawings.get,
    currentDrawingId ? { drawingId: currentDrawingId } : "skip"
  )
  const userStorage = useQuery(api.drawings.getUserStorage)
  const updateName = useMutation(api.drawings.updateName)
  const removeDrawing = useMutation(api.drawings.remove)
  const createFolder = useMutation(api.folders.create)
  const updateFolderName = useMutation(api.folders.updateName)
  const removeFolder = useMutation(api.folders.remove)
  const moveDrawingToFolder = useMutation(api.folders.moveDrawingToFolder)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [foldersVisible, setFoldersVisible] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set()
  )
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const newFolderInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { signOut } = useAuthActions()
  const router = useRouter()

  // Get the drawing theme from appState, default to "dark"
  const drawingTheme =
    (currentDrawing?.appState as { theme?: "light" | "dark" } | undefined)
      ?.theme ?? "dark"

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/signin")
    } catch (error) {
      console.error("Failed to sign out:", error)
    }
  }

  const createNewDrawing = () => {
    const newId = crypto.randomUUID()
    setCurrentDrawingId(newId)
    setIsOpen(false)
  }

  const startEditing = (
    drawingId: string,
    currentName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setEditingId(drawingId)
    setEditingName(currentName)
  }

  const saveName = async (drawingId: string) => {
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
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName("")
  }

  const handleNameInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    drawingId: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveName(drawingId)
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEditing()
    }
  }

  const handleRemove = async (drawingId: string) => {
    try {
      // Step 1: First redirect to another drawing if needed
      if (drawingId === currentDrawingId) {
        const currentMetadata = allDrawings?.find(
          (drawing) => drawing.drawingId === drawingId
        )

        if (currentMetadata?.folderId) {
          // Prefer another drawing in the same folder
          const sameFolder =
            allDrawings?.filter(
              (drawing) =>
                drawing.folderId === currentMetadata.folderId &&
                drawing.drawingId !== drawingId
            ) ?? []

          if (sameFolder.length > 0) {
            setCurrentDrawingId(sameFolder[0].drawingId)
          } else {
            // If the folder is now empty, move to an uncategorized drawing if available
            const otherUncategorized =
              allDrawings?.filter(
                (drawing) =>
                  !drawing.folderId && drawing.drawingId !== drawingId
              ) ?? []

            if (otherUncategorized.length > 0) {
              setCurrentDrawingId(otherUncategorized[0].drawingId)
            } else {
              // No drawings left anywhere, start a new uncategorized drawing
              createNewDrawing()
            }
          }
        } else {
          // Only consider uncategorized drawings to avoid auto-opening a folder drawing
          const otherUncategorized =
            allDrawings?.filter(
              (drawing) => !drawing.folderId && drawing.drawingId !== drawingId
            ) ?? []

          if (otherUncategorized.length > 0) {
            setCurrentDrawingId(otherUncategorized[0].drawingId)
          } else {
            createNewDrawing()
          }
        }
      }

      // Step 2: Then call the remove mutation
      // The UI will automatically update when the query refetches (since isActive is now false)
      await removeDrawing({ drawingId })
    } catch (error) {
      console.error("Failed to remove drawing:", error)
    }
  }

  const startEditingFolder = (
    folderId: string,
    currentName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setEditingFolderId(folderId)
    setEditingFolderName(currentName)
  }

  const saveFolderName = async (folderId: string) => {
    if (editingFolderName.trim() === "") {
      setEditingFolderId(null)
      return
    }
    try {
      await updateFolderName({ folderId, name: editingFolderName.trim() })
      setEditingFolderId(null)
    } catch (error) {
      console.error("Failed to update folder name:", error)
    }
  }

  const cancelEditingFolder = () => {
    setEditingFolderId(null)
    setEditingFolderName("")
  }

  const handleFolderNameInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    folderId: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveFolderName(folderId)
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEditingFolder()
    }
  }

  const handleRemoveFolder = async (folderId: string) => {
    try {
      await removeFolder({ folderId })
    } catch (error) {
      console.error("Failed to remove folder:", error)
    }
  }

  const handleCreateFolder = async () => {
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
  }

  const handleNewFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateFolder()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setCreatingFolder(false)
      setNewFolderName("")
    }
  }

  const handleMoveDrawingToFolder = async (
    drawingId: string,
    folderId: string | null
  ) => {
    try {
      await moveDrawingToFolder({ drawingId, folderId })
    } catch (error) {
      console.error("Failed to move drawing:", error)
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      // Use setTimeout to ensure the dropdown has fully closed and animations are complete
      const timeoutId = setTimeout(() => {
        if (inputRef.current && editingId) {
          inputRef.current.focus()
          // Use a small delay to ensure focus is fully set before selecting
          setTimeout(() => {
            if (
              inputRef.current &&
              editingId &&
              document.activeElement === inputRef.current
            ) {
              inputRef.current.select()
            }
          }, 10)
        }
      }, 150)

      return () => clearTimeout(timeoutId)
    }
  }, [editingId])

  // Focus folder input when editing starts (stable focus without glitch)
  useEffect(() => {
    if (!editingFolderId || !folderInputRef.current) return

    const inputEl = folderInputRef.current
    const rafId = requestAnimationFrame(() => {
      inputEl.focus()
      inputEl.select()
    })

    return () => cancelAnimationFrame(rafId)
  }, [editingFolderId])

  // Focus new folder input when creating
  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (newFolderInputRef.current && creatingFolder) {
          newFolderInputRef.current.focus()
        }
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [creatingFolder])

  // Focus search input when dialog opens
  useEffect(() => {
    if (searchDialogOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchDialogOpen])

  // Group drawings by folderId for efficient lookups
  const { uncategorizedDrawings, drawingsByFolder } = useMemo(() => {
    type Drawing = NonNullable<typeof allDrawings>[number]

    if (!allDrawings) {
      return {
        uncategorizedDrawings: [] as Drawing[],
        drawingsByFolder: {} as Record<string, Drawing[]>
      }
    }

    const byFolder: Record<string, Drawing[]> = {}
    const uncategorized: Drawing[] = []

    for (const drawing of allDrawings) {
      if (drawing.folderId) {
        if (!byFolder[drawing.folderId]) {
          byFolder[drawing.folderId] = []
        }
        byFolder[drawing.folderId].push(drawing)
      } else {
        uncategorized.push(drawing)
      }
    }

    return { uncategorizedDrawings: uncategorized, drawingsByFolder: byFolder }
  }, [allDrawings])

  // Filter drawings based on search query (search across all)
  const filteredDrawings = allDrawings
    ? allDrawings.filter((drawing) =>
        drawing.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  if (!allDrawings) return null

  return (
    <>
      {/* Toggle Button - Only visible when sidebar is closed */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="icon"
          className={cn(
            "fixed top-4 left-4 z-40 transition-all",
            drawingTheme === "light"
              ? "bg-[#ECECF3] text-[#1B1B1F] hover:bg-[#F1F0FF]"
              : "bg-[#232329] text-[#E3E3E8] hover:bg-[#363541]"
          )}
        >
          <PanelRightCloseIcon />
        </Button>
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-65 bg-sidebar border-r transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with Collapse Button & New Button */}
          <header className="flex flex-col items-center gap-2 pt-5 pb-2">
            <div className="flex items-center gap-2 justify-between w-full px-2">
              <Button variant="ghost" size="icon">
                <LineSquiggleIcon className="size-5" />
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftIcon />
              </Button>
            </div>

            <div className="px-1 w-full">
              <Button
                onClick={createNewDrawing}
                className="w-full justify-start font-normal"
                variant="ghost"
              >
                <Plus className="h-4 w-4" /> New drawing
              </Button>
              <Button
                onClick={() => setSearchDialogOpen(true)}
                className="w-full justify-start font-normal"
                variant="ghost"
              >
                <SearchIcon /> Search drawings
              </Button>
            </div>
          </header>

          {/* Folders Section */}
          <div className="flex flex-col">
            <div
              className="flex items-center justify-between px-4 py-1 cursor-pointer select-none"
              onClick={() => setFoldersVisible((prev) => !prev)}
            >
              <div className="flex items-center w-full gap-1 group">
                <span className="text-sm text-muted-foreground">Folders</span>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform hidden group-hover:block text-muted-foreground",
                    foldersVisible ? "rotate-0" : "-rotate-90"
                  )}
                />
              </div>
            </div>
            {foldersVisible && (
              <>
                <div className="px-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => setCreatingFolder(true)}
                  >
                    <FolderPlus className="h-4 w-4" />
                    New folder
                  </Button>
                </div>
                {creatingFolder && (
                  <div className="px-1">
                    <Input
                      ref={newFolderInputRef}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={handleCreateFolder}
                      onKeyDown={handleNewFolderKeyDown}
                      placeholder="Folder name"
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                )}
                {folders && folders.length > 0 && (
                  <div className="px-1">
                    {folders.map((folder) => {
                      const isEditing = editingFolderId === folder.folderId
                      const isExpanded = expandedFolders.has(folder.folderId)
                      const folderDrawings =
                        drawingsByFolder[folder.folderId] || []

                      return (
                        <div
                          key={folder._id}
                          onClick={() => {
                            if (isEditing) return
                            setExpandedFolders((prev) => {
                              const next = new Set(prev)
                              if (next.has(folder.folderId)) {
                                next.delete(folder.folderId)
                              } else {
                                next.add(folder.folderId)
                              }
                              return next
                            })
                          }}
                        >
                          <div className="flex items-center gap-2 group relative">
                            <Folder className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground shrink-0 group-hover:hidden" />
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 absolute top-1/2 -translate-y-1/2 left-3 transition-transform hidden group-hover:block text-muted-foreground",
                                isExpanded ? "rotate-0" : "-rotate-90"
                              )}
                            />
                            <Input
                              ref={isEditing ? folderInputRef : null}
                              onClick={(e) => {
                                if (isEditing) {
                                  e.stopPropagation()
                                }
                              }}
                              value={
                                isEditing ? editingFolderName : folder.name
                              }
                              readOnly={!isEditing}
                              onChange={(e) =>
                                setEditingFolderName(e.target.value)
                              }
                              onBlur={() => {
                                if (isEditing) {
                                  saveFolderName(folder.folderId)
                                }
                              }}
                              onKeyDown={(e) =>
                                handleFolderNameInputKeyDown(e, folder.folderId)
                              }
                              className={cn(
                                "border-none shadow-none focus-visible:border-none focus-visible:ring-0",
                                "group-hover:bg-secondary dark:group-hover:bg-secondary dark:bg-transparent cursor-pointer pl-9"
                              )}
                            />
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-secondary via-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-md" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Folder options"
                                  aria-label="Folder options"
                                  className="absolute top-1/2 dark:hover:bg-transparent hover:bg-transparent -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditingFolder(
                                      folder.folderId,
                                      folder.name,
                                      e
                                    )
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveFolder(folder.folderId)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete folder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {isExpanded && (
                            <div>
                              {folderDrawings.length === 0 ? (
                                <div className="text-xs text-muted-foreground pl-9 py-1">
                                  No drawings in this folder
                                </div>
                              ) : (
                                folderDrawings.map((drawing) => {
                                  const isActive =
                                    drawing.drawingId === currentDrawingId
                                  const isEditingDrawing =
                                    editingId === drawing.drawingId

                                  return (
                                    <div
                                      key={drawing._id}
                                      className="relative group"
                                    >
                                      <Separator
                                        orientation="vertical"
                                        className="absolute top-0 left-[19.5px] h-9"
                                      />
                                      <Input
                                        ref={isEditingDrawing ? inputRef : null}
                                        onClick={(e) => {
                                          if (!isEditingDrawing) {
                                            e.stopPropagation()
                                            setCurrentDrawingId(
                                              drawing.drawingId
                                            )
                                            setIsOpen(false)
                                          } else {
                                            e.stopPropagation()
                                          }
                                        }}
                                        value={
                                          isEditingDrawing
                                            ? editingName
                                            : drawing.name
                                        }
                                        readOnly={!isEditingDrawing}
                                        onChange={(e) =>
                                          setEditingName(e.target.value)
                                        }
                                        onBlur={() => {
                                          if (isEditingDrawing) {
                                            saveName(drawing.drawingId)
                                          }
                                        }}
                                        onKeyDown={(e) =>
                                          handleNameInputKeyDown(
                                            e,
                                            drawing.drawingId
                                          )
                                        }
                                        className={cn(
                                          "border-none shadow-none focus-visible:border-none focus-visible:ring-0 pl-9",
                                          isActive
                                            ? "bg-accent cursor-default"
                                            : "group-hover:bg-secondary dark:group-hover:bg-secondary dark:bg-transparent cursor-pointer"
                                        )}
                                      />
                                      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-secondary via-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-md" />
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={(e) => e.stopPropagation()}
                                            title="More options"
                                            aria-label="Drawing options"
                                            className="absolute top-1/2 dark:hover:bg-transparent hover:bg-transparent -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100"
                                          >
                                            <MoreVertical />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              startEditing(
                                                drawing.drawingId,
                                                drawing.name,
                                                e
                                              )
                                            }}
                                          >
                                            <Pencil className="h-4 w-4" />
                                            Rename
                                          </DropdownMenuItem>
                                          <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                              <Folder className="h-4 w-4" />
                                              Move to folder
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                              <DropdownMenuItem
                                                onClick={async (e) => {
                                                  e.stopPropagation()
                                                  const newFolderName =
                                                    prompt("Enter folder name:")
                                                  if (
                                                    newFolderName &&
                                                    newFolderName.trim()
                                                  ) {
                                                    try {
                                                      const { folderId } =
                                                        await createFolder({
                                                          name: newFolderName.trim()
                                                        })
                                                      await handleMoveDrawingToFolder(
                                                        drawing.drawingId,
                                                        folderId
                                                      )
                                                    } catch (error) {
                                                      console.error(
                                                        "Failed to create folder:",
                                                        error
                                                      )
                                                    }
                                                  }
                                                }}
                                              >
                                                <Plus className="h-4 w-4" />
                                                New folder
                                              </DropdownMenuItem>
                                              {folders &&
                                                folders.length > 0 && (
                                                  <>
                                                    <DropdownMenuSeparator />
                                                    {folders.map(
                                                      (folderOption) => (
                                                        <DropdownMenuItem
                                                          key={
                                                            folderOption.folderId
                                                          }
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleMoveDrawingToFolder(
                                                              drawing.drawingId,
                                                              folderOption.folderId
                                                            )
                                                          }}
                                                        >
                                                          <Folder className="h-4 w-4" />
                                                          {folderOption.name}
                                                        </DropdownMenuItem>
                                                      )
                                                    )}
                                                  </>
                                                )}
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleMoveDrawingToFolder(
                                                    drawing.drawingId,
                                                    null
                                                  )
                                                }}
                                              >
                                                Remove from folder
                                              </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                          </DropdownMenuSub>
                                          <DropdownMenuItem
                                            variant="destructive"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleRemove(drawing.drawingId)
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <span className="text-sm text-muted-foreground px-4 py-1 mt-2">
            Your drawings
          </span>

          {/* Drawing List */}
          <ScrollArea className="flex-1 space-y-1 px-1">
            {!uncategorizedDrawings || uncategorizedDrawings.length === 0 ? (
              <div className="text-center text-sm text-gray-400 dark:text-slate-500 px-4">
                No drawings yet
              </div>
            ) : (
              uncategorizedDrawings.map((drawing) => {
                const isActive = drawing.drawingId === currentDrawingId
                const isEditing = editingId === drawing.drawingId

                return (
                  <div key={drawing._id} className="relative group">
                    <Input
                      ref={isEditing ? inputRef : null}
                      onClick={(e) => {
                        if (!isEditing) {
                          e.stopPropagation()
                          setCurrentDrawingId(drawing.drawingId)
                          setIsOpen(false)
                        } else {
                          // When editing, prevent clicks from deselecting
                          e.stopPropagation()
                        }
                      }}
                      value={isEditing ? editingName : drawing.name}
                      readOnly={!isEditing}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => {
                        if (isEditing) {
                          saveName(drawing.drawingId)
                        }
                      }}
                      onKeyDown={(e) =>
                        handleNameInputKeyDown(e, drawing.drawingId)
                      }
                      className={cn(
                        "border-none shadow-none focus-visible:border-none focus-visible:ring-0",
                        isActive
                          ? "bg-accent cursor-default"
                          : "group-hover:bg-secondary dark:group-hover:bg-secondary dark:bg-transparent cursor-pointer"
                      )}
                    />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-secondary via-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-md" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => e.stopPropagation()}
                          title="More options"
                          aria-label="Drawing options"
                          className="absolute top-1/2 dark:hover:bg-transparent hover:bg-transparent -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(drawing.drawingId, drawing.name, e)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Folder className="h-4 w-4" />
                            Move to folder
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation()
                                const newFolderName =
                                  prompt("Enter folder name:")
                                if (newFolderName && newFolderName.trim()) {
                                  try {
                                    const { folderId } = await createFolder({
                                      name: newFolderName.trim()
                                    })
                                    await handleMoveDrawingToFolder(
                                      drawing.drawingId,
                                      folderId
                                    )
                                  } catch (error) {
                                    console.error(
                                      "Failed to create folder:",
                                      error
                                    )
                                  }
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              New folder
                            </DropdownMenuItem>
                            {folders && folders.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                {folders.map((folder) => (
                                  <DropdownMenuItem
                                    key={folder.folderId}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMoveDrawingToFolder(
                                        drawing.drawingId,
                                        folder.folderId
                                      )
                                    }}
                                  >
                                    <Folder className="h-4 w-4" />
                                    {folder.name}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveDrawingToFolder(
                                  drawing.drawingId,
                                  null
                                )
                              }}
                            >
                              Remove from folder
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemove(drawing.drawingId)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })
            )}
          </ScrollArea>

          {/* Footer with Storage Display and Sign Out Button */}
          <div className="px-2 py-3 border-t space-y-2">
            {/* Storage Display */}
            {userStorage && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-muted-foreground text-sm">
                <HardDrive className="h-4 w-4" />
                <span className="flex-1">Storage used</span>
                <span className="font-medium">
                  {formatStorage(userStorage.totalBytes)}
                </span>
              </div>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full font-normal"
            >
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="md:max-w-169.5 w-full h-110.5 p-0 flex flex-col">
          <DialogHeader className="h-16 flex-row items-center px-4 border-b">
            <VisuallyHidden>
              <DialogTitle>Search Drawings</DialogTitle>
            </VisuallyHidden>
            <Input
              ref={searchInputRef}
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-none shadow-none focus-visible:border-none focus-visible:ring-0"
            />
          </DialogHeader>
          <ScrollArea className="max-h-[356px] flex-1 px-2">
            {filteredDrawings.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                {searchQuery
                  ? "No drawings found"
                  : "Start typing to search..."}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredDrawings.map((drawing) => {
                  const isActive = drawing.drawingId === currentDrawingId
                  return (
                    <Button
                      key={drawing._id}
                      onClick={() => {
                        setCurrentDrawingId(drawing.drawingId)
                        setSearchDialogOpen(false)
                        setSearchQuery("")
                        setIsOpen(false)
                      }}
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      {drawing.name}
                    </Button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
