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

type Collaborator = {
  collaboratorUserId: string
  email?: string
  name?: string
}

type ShareDialogProps = {
  open: boolean
  targetName: string | null
  email: string
  error: string | null
  loading: boolean
  removingIds: Set<string>
  collaborators?: Collaborator[]
  onOpenChange: (open: boolean) => void
  onEmailChange: (value: string) => void
  onSubmit: () => void
  onRemove: (collaboratorUserId: string) => void
}

export function ShareDialog({
  open,
  targetName,
  email,
  error,
  loading,
  removingIds,
  collaborators,
  onOpenChange,
  onEmailChange,
  onSubmit,
  onRemove
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share drawing</DialogTitle>
          <DialogDescription>
            {targetName
              ? `Add a collaborator to "${targetName}".`
              : "Add a collaborator by email."}
          </DialogDescription>
        </DialogHeader>

        {collaborators && collaborators.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Current collaborators
            </p>
            <div className="space-y-1 rounded-lg border p-2">
              {collaborators.map((collab) => {
                const isRemoving = removingIds.has(collab.collaboratorUserId)
                return (
                  <div
                    key={collab.collaboratorUserId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{collab.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(collab.collaboratorUserId)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="username"
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            disabled={loading || email.trim().length === 0}
          >
            {loading ? "Adding..." : "Add collaborator"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
