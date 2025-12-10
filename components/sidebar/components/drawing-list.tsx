import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  type KeyboardEvent,
  type MutableRefObject,
  type RefObject
} from "react"

import { sidebarIcons } from "../constants/sidebar-constants"
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

type DrawingListProps = {
  drawings: SidebarDrawing[]
  folders: SidebarFolder[] | undefined
  editingId: string | null
  editingName: string
  inputRef:
    | MutableRefObject<HTMLInputElement | null>
    | RefObject<HTMLInputElement | null>
  currentDrawingId: string | null
  drawingHandlers: DrawingHandlers
  onOpenNewFolderDialog: (drawingId: string) => void
}

export function DrawingList({
  drawings,
  folders,
  editingId,
  editingName,
  inputRef,
  currentDrawingId,
  drawingHandlers,
  onOpenNewFolderDialog
}: DrawingListProps) {
  if (!drawings || drawings.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400 dark:text-slate-500 px-4">
        No drawings yet
      </div>
    )
  }

  return (
    <>
      {drawings.map((drawing) => {
        const isActive = drawing.drawingId === currentDrawingId
        const isEditing = editingId === drawing.drawingId

        return (
          <div key={drawing._id} className="relative group">
            <Input
              ref={isEditing ? inputRef : null}
              onClick={(e) => {
                if (!isEditing) {
                  e.stopPropagation()
                  drawingHandlers.handleSelectDrawing(drawing.drawingId)
                } else {
                  e.stopPropagation()
                }
              }}
              value={isEditing ? editingName : drawing.name}
              readOnly={!isEditing}
              onChange={(e) =>
                drawingHandlers.startEditing(drawing.drawingId, e.target.value)
              }
              onBlur={() => {
                if (isEditing) {
                  void drawingHandlers.saveName(drawing.drawingId)
                }
              }}
              onKeyDown={(e) =>
                drawingHandlers.handleNameInputKeyDown(e, drawing.drawingId)
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
                        onOpenNewFolderDialog(drawing.drawingId)
                      }}
                    >
                      <sidebarIcons.Plus className="h-4 w-4" />
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
                              void drawingHandlers.handleMoveDrawingToFolder(
                                drawing.drawingId,
                                folder.folderId
                              )
                            }}
                          >
                            <sidebarIcons.Folder className="h-4 w-4" />
                            {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    void drawingHandlers.handleRemove(drawing.drawingId)
                  }}
                >
                  <sidebarIcons.Trash2 className="h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </>
  )
}

