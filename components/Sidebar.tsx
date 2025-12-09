"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { useDrawing } from "../context/DrawingContext"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Pencil,
  PanelLeftCloseIcon,
  PanelRightCloseIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./ui/input"

export default function Sidebar() {
  const { currentDrawingId, setCurrentDrawingId } = useDrawing()
  const drawings = useQuery(api.drawings.list)
  const updateName = useMutation(api.drawings.updateName)
  const [isOpen, setIsOpen] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const createNewDrawing = () => {
    const newId = crypto.randomUUID()
    setCurrentDrawingId(newId)
  }

  const startEditing = (
    drawingId: string,
    currentName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setEditingId(drawingId)
    setEditingName(currentName)
  }

  const saveName = async (drawingId: string) => {
    if (editingName.trim() === "") {
      setEditingId(null)
      return
    }
    try {
      await updateName({ drawingId, name: editingName.trim() })
      setEditingId(null)
    } catch (error) {
      console.error("Failed to update name:", error)
    }
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName("")
  }

  const handleNameInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    drawingId: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveName(drawingId)
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEditing()
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  if (!drawings) return null

  return (
    <>
      {/* Toggle Button - Only visible when sidebar is closed */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="icon"
          className="fixed top-4 left-15 z-40 transition-all"
        >
          <PanelRightCloseIcon />
        </Button>
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with Collapse Button & New Button */}
          <div className="flex items-center gap-2 p-4">
            <Button
              onClick={() => setIsOpen(false)}
              variant="secondary"
              size="icon"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftCloseIcon />
            </Button>
            <Button onClick={createNewDrawing} className="flex-1">
              <Plus className="h-4 w-4" /> New Drawing
            </Button>
          </div>

          {/* Drawing List */}
          <ScrollArea className="flex-1 space-y-1 px-2">
            {drawings.length === 0 ? (
              <div className="text-center text-sm text-gray-400 dark:text-slate-500 px-4">
                No drawings yet
              </div>
            ) : (
              drawings.map((drawing) => {
                const isActive = drawing.drawingId === currentDrawingId
                const isEditing = editingId === drawing.drawingId

                return (
                  <div key={drawing._id} className="relative group">
                    <Input
                      ref={isEditing ? inputRef : null}
                      onClick={() => {
                        if (!isEditing) {
                          setCurrentDrawingId(drawing.drawingId)
                        }
                      }}
                      value={isEditing ? editingName : drawing.name}
                      readOnly={!isEditing}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => {
                        if (isEditing) {
                          saveName(drawing.drawingId)
                        }
                      }}
                      onKeyDown={(e) =>
                        handleNameInputKeyDown(e, drawing.drawingId)
                      }
                      className={cn(
                        "border-none shadow-none focus-visible:border-none focus-visible:ring-0",
                        isActive
                          ? "bg-accent cursor-default"
                          : "group-hover:bg-secondary cursor-pointer"
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) =>
                        startEditing(drawing.drawingId, drawing.name, e)
                      }
                      title="Edit name"
                      aria-label="Edit drawing name"
                      className="absolute top-1/2 hover:bg-transparent -translate-y-1/2 right-0 hidden group-hover:inline-flex"
                    >
                      <Pencil />
                    </Button>
                  </div>
                )
              })
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  )
}
