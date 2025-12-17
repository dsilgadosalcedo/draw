import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  type FocusEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type RefObject,
  useState
} from "react"

import {
  FOLDER_COLORS,
  FOLDER_ICONS,
  folderIconMap,
  sidebarIcons
} from "../constants/sidebar-constants"
import { type SidebarDrawing, type SidebarFolder } from "../types"

type DrawingHandlers = {
  startEditing: (drawingId: string, currentName: string) => void
  saveName: (drawingId: string) => Promise<void>
  handleNameInputKeyDown: (
    e: KeyboardEvent<HTMLInputElement>,
    drawingId: string
  ) => void
  handleRemove: (drawingId: string) => Promise<void>
  handleMoveDrawingToFolder: (
    drawingId: string,
    folderId: string | null
  ) => Promise<void>
  handleSelectDrawing: (drawingId: string) => void
}

type FolderHandlers = {
  startEditingFolder: (folderId: string, currentName: string) => void
  saveFolderName: (folderId: string) => Promise<void>
  handleFolderNameInputKeyDown: (
    e: KeyboardEvent<HTMLInputElement>,
    folderId: string
  ) => void
  handleRemoveFolder: (folderId: string) => Promise<void>
  handleCreateFolder: () => Promise<void>
  handleNewFolderKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleUpdateFolderAppearance: (
    folderId: string,
    updates: { icon?: string; color?: string }
  ) => Promise<void>
  handleOpenNewFolderDialog: (drawingId: string) => void
}

type FolderSectionProps = {
  folders: SidebarFolder[] | undefined
  drawingsByFolder: Record<string, SidebarDrawing[]>
  expandedFolders: Set<string>
  toggleFolderExpanded: (folderId: string) => void
  foldersVisible: boolean
  onToggleFoldersVisible: () => void
  creatingFolder: boolean
  newFolderName: string
  setCreatingFolder: (value: boolean) => void
  setNewFolderName: (value: string) => void
  newFolderInputRef:
    | MutableRefObject<HTMLInputElement | null>
    | RefObject<HTMLInputElement | null>
  editingFolderId: string | null
  editingFolderName: string
  folderInputRef:
    | MutableRefObject<HTMLInputElement | null>
    | RefObject<HTMLInputElement | null>
  folderHandlers: FolderHandlers
  drawingHandlers: DrawingHandlers
  editingId: string | null
  editingName: string
  inputRef:
    | MutableRefObject<HTMLInputElement | null>
    | RefObject<HTMLInputElement | null>
  currentDrawingId: string | null
}

