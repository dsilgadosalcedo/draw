import { v } from "convex/values"
import {
  query,
  mutation,
  action,
  internalMutation,
  internalQuery,
  internalAction
} from "./_generated/server"
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id, Doc } from "./_generated/dataModel"
import { api, internal } from "./_generated/api"
import {
  excalidrawElement,
  excalidrawAppState,
  binaryFiles
} from "./validators/excalidraw-validators"

// Type for Excalidraw file data (can be Blob, dataURL, or mimeType+data)
type ExcalidrawFileData =
  | Blob
  | { dataURL: string; mimeType?: string }
  | { mimeType: string; data: string | Uint8Array }

// Type guard to check if fileData has dataURL
function hasDataURL(
  fileData: ExcalidrawFileData
): fileData is { dataURL: string; mimeType?: string } {
  return (
    typeof fileData === "object" &&
    !(fileData instanceof Blob) &&
    "dataURL" in fileData
  )
}

// Type guard to check if fileData has mimeType and data
function hasMimeTypeAndData(
  fileData: ExcalidrawFileData
): fileData is { mimeType: string; data: string | Uint8Array } {
  return (
    typeof fileData === "object" &&
    !(fileData instanceof Blob) &&
    "mimeType" in fileData &&
    "data" in fileData
  )
}

// Helper function to update user storage total
async function updateUserStorage(
  ctx: MutationCtx,
  userId: string,
  bytesDelta: number
) {
  const existing = await ctx.db
    .query("userStorage")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
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

// Helper to convert diverse payloads coming from Excalidraw into blobs
function toBlob(fileData: ExcalidrawFileData): Blob | null {
  if (!fileData) return null

  if (fileData instanceof Blob) {
    return fileData
  }

  if (hasDataURL(fileData)) {
    const dataURL: string = fileData.dataURL
    const base64Match = dataURL.match(/^data:([^;]+);base64,(.+)$/)
    const base64Data = base64Match
      ? base64Match[2]
      : (dataURL.split(",")[1] ?? dataURL)
    const mimeType =
      base64Match?.[1] ?? fileData.mimeType ?? "application/octet-stream"
    const binary = atob(base64Data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  }

  if (hasMimeTypeAndData(fileData)) {
    let base64Data: string
    if (typeof fileData.data === "string") {
      base64Data = fileData.data.split(",")[1] ?? fileData.data
    } else {
      // Convert Uint8Array to base64 string
      const binaryString = Array.from(fileData.data)
        .map((byte) => String.fromCharCode(byte))
        .join("")
      base64Data = btoa(binaryString)
    }
    const binary = atob(base64Data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: fileData.mimeType })
  }

  try {
    const jsonString = JSON.stringify(fileData)
    return new Blob([jsonString], { type: "application/json" })
  } catch {
    return null
  }
}

// Helper function to upload files and return storage IDs mapped by fileId
async function uploadFiles(
  ctx: ActionCtx,
  files: Record<string, ExcalidrawFileData>
): Promise<{ fileMap: Record<string, Id<"_storage">>; totalBytes: number }> {
  const fileMap: Record<string, Id<"_storage">> = {}
  let totalBytes = 0

  for (const [fileId, fileData] of Object.entries(files)) {
    const blob = toBlob(fileData)
    if (!blob) continue

    const storageId = await ctx.storage.store(blob)
    totalBytes += blob.size
    fileMap[fileId] = storageId
  }

  return { fileMap, totalBytes }
}

// Helper function to get file URLs from storage ID map
async function getFileUrls(
  ctx: QueryCtx | ActionCtx,
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

type DrawingAccessRole = "owner" | "collaborator" | null

async function loadDrawingAndRole(
  ctx: QueryCtx | MutationCtx,
  drawingId: string,
  userId: string
): Promise<{ drawing: Doc<"drawings"> | null; role: DrawingAccessRole }> {
  const drawing = await ctx.db
    .query("drawings")
    .withIndex("by_drawingId", (q) => q.eq("drawingId", drawingId))
    .first()

  if (!drawing || drawing.isActive === false) {
    return { drawing: drawing ?? null, role: null }
  }

  if (drawing.userId === userId) {
    return { drawing, role: "owner" }
  }

  const collaborator = await ctx.db
    .query("drawingCollaborators")
    .withIndex("by_collaborator_and_drawingId", (q) =>
      q.eq("collaboratorUserId", userId).eq("drawingId", drawingId)
    )
    .first()

  if (collaborator) {
    return { drawing, role: "collaborator" }
  }

  return { drawing, role: null }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
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
    elements: excalidrawElement,
    appState: excalidrawAppState,
    files: v.optional(v.record(v.string(), v.id("_storage"))) // Map of fileId -> storageId
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const { drawing: existing, role } = await loadDrawingAndRole(
      ctx,
      args.drawingId,
      userIdString
    )

    if (existing && existing.isActive === false) {
      throw new Error("Drawing not found")
    }

    if (existing && role === null) {
      throw new Error("Unauthorized")
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        elements: args.elements,
        appState: args.appState,
        files: args.files
      })
    } else {
      await ctx.db.insert("drawings", {
        userId: userIdString,
        drawingId: args.drawingId,
        name: "Drawing",
        elements: args.elements,
        appState: args.appState,
        files: args.files,
        isActive: true
      })
    }

    return null
  }
})

