import { v } from "convex/values"
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
  internalAction
} from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

// Helper function to update user storage total
async function updateUserStorage(ctx: any, userId: string, bytesDelta: number) {
  const existing = await ctx.db
    .query("userStorage")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first()

  if (existing) {
    const newTotal = Math.max(0, existing.totalBytes + bytesDelta)
    await ctx.db.patch(existing._id, { totalBytes: newTotal })
  } else {
    const initialTotal = Math.max(0, bytesDelta)
    await ctx.db.insert("userStorage", {
      userId,
      totalBytes: initialTotal
    })
  }
}

// Helper function to upload files and return storage IDs mapped by fileId
async function uploadFiles(
  ctx: any,
  files: Record<string, any>
): Promise<Record<string, Id<"_storage">>> {
  const fileMap: Record<string, Id<"_storage">> = {}

  for (const [fileId, fileData] of Object.entries(files)) {
    if (!fileData) continue

    // Convert file data to Blob
    // Excalidraw BinaryFiles can have different structures, handle common cases
    let blob: Blob

    if (fileData instanceof Blob) {
      blob = fileData
    } else if (fileData.dataURL) {
      // If it's a data URL, convert directly to blob
      // Data URLs are in format: data:mimeType;base64,base64data
      const dataURL = fileData.dataURL
      const base64Match = dataURL.match(/^data:([^;]+);base64,(.+)$/)
      if (base64Match) {
        const mimeType = base64Match[1]
        const base64Data = base64Match[2]
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        blob = new Blob([bytes], { type: mimeType })
      } else {
        // Try to extract mimeType from fileData if available
        const mimeType = fileData.mimeType || "application/octet-stream"
        // Assume the dataURL is just base64 data
        const base64Data = dataURL.includes(",")
          ? dataURL.split(",")[1]
          : dataURL
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        blob = new Blob([bytes], { type: mimeType })
      }
    } else if (fileData.mimeType && fileData.data) {
      // If it has mimeType and data, create blob from data
      const base64Data =
        typeof fileData.data === "string"
          ? fileData.data.split(",")[1] || fileData.data
          : fileData.data
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      blob = new Blob([bytes], { type: fileData.mimeType })
    } else {
      // Try to convert to JSON and then to blob
      try {
        const jsonString = JSON.stringify(fileData)
        blob = new Blob([jsonString], { type: "application/json" })
      } catch {
        // Skip files we can't process
        continue
      }
    }

    const storageId = await ctx.storage.store(blob)
    fileMap[fileId] = storageId
  }

  return fileMap
}

// Helper function to get file URLs from storage ID map
async function getFileUrls(
  ctx: any,
  fileMap: Record<string, Id<"_storage">> | undefined
): Promise<Record<string, string>> {
  if (!fileMap || Object.keys(fileMap).length === 0) {
    return {}
  }

  const files: Record<string, string> = {}

  for (const [fileId, storageId] of Object.entries(fileMap)) {
    const url = await ctx.storage.getUrl(storageId)
    if (url) {
      files[fileId] = url
    }
  }

  return files
}

// Internal mutation to update user storage
export const updateUserStorageInternal = internalMutation({
  args: {
    userId: v.string(),
    bytesDelta: v.number()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await updateUserStorage(ctx, args.userId, args.bytesDelta)
    return null
  }
})