export function FolderSection({
  folders,
  drawingsByFolder,
  expandedFolders,
  toggleFolderExpanded,
  foldersVisible,
  onToggleFoldersVisible,
  creatingFolder,
  newFolderName,
  setCreatingFolder,
  setNewFolderName,
  newFolderInputRef,
  editingFolderId,
  editingFolderName,
  folderInputRef,
  folderHandlers,
  drawingHandlers,
  editingId,
  editingName,
  inputRef,
  currentDrawingId
}: FolderSectionProps) {
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null)
  const [openDrawingMenuId, setOpenDrawingMenuId] = useState<string | null>(
    null
  )

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-1 cursor-pointer select-none"
        onClick={onToggleFoldersVisible}
      >
        <div className="flex items-center w-full gap-1 group">
          <span className="text-sm text-muted-foreground">Folders</span>

          <sidebarIcons.ChevronDown
            className={cn(
              "h-4 w-4 transition-transform hidden group-hover:block text-muted-foreground",
              foldersVisible ? "rotate-0" : "-rotate-90"
            )}
          />
        </div>
      </div>
      {foldersVisible && (
        <div className="flex flex-col">
          <div className="px-1">
            <Button
              variant="ghost"
              className="w-full justify-start font-normal"
              onClick={() => setCreatingFolder(true)}
            >
              <sidebarIcons.FolderPlus className="h-4 w-4" />
              New folder
            </Button>
          </div>
          {creatingFolder && (
            <div className="px-1">
              <Input
                ref={newFolderInputRef}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => void folderHandlers.handleCreateFolder()}
                onKeyDown={(e) => folderHandlers.handleNewFolderKeyDown(e)}
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
                const folderDrawings = drawingsByFolder[folder.folderId] || []
                const isFolderMenuOpen = openFolderMenuId === folder.folderId

                return (
                  <div
                    key={folder._id}
                    onClick={() => {
                      if (isEditing) return
                      toggleFolderExpanded(folder.folderId)
                    }}
                  >
                    <div className="flex items-center gap-2 group relative">
                      {(() => {
                        const folderColor = folder.color ?? "default"
                        const iconKey = folder.icon ?? "folder"
                        const FolderIcon =
                          folderIconMap[
                            iconKey as keyof typeof folderIconMap
                          ] ?? folderIconMap.folder
                        const iconColor = `var(--draw-${folderColor}-foreground)`

                        return (
                          <FolderIcon
                            className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 shrink-0 group-hover:hidden"
                            style={{ color: iconColor }}
                          />
                        )
                      })()}
                      <sidebarIcons.ChevronDown
                        className={cn(
                          "h-4 w-4 absolute top-1/2 -translate-y-1/2 left-3 transition-transform hidden group-hover:block text-muted-foreground",
                          isExpanded ? "rotate-0" : "-rotate-90"
                        )}
                      />
                      <Input
                        ref={isEditing ? folderInputRef : null}
                        tabIndex={isEditing ? 0 : -1}
                        onMouseDown={(e) => {
                          if (isEditing) {
                            e.stopPropagation()
                            return
                          }
                          e.preventDefault()
                        }}
                        onClick={(e) => {
                          if (isEditing) {
                            e.stopPropagation()
                          }
                        }}
                        value={isEditing ? editingFolderName : folder.name}
                        readOnly={!isEditing}
                        onChange={(e) =>
                          folderHandlers.startEditingFolder(
                            folder.folderId,
                            e.target.value
                          )
                        }
                        onBlur={(e) => {
                          if (!isEditing) return
                          const related =
                            e.relatedTarget instanceof HTMLElement
                              ? e.relatedTarget
                              : null
                          const relatedLabel =
                            related?.getAttribute("aria-label") || ""
                          const shouldKeepEditing =
                            relatedLabel === "Folder options" ||
                            related === null

                          if (shouldKeepEditing) {
                            requestAnimationFrame(() => {
                              if (folderInputRef.current) {
                                folderInputRef.current.focus()
                                folderInputRef.current.select()
                              }
                            })
                            return
                          }

                          void folderHandlers.saveFolderName(folder.folderId)
                        }}
                        onKeyDown={(e) =>
                          folderHandlers.handleFolderNameInputKeyDown(
                            e,
                            folder.folderId
                          )
                        }
                        className={cn(
                          "border-none shadow-none focus-visible:border-none focus-visible:ring-0",
                          "group-hover:bg-secondary dark:group-hover:bg-secondary dark:bg-transparent pl-9",
                          isFolderMenuOpen && "bg-secondary dark:bg-secondary",
                          isEditing
                            ? "cursor-text select-text"
                            : "cursor-pointer select-none"
                        )}
                      />
                      <div
                        className={cn(
                          "pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-secondary via-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-md",
                          isFolderMenuOpen && "opacity-100"
                        )}
                      />
                      <DropdownMenu
                        open={isFolderMenuOpen}
                        onOpenChange={(open) => {
                          setOpenFolderMenuId((prev) =>
                            open
                              ? folder.folderId
                              : prev === folder.folderId
                                ? null
                                : prev
                          )
                          if (open) {
                            setOpenDrawingMenuId(null)
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => e.stopPropagation()}
                            title="Folder options"
                            aria-label="Folder options"
                            className={cn(
                              "absolute top-1/2 dark:hover:bg-transparent hover:bg-transparent -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100",
                              isFolderMenuOpen && "opacity-100"
                            )}
                          >
                            <sidebarIcons.MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              folderHandlers.startEditingFolder(
                                folder.folderId,
                                folder.name
                              )
                            }}
                          >
                            <sidebarIcons.Pencil className="h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger
                              onClick={(e) => e.stopPropagation()}
                              onSelect={(e) => e.preventDefault()}
                            >
                              <sidebarIcons.Palette className="h-4 w-4" />
                              Personalize
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                              sideOffset={10}
                              className="space-y-3 p-3"
                            >
                              <div className="grid grid-cols-6 gap-y-3">
                                {FOLDER_COLORS.map((option) => {
                                  const isActive =
                                    (folder.color ?? "default") === option.value
                                  const swatchBg = `var(--draw-${option.value}-foreground)`

                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        void folderHandlers.handleUpdateFolderAppearance(
                                          folder.folderId,
                                          { color: option.value }
                                        )
                                      }}
                                      className={cn(
                                        "flex h-6 w-6 items-center justify-center rounded-full border transition",
                                        isActive
                                          ? "ring-1 ring-offset-2"
                                          : "hover:ring"
                                      )}
                                      style={{
                                        backgroundColor: swatchBg
                                      }}
                                      aria-label={option.label}
                                    ></button>
                                  )
                                })}
                              </div>
                              <Separator />
                              <div className="grid grid-cols-6">
                                {FOLDER_ICONS.map((option) => {
                                  const OptionIcon = option.Icon
                                  const isActive =
                                    (folder.icon ?? "folder") === option.value
                                  const iconColor = `var(--draw-${
                                    folder.color ?? "default"
                                  }-foreground)`

                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        void folderHandlers.handleUpdateFolderAppearance(
                                          folder.folderId,
                                          { icon: option.value }
                                        )
                                      }}
                                      className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-md transition",
                                        isActive
                                          ? "bg-secondary"
                                          : "hover:bg-secondary"
                                      )}
                                      aria-label={option.label}
                                    >
                                      <OptionIcon
                                        className="h-5 w-5"
                                        style={{ color: iconColor }}
                                      />
                                    </button>
                                  )
                                })}
                              </div>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              void folderHandlers.handleRemoveFolder(
                                folder.folderId
                              )
                            }}
                          >
                            <sidebarIcons.Trash2 className="h-4 w-4" />
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
                            const isDrawingMenuOpen =
                              openDrawingMenuId === drawing.drawingId

                            return (
                              <div key={drawing._id} className="relative group">
                                <Separator
                                  orientation="vertical"
                                  className="absolute top-0 left-[19.5px] h-9"
                                />
                                <Input
                                  ref={isEditingDrawing ? inputRef : null}
                                  onClick={(e) => {
                                    if (!isEditingDrawing) {
                                      e.stopPropagation()
                                      drawingHandlers.handleSelectDrawing(
                                        drawing.drawingId
                                      )
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
                                    drawingHandlers.startEditing(
                                      drawing.drawingId,
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e: FocusEvent<HTMLInputElement>) => {
                                    if (!isEditingDrawing) return

                                    const related =
                                      e.relatedTarget instanceof HTMLElement
                                        ? e.relatedTarget
                                        : null
                                    const relatedLabel =
                                      related?.getAttribute("aria-label") || ""
                                    const shouldKeepEditing =
                                      relatedLabel === "Drawing options" ||
                                      related === null

                                    if (shouldKeepEditing) {
                                      requestAnimationFrame(() => {
                                        if (inputRef.current) {
                                          inputRef.current.focus()
                                          inputRef.current.select()
                                        }
                                      })
                                      return
                                    }

                                    void drawingHandlers.saveName(
                                      drawing.drawingId
                                    )
                                  }}
                                  onKeyDown={(e) =>
                                    drawingHandlers.handleNameInputKeyDown(
                                      e,
                                      drawing.drawingId
                                    )
                                  }
                                  className={cn(
                                    "border-none shadow-none focus-visible:border-none focus-visible:ring-0 pl-9",
                                    isActive
                                      ? "bg-accent cursor-default"
                                      : "group-hover:bg-secondary dark:group-hover:bg-secondary dark:bg-transparent cursor-pointer",
                                    !isActive &&
                                      isDrawingMenuOpen &&
                                      "bg-secondary dark:bg-secondary"
                                  )}
                                />
                                <div
                                  className={cn(
                                    "pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-secondary via-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-md",
                                    isDrawingMenuOpen && "opacity-100"
                                  )}
                                />
                                <DropdownMenu
                                  open={isDrawingMenuOpen}
                                  onOpenChange={(open) => {
                                    setOpenDrawingMenuId((prev) =>
                                      open
                                        ? drawing.drawingId
                                        : prev === drawing.drawingId
                                          ? null
                                          : prev
                                    )
                                    if (open) {
                                      setOpenFolderMenuId(null)
                                    }
                                  }}
                                >
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={(e) => e.stopPropagation()}
                                      title="More options"
                                      aria-label="Drawing options"
                                      className={cn(
                                        "absolute top-1/2 dark:hover:bg-transparent hover:bg-transparent -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100",
                                        isDrawingMenuOpen && "opacity-100"
                                      )}
                                    >
                                      <sidebarIcons.MoreVertical />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        drawingHandlers.startEditing(
                                          drawing.drawingId,
                                          drawing.name
                                        )
                                      }}
                                    >
                                      <sidebarIcons.Pencil className="h-4 w-4" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <sidebarIcons.Folder className="h-4 w-4" />
                                        Move to folder
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            folderHandlers.handleOpenNewFolderDialog(
                                              drawing.drawingId
                                            )
                                          }}
                                        >
                                          <sidebarIcons.Plus className="h-4 w-4" />
                                          New folder
                                        </DropdownMenuItem>
                                        {folders && folders.length > 0 && (
                                          <>
                                            <DropdownMenuSeparator />
                                            {folders.map((folderOption) => (
                                              <DropdownMenuItem
                                                key={folderOption.folderId}
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  void drawingHandlers.handleMoveDrawingToFolder(
                                                    drawing.drawingId,
                                                    folderOption.folderId
                                                  )
                                                }}
                                              >
                                                <sidebarIcons.Folder className="h-4 w-4" />
                                                {folderOption.name}
                                              </DropdownMenuItem>
                                            ))}
                                          </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            void drawingHandlers.handleMoveDrawingToFolder(
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
                                        void drawingHandlers.handleRemove(
                                          drawing.drawingId
                                        )
                                      }}
                                    >
                                      <sidebarIcons.Trash2 className="h-4 w-4" />
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
        </div>
      )}
    </div>
  )
}