/**
 * Saves drawing with file handling (uploads new files, deletes removed files)
 *
 * This action handles the complete file lifecycle:
 * - Uploads new files to Convex storage
 * - Keeps existing files that are still present
 * - Deletes files that were removed from the drawing
 * - Updates user storage totals
 *
 * @param args - Drawing ID, elements, appState, and BinaryFiles
 * @returns null
 * @throws {Error} "Unauthorized" if user doesn't have access
 * @throws {Error} "Drawing not found" if drawing is inactive
 *
 * @example
 * ```typescript
 * await saveWithFiles({
 *   drawingId: "drawing-123",
 *   elements: [...],
 *   appState: {...},
 *   files: {fileId: Blob}
 * })
 * ```
 */
export const saveWithFiles = action({
  args: {
    drawingId: v.string(),
    elements: excalidrawElement,
    appState: excalidrawAppState,
    files: binaryFiles // BinaryFiles from Excalidraw
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)

    const access = await ctx.runQuery(internal.drawings.getDrawingWithFiles, {
      drawingId: args.drawingId,
      userId: userIdString
    })

    if (access.status === "forbidden") {
      throw new Error("Unauthorized")
    }

    if (access.status === "inactive") {
      throw new Error("Drawing not found")
    }

    const existing = access.drawing ?? null

    let newFileMap: Record<string, Id<"_storage">> | undefined = undefined
    let bytesDelta = 0

    const providedFiles =
      args.files &&
      typeof args.files === "object" &&
      Object.keys(args.files).length > 0

    if (providedFiles) {
      const incomingFiles = args.files as Record<string, ExcalidrawFileData>
      const existingFiles = existing?.files ?? {}
      const mergedFileMap: Record<string, Id<"_storage">> = {}

      // 1) Keep existing files that are still present (no re-upload)
      for (const [fileId, storageId] of Object.entries(existingFiles)) {
        if (incomingFiles[fileId]) {
          mergedFileMap[fileId] = storageId
        }
      }

      // 2) Upload only truly new files (ids not already stored)
      const filesToUpload: Record<string, ExcalidrawFileData> = {}
      for (const [fileId, fileData] of Object.entries(incomingFiles)) {
        if (!existingFiles[fileId]) {
          filesToUpload[fileId] = fileData
        }
      }

      try {
        const { fileMap, totalBytes } =
          Object.keys(filesToUpload).length > 0
            ? await uploadFiles(ctx, filesToUpload)
            : { fileMap: {}, totalBytes: 0 }

        newFileMap = { ...mergedFileMap, ...fileMap }
        bytesDelta += totalBytes
      } catch (error) {
        console.error("Error uploading files:", error)
      }

      // 3) Delete files that were removed from the drawing
      for (const [fileId, storageId] of Object.entries(existingFiles)) {
        if (!incomingFiles[fileId]) {
          try {
            const size: number = await ctx.runQuery(
              internal.drawings.getFileSize,
              {
                storageId
              }
            )
            bytesDelta -= size
          } catch (error) {
            console.error("Error getting old file size:", error)
          }

          try {
            await ctx.storage.delete(storageId)
          } catch (error) {
            if ((error as Error)?.message?.includes("not found")) {
              continue
            }
            console.error("Error deleting old file:", error)
          }
        }
      }
    }

    if (bytesDelta !== 0) {
      await ctx.runMutation(internal.drawings.updateUserStorageInternal, {
        userId: userIdString,
        bytesDelta
      })
    }

    await ctx.runMutation(api.drawings.save, {
      drawingId: args.drawingId,
      elements: args.elements,
      appState: args.appState,
      files: newFileMap ?? existing?.files ?? undefined
    })

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
      elements: excalidrawElement,
      appState: excalidrawAppState,
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
    const { drawing, role } = await loadDrawingAndRole(
      ctx,
      args.drawingId,
      userIdString
    )

    if (!drawing || drawing.isActive === false || role === null) {
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
  args: {
    folderId: v.optional(v.union(v.string(), v.null()))
  },
  returns: v.array(
    v.object({
      _id: v.id("drawings"),
      _creationTime: v.number(),
      drawingId: v.string(),
      name: v.string(),
      folderId: v.optional(v.string())
    })
  ),
  handler: async (ctx, args) => {
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
    let activeDrawings = drawings.filter((d) => d.isActive !== false)

    // Filter by folderId if provided
    if (args.folderId !== undefined) {
      if (args.folderId === null) {
        // Return only drawings without a folder
        activeDrawings = activeDrawings.filter((d) => !d.folderId)
      } else {
        // Return only drawings in the specified folder
        activeDrawings = activeDrawings.filter(
          (d) => d.folderId === args.folderId
        )
      }
    }

    // Only return what we need for the list (metadata only)
    return activeDrawings.map((d) => ({
      _id: d._id,
      _creationTime: d._creationTime,
      drawingId: d.drawingId,
      name: d.name,
      folderId: d.folderId
    }))
  }
})

export const listShared = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("drawings"),
      _creationTime: v.number(),
      drawingId: v.string(),
      name: v.string(),
      folderId: v.optional(v.string())
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return []
    }

    const userIdString = String(userId)
    const collaboratorEntries = await ctx.db
      .query("drawingCollaborators")
      .withIndex("by_collaboratorUserId", (q) =>
        q.eq("collaboratorUserId", userIdString)
      )
      .collect()

    if (collaboratorEntries.length === 0) {
      return []
    }

    const sharedDrawings: Array<{
      _id: Id<"drawings">
      _creationTime: number
      drawingId: string
      name: string
      folderId?: string
    }> = []

    for (const entry of collaboratorEntries) {
      const drawing = await ctx.db
        .query("drawings")
        .withIndex("by_drawingId", (q) => q.eq("drawingId", entry.drawingId))
        .first()

      if (!drawing || drawing.isActive === false) {
        continue
      }

      sharedDrawings.push({
        _id: drawing._id,
        _creationTime: drawing._creationTime,
        drawingId: drawing.drawingId,
        name: drawing.name,
        folderId: drawing.folderId ?? undefined
      })
    }

    // Newest first for consistency with owned drawings
    return sharedDrawings.sort((a, b) => b._creationTime - a._creationTime)
  }
})

