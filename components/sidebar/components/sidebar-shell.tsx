import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { sidebarIcons } from "../constants/sidebar-constants"

type SidebarShellProps = {
  isOpen: boolean
  drawingTheme: "light" | "dark"
  onOpen: () => void
  onClose: () => void
  children: React.ReactNode
}

export function SidebarShell({
  isOpen,
  drawingTheme,
  onOpen,
  onClose,
  children
}: SidebarShellProps) {
  const themeButtonClass =
    drawingTheme === "light"
      ? "bg-[#ECECF3] text-[#1B1B1F] hover:bg-[#F1F0FF]"
      : "bg-[#232329] text-[#E3E3E8] hover:bg-[#363541]"

  return (
    <>
      <Button
        onClick={isOpen ? onClose : onOpen}
        variant="secondary"
        size="icon"
        className={cn(
          "fixed top-4 z-40 transition-all duration-300 ease-in-out",
          isOpen ? "left-[17rem]" : "left-4",
          themeButtonClass
        )}
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <sidebarIcons.PanelLeftIcon />
        ) : (
          <sidebarIcons.PanelRightCloseIcon />
        )}
      </Button>
      <aside
        className={cn(
          "flex flex-col h-full flex-shrink-0 bg-sidebar border-r transition-[width] duration-300 ease-in-out overflow-hidden",
          isOpen ? "w-65" : "w-0"
        )}
      >
        {isOpen && <div className="flex flex-col h-full">{children}</div>}
      </aside>
    </>
  )
}