export const save = mutation({
  args: {
    drawingId: v.string(),
    elements: v.any(),
    appState: v.any(),
    files: v.optional(v.any()) // BinaryFiles from Excalidraw
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId)
      )
      .first()

    // Handle file uploads
    let newFileMap: Record<string, Id<"_storage">> | undefined = undefined
    let oldFileMap: Record<string, Id<"_storage">> | undefined = undefined
    let bytesDelta = 0

    if (args.files && typeof args.files === "object") {
      try {
        // Upload new files
        newFileMap = await uploadFiles(ctx, args.files as Record<string, any>)

        // Calculate size of new files
        for (const storageId of Object.values(newFileMap)) {
          const metadata = await ctx.db.system.get(storageId)
          if (metadata && "size" in metadata) {
            bytesDelta += metadata.size as number
          }
        }
      } catch (error) {
        console.error("Error uploading files:", error)
        // Continue without files if upload fails
      }
    }

    // Get old file IDs if updating existing drawing
    if (existing && existing.files) {
      oldFileMap = existing.files

      // Calculate size of old files to subtract
      for (const storageId of Object.values(oldFileMap)) {
        const metadata = await ctx.db.system.get(storageId)
        if (metadata && "size" in metadata) {
          bytesDelta -= metadata.size as number
        }
      }

      // Delete old files from storage
      for (const storageId of Object.values(oldFileMap)) {
        try {
          await ctx.storage.delete(storageId)
        } catch (error) {
          console.error("Error deleting old file:", error)
        }
      }
    }

    // Update user storage total
    if (bytesDelta !== 0) {
      await updateUserStorage(ctx, userIdString, bytesDelta)
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        elements: args.elements,
        appState: args.appState,
        files: newFileMap
      })
    } else {
      await ctx.db.insert("drawings", {
        userId: userIdString,
        drawingId: args.drawingId,
        name: "Draw",
        elements: args.elements,
        appState: args.appState,
        files: newFileMap,
        isActive: true
      })
    }

    return null
  }
})

export const get = query({
  args: {
    drawingId: v.string()
  },
  returns: v.union(
    v.object({
      _id: v.id("drawings"),
      _creationTime: v.number(),
      userId: v.string(),
      drawingId: v.string(),
      name: v.string(),
      elements: v.any(),
      appState: v.any(),
      files: v.optional(v.record(v.string(), v.string())) // Map of fileId -> URL
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }

    const userIdString = String(userId)
    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId)
      )
      .first()

    if (!drawing || drawing.isActive === false) {
      return null
    }

    // Get file URLs
    const fileUrls = await getFileUrls(ctx, drawing.files)

    return {
      _id: drawing._id,
      _creationTime: drawing._creationTime,
      userId: drawing.userId,
      drawingId: drawing.drawingId,
      name: drawing.name,
      elements: drawing.elements,
      appState: drawing.appState,
      files: Object.keys(fileUrls).length > 0 ? fileUrls : undefined
    }
  }
})

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("drawings"),
      _creationTime: v.number(),
      drawingId: v.string(),
      name: v.string()
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return []
    }

    const userIdString = String(userId)
    const drawings = await ctx.db
      .query("drawings")
      .withIndex("by_userId", (q) => q.eq("userId", userIdString))
      .order("desc")
      .collect()

    // Filter to only return active drawings (isActive !== false)
    // This includes drawings where isActive is true or undefined (backwards compatibility)
    const activeDrawings = drawings.filter((d) => d.isActive !== false)

    // Only return what we need for the list (metadata only)
    return activeDrawings.map((d) => ({
      _id: d._id,
      _creationTime: d._creationTime,
      drawingId: d.drawingId,
      name: d.name
    }))
  }
})

export const getLatest = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }

    const userIdString = String(userId)
    // Efficiently get the single most recent drawing
    const latest = await ctx.db
      .query("drawings")
      .withIndex("by_userId", (q) => q.eq("userId", userIdString))
      .order("desc") // Most recent first
      .first()

    return latest ? latest.drawingId : null
  }
})

export const updateName = mutation({
  args: {
    drawingId: v.string(),
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
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId)
      )
      .first()

    if (!existing || existing.isActive === false) {
      throw new Error("Drawing not found")
    }

    await ctx.db.patch(existing._id, {
      name: args.name
    })

    return null
  }
})

