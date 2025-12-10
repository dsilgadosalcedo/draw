import { mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Migration to convert files field from array to record format.
 * This migration converts:
 * - files: [] (empty array) -> files: undefined
 * - files: [id1, id2, ...] (array) -> files: undefined (orphaned files without fileId mapping)
 *
 * Run with: npm run migrate:files
 *
 * Note: This is a one-time migration. After running, you can delete this function.
 */
export const migrateFilesField = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number()
  }),
  handler: async (ctx) => {
    let updated = 0
    let skipped = 0

    // Get all drawings
    const drawings = await ctx.db.query("drawings").collect()

    for (const drawing of drawings) {
      let needsUpdate = false
      const updates: { files?: undefined; isActive?: boolean } = {}

      // Check if files is an array (old format)
      if (Array.isArray(drawing.files)) {
        // Convert array to undefined since we don't have fileId mappings
        updates.files = undefined
        needsUpdate = true
      }

      // Set isActive to true for existing drawings that don't have it set
      if (drawing.isActive === undefined) {
        updates.isActive = true
        needsUpdate = true
      }

      if (needsUpdate) {
        await ctx.db.patch(drawing._id, updates)
        updated++
      } else {
        skipped++
      }
    }

    return { updated, skipped }
  }
})
