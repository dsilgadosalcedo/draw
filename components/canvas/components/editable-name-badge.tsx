"use client"

import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
  type KeyboardEvent
} from "react"
import { cn } from "@/lib/utils"
import { type EditableNameBadgeProps } from "../types"

export function EditableNameBadge({
  drawingId,
  name,
  theme = "dark"
}: EditableNameBadgeProps) {
  const updateName = useMutation(api.drawings.updateName)
  // Use lazy initializer: only show "Untitled" if name is explicitly empty string, not if undefined
  const [draft, setDraft] = useState<string>(() => {
    if (name === undefined || name === null) {
      return "" // Empty string while loading, prevents "Untitled" flash
    }
    return name.trim() || "Untitled"
  })
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingFromPropRef = useRef(false)
  const prevNameRef = useRef<string | undefined | null>(name)

  // Update draft when name prop changes (e.g., when drawing loads)
  useEffect(() => {
    if (name !== undefined && name !== null && prevNameRef.current !== name) {
      const trimmedName = name.trim() || "Untitled"
      prevNameRef.current = name
      isUpdatingFromPropRef.current = true
      // Use setTimeout to defer state update and avoid synchronous setState in effect
      setTimeout(() => {
        setDraft(trimmedName)
        // Reset flag after state update
        setTimeout(() => {
          isUpdatingFromPropRef.current = false
        }, 0)
      }, 0)
    } else if (name === undefined || name === null) {
      prevNameRef.current = name
    }
  }, [name])

  const clearPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
  }, [])

  const persistName = useCallback(
    async (value: string) => {
      if (!drawingId) return
      // Don't save if we're currently updating from prop (to prevent overwriting with stale draft value)
      if (isUpdatingFromPropRef.current) {
        return
      }
      const nextValue = value.trim() || "Untitled"
      // Don't save "Untitled" if:
      // 1. The name prop is undefined (drawing hasn't loaded yet) - prevents saving before drawing exists
      // 2. The name prop exists and is not "Untitled" (prevents overwriting real name with default)
      if (
        nextValue === "Untitled" &&
        (name === undefined ||
          name === null ||
          (name && name.trim() !== "Untitled"))
      ) {
        return
      }
      try {
        await updateName({ drawingId, name: nextValue })
      } catch (error) {
        console.error("Failed to update drawing name:", error)
      }
    },
    [drawingId, updateName, name]
  )

  const scheduleSave = useCallback(
    (value: string) => {
      if (!drawingId) return
      clearPendingSave()
      const nextValue = value.trim() || "Untitled"
      saveTimeoutRef.current = setTimeout(() => {
        void persistName(nextValue)
        saveTimeoutRef.current = null
      }, 600)
    },
    [clearPendingSave, drawingId, persistName]
  )

  useEffect(() => {
    return () => clearPendingSave()
  }, [clearPendingSave])

  const handleBlur = useCallback(() => {
    clearPendingSave()
    void persistName(draft)
  }, [clearPendingSave, draft, persistName])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        ;(event.currentTarget as HTMLInputElement).blur()
      } else if (event.key === "Escape") {
        event.currentTarget.blur()
      }
    },
    []
  )

  const themeClass = useMemo(
    () => (theme === "dark" ? "text-[#E3E3E8]" : "text-[#1B1B1F]"),
    [theme]
  )

  return (
    <div className="hidden lg:flex pointer-events-auto absolute left-28 top-4 z-30 h-9 items-center">
      <input
        key={drawingId ?? "no-drawing"}
        type="text"
        value={draft || ""}
        placeholder={!draft ? "Untitled" : ""}
        onBlur={handleBlur}
        onChange={(event) => {
          const nextValue = event.target.value
          setDraft(nextValue)
          scheduleSave(nextValue)
        }}
        onKeyDown={handleKeyDown}
        disabled={!drawingId}
        aria-label="Drawing name"
        className={cn(
          "w-full min-w-[140px] bg-transparent border-none p-0 m-0 text-md font-medium",
          "outline-none focus:outline-none focus:ring-0 focus:border-none",
          "shadow-none rounded-none caret-inherit selection:bg-transparent",
          "placeholder:text-muted-foreground",
          "disabled:opacity-80 disabled:cursor-not-allowed",
          themeClass
        )}
        style={{
          WebkitAppearance: "none"
        }}
      />
    </div>
  )
}
