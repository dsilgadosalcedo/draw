import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { type MutableRefObject, type RefObject } from "react"

import { Button } from "@/components/ui/button"
import { type SidebarDrawing } from "../types"

type SearchDialogProps = {
  open: boolean
  onOpenChange: (value: boolean) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  filteredDrawings: SidebarDrawing[]
  currentDrawingId: string | null
  onSelectDrawing: (drawingId: string) => void
  searchInputRef:
    | MutableRefObject<HTMLInputElement | null>
    | RefObject<HTMLInputElement | null>
  onCloseSidebar: () => void
}

export function SearchDialog({
  open,
  onOpenChange,
  searchQuery,
  onSearchQueryChange,
  filteredDrawings,
  currentDrawingId,
  onSelectDrawing,
  searchInputRef,
  onCloseSidebar
}: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-169.5 w-full h-110.5 p-0 flex flex-col">
        <DialogHeader className="h-16 flex-row items-center px-4 border-b">
          <VisuallyHidden>
            <DialogTitle>Search Drawings</DialogTitle>
          </VisuallyHidden>
          <Input
            ref={searchInputRef}
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full border-none shadow-none focus-visible:border-none focus-visible:ring-0"
          />
        </DialogHeader>
        <ScrollArea className="max-h-[356px] flex-1 px-2">
          {filteredDrawings.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              {searchQuery ? "No drawings found" : "Start typing to search..."}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDrawings.map((drawing) => {
                const isActive = drawing.drawingId === currentDrawingId
                return (
                  <Button
                    key={drawing._id}
                    onClick={() => {
                      onSelectDrawing(drawing.drawingId)
                      onOpenChange(false)
                      onSearchQueryChange("")
                      onCloseSidebar()
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
  )
}


