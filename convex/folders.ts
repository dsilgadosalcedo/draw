import { v } from "convex/values"
import {
  query,
  mutation,
  action,
  internalMutation,
  internalAction
} from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { api, internal } from "./_generated/api"

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("folders"),
      _creationTime: v.number(),
      folderId: v.string(),
      name: v.string()
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return []
    }

    const userIdString = String(userId)
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_userId", (q) => q.eq("userId", userIdString))
      .order("desc")
      .collect()

    // Filter to only return active folders (isActive !== false)
    const activeFolders = folders.filter((f) => f.isActive !== false)

    return activeFolders.map((f) => ({
      _id: f._id,
      _creationTime: f._creationTime,
      folderId: f.folderId,
      name: f.name
    }))
  }
})

export const create = mutation({
  args: {
    name: v.string()
  },
  returns: v.object({
    folderId: v.string()
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const folderId = crypto.randomUUID()

    await ctx.db.insert("folders", {
      userId: userIdString,
      folderId,
      name: args.name.trim() || "New folder",
      isActive: true
    })

    return { folderId }
  }
})

export const updateName = mutation({
  args: {
    folderId: v.string(),
    name: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const existing = await ctx.db
      .query("folders")
      .withIndex("by_userId_and_folderId", (q) =>
        q.eq("userId", userIdString).eq("folderId", args.folderId)
      )
      .first()

    if (!existing || existing.isActive === false) {
      throw new Error("Folder not found")
    }

    await ctx.db.patch(existing._id, {
      name: args.name.trim()
    })

    return null
  }
})

export const remove = mutation({
  args: {
    folderId: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const existing = await ctx.db
      .query("folders")
      .withIndex("by_userId_and_folderId", (q) =>
        q.eq("userId", userIdString).eq("folderId", args.folderId)
      )
      .first()

    if (!existing || existing.isActive === false) {
      throw new Error("Folder not found")
    }

    // Step 1: Mark folder as inactive
    await ctx.db.patch(existing._id, {
      isActive: false
    })

    // Step 2: Get all drawings in this folder and mark them as inactive
    const drawings = await ctx.db
      .query("drawings")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
      .collect()

    const activeDrawings = drawings.filter((d) => d.isActive !== false)

    // Mark all drawings as inactive
    for (const drawing of activeDrawings) {
      await ctx.db.patch(drawing._id, {
        isActive: false
      })

      // Schedule action to delete files from storage for each drawing
      await ctx.scheduler.runAfter(
        0,
        internal.drawings.deleteDrawingFilesInternal,
        {
          drawingId: drawing.drawingId,
          userId: userIdString
        }
      )
    }

    // Step 3: Schedule action to complete folder deletion after all drawings are processed
    // We wait a bit longer to ensure drawing file deletions have time to complete
    // The exact timing isn't critical since everything is already marked inactive
    await ctx.scheduler.runAfter(
      1000, // 1 second delay to allow drawing deletions to start
      internal.folders.completeFolderDeletion,
      {
        folderId: args.folderId,
        userId: userIdString
      }
    )

    return null
  }
})

// Internal mutation to complete folder deletion
export const completeFolderDeletion = internalMutation({
  args: {
    folderId: v.string(),
    userId: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("folders")
      .withIndex("by_userId_and_folderId", (q) =>
        q.eq("userId", args.userId).eq("folderId", args.folderId)
      )
      .first()

    if (!existing) {
      // Folder already deleted or not found
      return null
    }

    // Finally delete the folder document from the database
    await ctx.db.delete(existing._id)

    return null
  }
})

export const moveDrawingToFolder = mutation({
  args: {
    drawingId: v.string(),
    folderId: v.union(v.string(), v.null())
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)

    // Verify the drawing exists and belongs to the user
    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId)
      )
      .first()

    if (!drawing || drawing.isActive === false) {
      throw new Error("Drawing not found")
    }

    // If folderId is provided, verify the folder exists and belongs to the user
    if (args.folderId !== null) {
      const folderId = args.folderId // TypeScript now knows this is string, not null
      const folder = await ctx.db
        .query("folders")
        .withIndex("by_userId_and_folderId", (q) =>
          q.eq("userId", userIdString).eq("folderId", folderId)
        )
        .first()

      if (!folder || folder.isActive === false) {
        throw new Error("Folder not found")
      }
    }

    // Update the drawing's folderId
    await ctx.db.patch(drawing._id, {
      folderId: args.folderId ?? undefined
    })

    return null
  }
})
