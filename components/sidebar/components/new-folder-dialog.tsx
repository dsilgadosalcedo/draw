import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  type KeyboardEvent,
  type MutableRefObject,
  type RefObject
} from "react"

type NewFolderDialogProps = {
  open: boolean
  onOpenChange: (value: boolean) => void
  newFolderDialogName: string
  onFolderNameChange: (value: string) => void
  onBlur: () => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  inputRef:
    | MutableRefObject<HTMLInputElement | null>
    | RefObject<HTMLInputElement | null>
}

export function NewFolderDialog({
  open,
  onOpenChange,
  newFolderDialogName,
  onFolderNameChange,
  onBlur,
  onKeyDown,
  inputRef
}: NewFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            ref={inputRef}
            placeholder="Folder name"
            value={newFolderDialogName}
            onChange={(e) => onFolderNameChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}







