import { type CSSProperties, type ComponentType } from "react"

import {
  FOLDER_COLORS,
  FOLDER_ICONS,
  type FolderIconKey
} from "./constants/sidebar-constants"

export type SidebarDrawing = {
  _id: string
  _creationTime: number
  drawingId: string
  name: string
  folderId?: string | null
}

export type SidebarFolder = {
  _id: string
  _creationTime: number
  folderId: string
  name: string
  icon?: string | null
  color?: string | null
}

export type GroupedDrawings = {
  uncategorizedDrawings: SidebarDrawing[]
  drawingsByFolder: Record<string, SidebarDrawing[]>
}

export type FolderColorOption = (typeof FOLDER_COLORS)[number]
export type FolderIconOption = (typeof FOLDER_ICONS)[number]

export type FolderIconComponent = ComponentType<{
  className?: string
  style?: CSSProperties
}>

export type FolderIconMap = Record<FolderIconKey, FolderIconComponent>

