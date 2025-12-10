import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  drawings: defineTable({
    userId: v.string(),
    drawingId: v.string(),
    name: v.string(),
    elements: v.any(),
    appState: v.any(),
    files: v.optional(v.record(v.string(), v.id("_storage"))) // Map of fileId -> storageId
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_drawingId", ["userId", "drawingId"]),
  userStorage: defineTable({
    userId: v.string(),
    totalBytes: v.number()
  }).index("by_userId", ["userId"])
})
