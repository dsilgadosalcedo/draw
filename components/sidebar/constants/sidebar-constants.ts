import {
  BarChart3,
  BookOpen,
  Brain,
  Braces,
  Cake,
  CircleDollarSign,
  Clover,
  Briefcase,
  Dumbbell,
  Folder,
  FolderPlus,
  Globe2,
  GraduationCap,
  HardDrive,
  Heart,
  LineSquiggleIcon,
  ListTodo,
  LogOut,
  MoreVertical,
  Music,
  Palette,
  PanelLeftIcon,
  PanelRightCloseIcon,
  PawPrint,
  PenLine,
  Pencil,
  Plane,
  Plus,
  Scale,
  SearchIcon,
  Sprout,
  Stethoscope,
  TerminalSquare,
  Trash2,
  UserRound,
  Wrench,
  FlaskConical,
  ChevronDown
} from "lucide-react"
import { type CSSProperties, type ComponentType } from "react"

type FolderIconComponent = ComponentType<{
  className?: string
  style?: CSSProperties
}>

export const FOLDER_COLORS = [
  { value: "default", label: "Default" },
  { value: "gray", label: "Gray" },
  { value: "brown", label: "Brown" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "red", label: "Red" }
] as const

export const FOLDER_ICONS = [
  { value: "folder", label: "Folder", Icon: Folder },
  { value: "circle-dollar-sign", label: "Money", Icon: CircleDollarSign },
  { value: "book-open", label: "Book", Icon: BookOpen },
  { value: "graduation-cap", label: "Education", Icon: GraduationCap },
  { value: "pencil", label: "Pencil", Icon: Pencil },
  { value: "pen-line", label: "Pen", Icon: PenLine },
  { value: "braces", label: "Code", Icon: Braces },
  { value: "terminal-square", label: "Terminal", Icon: TerminalSquare },
  { value: "music", label: "Music", Icon: Music },
  { value: "cake", label: "Celebration", Icon: Cake },
  { value: "palette", label: "Art", Icon: Palette },
  { value: "stethoscope", label: "Health", Icon: Stethoscope },
  { value: "clover", label: "Luck", Icon: Clover },
  { value: "briefcase", label: "Work", Icon: Briefcase },
  { value: "bar-chart-3", label: "Analytics", Icon: BarChart3 },
  { value: "user-round", label: "Person", Icon: UserRound },
  { value: "dumbbell", label: "Fitness", Icon: Dumbbell },
  { value: "list-todo", label: "Tasks", Icon: ListTodo },
  { value: "scale", label: "Legal", Icon: Scale },
  { value: "globe-2", label: "Globe", Icon: Globe2 },
  { value: "plane", label: "Travel", Icon: Plane },
  { value: "wrench", label: "Tools", Icon: Wrench },
  { value: "paw-print", label: "Pets", Icon: PawPrint },
  { value: "flask-conical", label: "Science", Icon: FlaskConical },
  { value: "brain", label: "Ideas", Icon: Brain },
  { value: "heart", label: "Heart", Icon: Heart },
  { value: "sprout", label: "Growth", Icon: Sprout }
] as const

export type FolderIconKey = (typeof FOLDER_ICONS)[number]["value"]

export const folderIconMap: Record<FolderIconKey, FolderIconComponent> =
  FOLDER_ICONS.reduce<Record<FolderIconKey, FolderIconComponent>>(
    (acc, { value, Icon }) => {
      acc[value] = Icon
      return acc
    },
    {} as Record<FolderIconKey, FolderIconComponent>
  )

export function formatStorage(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const sidebarIcons = {
  Plus,
  MoreVertical,
  PanelRightCloseIcon,
  LogOut,
  LineSquiggleIcon,
  SearchIcon,
  PanelLeftIcon,
  Pencil,
  Trash2,
  HardDrive,
  FolderPlus,
  ChevronDown,
  Palette,
  Folder
}
