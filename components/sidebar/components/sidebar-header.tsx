import { Button } from "@/components/ui/button"

import { sidebarIcons } from "../constants/sidebar-constants"

type SidebarHeaderProps = {
  onNewDrawing: () => void
  onOpenSearch: () => void
}

export function SidebarHeader({
  onNewDrawing,
  onOpenSearch
}: SidebarHeaderProps) {
  return (
    <header className="flex flex-col items-center gap-2 pt-5 pb-2">
      <div className="flex items-center gap-2 w-full px-2">
        <Button
          variant="ghost"
          size="icon"
          title="App logo"
          aria-label="App logo"
        >
          <sidebarIcons.LineSquiggleIcon className="size-5" />
        </Button>
      </div>

      <div className="px-1 w-full">
        <Button
          onClick={onNewDrawing}
          className="w-full justify-start font-normal"
          variant="ghost"
        >
          <sidebarIcons.Plus className="h-4 w-4" /> New drawing
        </Button>
        <Button
          onClick={onOpenSearch}
          className="w-full justify-start font-normal"
          variant="ghost"
        >
          <sidebarIcons.SearchIcon /> Search drawings
        </Button>
      </div>
    </header>
  )
}