export const remove = mutation({
  args: {
    drawingId: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId)
      )
      .first()

    if (!existing || existing.isActive === false) {
      throw new Error("Drawing not found")
    }

    // Step 1: Set isActive to false (soft delete)
    await ctx.db.patch(existing._id, {
      isActive: false
    })

    // Step 2: Schedule action to delete files from storage (per chunks)
    // The action will handle file deletion and then call internal mutation to complete deletion
    await ctx.scheduler.runAfter(
      0,
      internal.drawings.deleteDrawingFilesInternal,
      {
        drawingId: args.drawingId,
        userId: userIdString
      }
    )

    return null
  }
})

export const getUserStorage = query({
  args: {},
  returns: v.object({
    totalBytes: v.number()
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return { totalBytes: 0 }
    }

    const userIdString = String(userId)
    const storage = await ctx.db
      .query("userStorage")
      .withIndex("by_userId", (q) => q.eq("userId", userIdString))
      .first()

    return { totalBytes: storage?.totalBytes ?? 0 }
  }
})

// Internal query to get drawing with files for deletion
export const getDrawingWithFiles = internalQuery({
  args: {
    drawingId: v.string(),
    userId: v.string()
  },
  returns: v.union(
    v.object({
      _id: v.id("drawings"),
      files: v.optional(v.record(v.string(), v.id("_storage")))
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", args.userId).eq("drawingId", args.drawingId)
      )
      .first()

    if (!drawing) {
      return null
    }

    return {
      _id: drawing._id,
      files: drawing.files
    }
  }
})

// Internal query to get file size metadata
export const getFileSize = internalQuery({
  args: {
    storageId: v.id("_storage")
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const metadata = await ctx.db.system.get(args.storageId)
    if (metadata && "size" in metadata) {
      return metadata.size as number
    }
    return 0
  }
})

// Internal mutation to complete deletion after files are deleted
export const completeDrawingDeletion = internalMutation({
  args: {
    drawingId: v.string(),
    userId: v.string(),
    totalBytesDeleted: v.number()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", args.userId).eq("drawingId", args.drawingId)
      )
      .first()

    if (!existing) {
      // Drawing already deleted or not found
      return null
    }

    // Update user storage total (subtract bytes from deleted files)
    if (args.totalBytesDeleted > 0) {
      await updateUserStorage(ctx, args.userId, -args.totalBytesDeleted)
    }

    // Finally delete the drawing document from the database
    await ctx.db.delete(existing._id)

    return null
  }
})

// Internal action to delete files from storage
export const deleteDrawingFilesInternal = internalAction({
  args: {
    drawingId: v.string(),
    userId: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the drawing with files
    const drawing: {
      _id: Id<"drawings">
      files: Record<string, Id<"_storage">> | undefined
    } | null = await ctx.runQuery(internal.drawings.getDrawingWithFiles, {
      drawingId: args.drawingId,
      userId: args.userId
    })

    if (!drawing || !drawing.files || Object.keys(drawing.files).length === 0) {
      // No files to delete, just complete the deletion
      await ctx.runMutation(internal.drawings.completeDrawingDeletion, {
        drawingId: args.drawingId,
        userId: args.userId,
        totalBytesDeleted: 0
      })
      return null
    }

    let totalBytesDeleted = 0

    // Delete each file from storage (one per file/chunk)
    for (const storageId of Object.values(drawing.files)) {
      try {
        // Get file size before deleting
        const fileSize: number = await ctx.runQuery(
          internal.drawings.getFileSize,
          { storageId }
        )
        totalBytesDeleted += fileSize

        // Delete file from storage
        await ctx.storage.delete(storageId)
      } catch (error) {
        console.error("Error deleting file:", error)
        // Continue with other files even if one fails
      }
    }

    // Complete the deletion by updating storage and deleting the document
    await ctx.runMutation(internal.drawings.completeDrawingDeletion, {
      drawingId: args.drawingId,
      userId: args.userId,
      totalBytesDeleted
    })

    return null
  }
})
