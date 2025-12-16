import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction
} from "react"

import { type GroupedDrawings, type SidebarDrawing } from "../types"

type SidebarState = {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  editingId: string | null
  setEditingId: Dispatch<SetStateAction<string | null>>
  editingName: string
  setEditingName: Dispatch<SetStateAction<string>>
  editingFolderId: string | null
  setEditingFolderId: Dispatch<SetStateAction<string | null>>
  editingFolderName: string
  setEditingFolderName: Dispatch<SetStateAction<string>>
  creatingFolder: boolean
  setCreatingFolder: Dispatch<SetStateAction<boolean>>
  newFolderName: string
  setNewFolderName: Dispatch<SetStateAction<string>>
  foldersVisible: boolean
  setFoldersVisible: Dispatch<SetStateAction<boolean>>
  expandedFolders: Set<string>
  toggleFolderExpanded: (folderId: string) => void
  searchDialogOpen: boolean
  setSearchDialogOpen: Dispatch<SetStateAction<boolean>>
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  newFolderDialogOpen: boolean
  setNewFolderDialogOpen: Dispatch<SetStateAction<boolean>>
  newFolderDialogName: string
  setNewFolderDialogName: Dispatch<SetStateAction<string>>
  drawingIdToMove: string | null
  setDrawingIdToMove: Dispatch<SetStateAction<string | null>>
  refs: {
    inputRef: MutableRefObject<HTMLInputElement | null>
    folderInputRef: MutableRefObject<HTMLInputElement | null>
    newFolderInputRef: MutableRefObject<HTMLInputElement | null>
    searchInputRef: MutableRefObject<HTMLInputElement | null>
    newFolderDialogInputRef: MutableRefObject<HTMLInputElement | null>
  }
  groupedDrawings: GroupedDrawings
  filteredDrawings: SidebarDrawing[]
}

export function useSidebarState(
  allDrawings: SidebarDrawing[] | undefined
): SidebarState {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [foldersVisible, setFoldersVisible] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set()
  )
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderDialogName, setNewFolderDialogName] = useState("")
  const [drawingIdToMove, setDrawingIdToMove] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const newFolderInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const newFolderDialogInputRef = useRef<HTMLInputElement>(null)

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const groupedDrawings = useMemo<GroupedDrawings>(() => {
    if (!allDrawings) {
      return { uncategorizedDrawings: [], drawingsByFolder: {} }
    }

    const drawingsByFolder: Record<string, SidebarDrawing[]> = {}
    const uncategorizedDrawings: SidebarDrawing[] = []

    for (const drawing of allDrawings) {
      if (drawing.folderId) {
        if (!drawingsByFolder[drawing.folderId]) {
          drawingsByFolder[drawing.folderId] = []
        }
        drawingsByFolder[drawing.folderId].push(drawing)
      } else {
        uncategorizedDrawings.push(drawing)
      }
    }

    return { uncategorizedDrawings, drawingsByFolder }
  }, [allDrawings])

  const filteredDrawings = useMemo(() => {
    if (!allDrawings) return []
    return allDrawings.filter((drawing) =>
      drawing.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allDrawings, searchQuery])

  useEffect(() => {
    if (!editingId || !inputRef.current) return

    const timeoutId = window.setTimeout(() => {
      if (inputRef.current && editingId) {
        inputRef.current.focus()
        window.setTimeout(() => {
          if (
            inputRef.current &&
            editingId &&
            document.activeElement === inputRef.current
          ) {
            inputRef.current.select()
          }
        }, 10)
      }
    }, 150)

    return () => window.clearTimeout(timeoutId)
  }, [editingId])

  useEffect(() => {
    if (!editingFolderId || !folderInputRef.current) return
    const inputEl = folderInputRef.current
    const rafId = requestAnimationFrame(() => {
      inputEl.focus()
      inputEl.select()
    })
    return () => cancelAnimationFrame(rafId)
  }, [editingFolderId])

  useEffect(() => {
    if (!creatingFolder || !newFolderInputRef.current) return
    const timeoutId = window.setTimeout(() => {
      newFolderInputRef.current?.focus()
    }, 50)
    return () => window.clearTimeout(timeoutId)
  }, [creatingFolder])

  useEffect(() => {
    if (!searchDialogOpen || !searchInputRef.current) return
    searchInputRef.current.focus()
  }, [searchDialogOpen])

  useEffect(() => {
    if (!newFolderDialogOpen || !newFolderDialogInputRef.current) return
    const timeoutId = window.setTimeout(() => {
      if (newFolderDialogInputRef.current) {
        newFolderDialogInputRef.current.focus()
        newFolderDialogInputRef.current.select()
      }
    }, 100)
    return () => window.clearTimeout(timeoutId)
  }, [newFolderDialogOpen])

  return {
    isOpen,
    setIsOpen,
    editingId,
    setEditingId,
    editingName,
    setEditingName,
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,
    creatingFolder,
    setCreatingFolder,
    newFolderName,
    setNewFolderName,
    foldersVisible,
    setFoldersVisible,
    expandedFolders,
    toggleFolderExpanded,
    searchDialogOpen,
    setSearchDialogOpen,
    searchQuery,
    setSearchQuery,
    newFolderDialogOpen,
    setNewFolderDialogOpen,
    newFolderDialogName,
    setNewFolderDialogName,
    drawingIdToMove,
    setDrawingIdToMove,
    refs: {
      inputRef,
      folderInputRef,
      newFolderInputRef,
      searchInputRef,
      newFolderDialogInputRef
    },
    groupedDrawings,
    filteredDrawings
  }
}



