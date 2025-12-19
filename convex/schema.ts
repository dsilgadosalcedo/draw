import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"
import {
  excalidrawElement,
  excalidrawAppState
} from "./validators/excalidraw_validators"

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,

  drawings: defineTable({
    userId: v.string(),
    drawingId: v.string(),
    name: v.string(),
    elements: excalidrawElement,
    appState: excalidrawAppState,
    files: v.optional(v.record(v.string(), v.id("_storage"))), // Map of fileId -> storageId
    isActive: v.optional(v.boolean()),
    folderId: v.optional(v.string())
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_drawingId", ["userId", "drawingId"])
    .index("by_drawingId", ["drawingId"])
    .index("by_folderId", ["folderId"]),

  folders: defineTable({
    userId: v.string(),
    folderId: v.string(),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean())
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_folderId", ["userId", "folderId"]),

  userStorage: defineTable({
    userId: v.string(),
    totalBytes: v.number()
  }).index("by_userId", ["userId"]),

  drawingCollaborators: defineTable({
    drawingId: v.string(),
    collaboratorUserId: v.string(),
    addedByUserId: v.string()
  })
    .index("by_collaboratorUserId", ["collaboratorUserId"])
    .index("by_drawingId", ["drawingId"])
    .index("by_collaborator_and_drawingId", ["collaboratorUserId", "drawingId"])
})