export const listCollaborators = query({
  args: {
    drawingId: v.string()
  },
  returns: v.array(
    v.object({
      collaboratorUserId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      addedByUserId: v.string()
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return []
    }

    const userIdString = String(userId)
    const { drawing, role } = await loadDrawingAndRole(
      ctx,
      args.drawingId,
      userIdString
    )

    if (!drawing || drawing.isActive === false || role !== "owner") {
      return []
    }

    const collaborators = await ctx.db
      .query("drawingCollaborators")
      .withIndex("by_drawingId", (q) => q.eq("drawingId", args.drawingId))
      .collect()

    const results = []
    for (const entry of collaborators) {
      const userDoc = await ctx.db.get(entry.collaboratorUserId as Id<"users">)
      const user = userDoc as Doc<"users"> | null
      results.push({
        collaboratorUserId: entry.collaboratorUserId,
        email: user?.email,
        name: user?.name,
        addedByUserId: entry.addedByUserId
      })
    }

    return results
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

export const addCollaboratorByEmail = mutation({
  args: {
    drawingId: v.string(),
    email: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const normalizedEmail = normalizeEmail(args.email)

    const { drawing, role } = await loadDrawingAndRole(
      ctx,
      args.drawingId,
      userIdString
    )

    if (!drawing || drawing.isActive === false) {
      throw new Error("Drawing not found")
    }

    if (role !== "owner") {
      throw new Error("Only the owner can share this drawing")
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first()

    if (!targetUser) {
      throw new Error("User not found")
    }

    const targetUserId = String(targetUser._id)

    if (targetUserId === userIdString) {
      throw new Error("You cannot share with yourself")
    }

    const existingCollaborator = await ctx.db
      .query("drawingCollaborators")
      .withIndex("by_collaborator_and_drawingId", (q) =>
        q.eq("collaboratorUserId", targetUserId).eq("drawingId", args.drawingId)
      )
      .first()

    if (existingCollaborator) {
      throw new Error("User is already a collaborator")
    }

    await ctx.db.insert("drawingCollaborators", {
      drawingId: args.drawingId,
      collaboratorUserId: targetUserId,
      addedByUserId: userIdString
    })

    return null
  }
})

export const removeCollaborator = mutation({
  args: {
    drawingId: v.string(),
    collaboratorUserId: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("Unauthorized")
    }

    const userIdString = String(userId)
    const { drawing, role } = await loadDrawingAndRole(
      ctx,
      args.drawingId,
      userIdString
    )

    if (!drawing || drawing.isActive === false) {
      throw new Error("Drawing not found")
    }

    if (role !== "owner") {
      throw new Error("Only the owner can remove collaborators")
    }

    if (args.collaboratorUserId === userIdString) {
      throw new Error("Owner cannot remove themselves")
    }

    const existing = await ctx.db
      .query("drawingCollaborators")
      .withIndex("by_collaborator_and_drawingId", (q) =>
        q
          .eq("collaboratorUserId", args.collaboratorUserId)
          .eq("drawingId", args.drawingId)
      )
      .first()

    if (!existing) {
      return null
    }

    await ctx.db.delete(existing._id)
    return null
  }
})

export const leaveCollaboration = mutation({
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
      .query("drawingCollaborators")
      .withIndex("by_collaborator_and_drawingId", (q) =>
        q.eq("collaboratorUserId", userIdString).eq("drawingId", args.drawingId)
      )
      .first()

    if (!existing) {
      return null
    }

    await ctx.db.delete(existing._id)
    return null
  }
})

/**
 * Updates the name of a drawing
 * @param args - Drawing ID and new name
 * @throws {Error} If user is unauthorized or drawing not found
 */
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

    // Validate and sanitize name
    const trimmedName = args.name.trim()
    if (trimmedName.length > 100) {
      throw new Error("Drawing name must be at most 100 characters")
    }

    const userIdString = String(userId)
    const { drawing, role } = await loadDrawingAndRole(
      ctx,
      args.drawingId,
      userIdString
    )

    if (!drawing || drawing.isActive === false) {
      throw new Error("Drawing not found")
    }

    if (role === null) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(drawing._id, {
      name: trimmedName || "Untitled"
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
  returns: v.object({
    status: v.union(
      v.literal("not_found"),
      v.literal("inactive"),
      v.literal("forbidden"),
      v.literal("owner"),
      v.literal("collaborator")
    ),
    drawing: v.optional(
      v.object({
        _id: v.id("drawings"),
        userId: v.string(),
        files: v.optional(v.record(v.string(), v.id("_storage"))),
        isActive: v.optional(v.boolean())
      })
    )
  }),
  handler: async (ctx, args) => {
    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_drawingId", (q) => q.eq("drawingId", args.drawingId))
      .first()

    if (!drawing) {
      return { status: "not_found" as const, drawing: undefined }
    }

    if (drawing.isActive === false) {
      return {
        status: "inactive" as const,
        drawing: {
          _id: drawing._id,
          userId: drawing.userId,
          files: drawing.files,
          isActive: drawing.isActive
        }
      }
    }

    if (drawing.userId === args.userId) {
      return {
        status: "owner" as const,
        drawing: {
          _id: drawing._id,
          userId: drawing.userId,
          files: drawing.files,
          isActive: drawing.isActive
        }
      }
    }

    const collaborator = await ctx.db
      .query("drawingCollaborators")
      .withIndex("by_collaborator_and_drawingId", (q) =>
        q.eq("collaboratorUserId", args.userId).eq("drawingId", args.drawingId)
      )
      .first()

    if (collaborator) {
      return {
        status: "collaborator" as const,
        drawing: {
          _id: drawing._id,
          userId: drawing.userId,
          files: drawing.files,
          isActive: drawing.isActive
        }
      }
    }

    return {
      status: "forbidden" as const,
      drawing: {
        _id: drawing._id,
        userId: drawing.userId,
        files: drawing.files,
        isActive: drawing.isActive
      }
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
    const access = await ctx.runQuery(internal.drawings.getDrawingWithFiles, {
      drawingId: args.drawingId,
      userId: args.userId
    })

    if (
      !access.drawing ||
      access.status === "inactive" ||
      !access.drawing.files ||
      Object.keys(access.drawing.files).length === 0
    ) {
      // No files to delete, just complete the deletion
      await ctx.runMutation(internal.drawings.completeDrawingDeletion, {
        drawingId: args.drawingId,
        userId: args.userId,
        totalBytesDeleted: 0
      })
      return null
    }

    if (access.status === "forbidden") {
      return null
    }

    let totalBytesDeleted = 0

    // Delete each file from storage (one per file/chunk)
    for (const storageId of Object.values(access.drawing.files)) {
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
