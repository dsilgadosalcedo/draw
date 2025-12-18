import { Button } from "@/components/ui/button"

import { sidebarIcons, formatStorage } from "../constants/sidebar-constants"

type StorageFooterProps = {
  userStorage?: { totalBytes: number } | null
  onSignOut: () => Promise<void> | void
}

export function StorageFooter({ userStorage, onSignOut }: StorageFooterProps) {
  return (
    <div className="px-2 py-3 border-t space-y-2">
      {userStorage && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-muted-foreground text-sm">
          <sidebarIcons.HardDrive className="h-4 w-4" />
          <span className="flex-1">Storage used</span>
          <span className="font-medium">
            {formatStorage(userStorage.totalBytes)}
          </span>
        </div>
      )}
      <Button
        onClick={onSignOut}
        variant="outline"
        className="w-full font-normal"
      >
        <sidebarIcons.LogOut />
        Sign out
      </Button>
    </div>
  )
}







