import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { sidebarIcons } from "../constants/sidebar-constants"

type SidebarShellProps = {
  isOpen: boolean
  drawingTheme: "light" | "dark"
  onOpen: () => void
  children: React.ReactNode
}

export function SidebarShell({
  isOpen,
  drawingTheme,
  onOpen,
  children
}: SidebarShellProps) {
  return (
    <>
      {!isOpen && (
        <Button
          onClick={onOpen}
          variant="secondary"
          size="icon"
          className={cn(
            "fixed top-4 left-4 z-40 transition-all",
            drawingTheme === "light"
              ? "bg-[#ECECF3] text-[#1B1B1F] hover:bg-[#F1F0FF]"
              : "bg-[#232329] text-[#E3E3E8] hover:bg-[#363541]"
          )}
        >
          <sidebarIcons.PanelRightCloseIcon />
        </Button>
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-65 bg-sidebar border-r transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">{children}</div>
      </div>
    </>
  )
}

