import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const save = mutation({
  args: {
    drawingId: v.string(),
    elements: v.any(),
    appState: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    const userIdString = String(userId);
    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        elements: args.elements,
        appState: args.appState,
      });
    } else {
      await ctx.db.insert("drawings", {
        userId: userIdString,
        drawingId: args.drawingId,
        name: "Draw",
        elements: args.elements,
        appState: args.appState,
      });
    }

    return null;
  },
});

export const get = query({
  args: {
    drawingId: v.string(),
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
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const userIdString = String(userId);
    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId),
      )
      .first();

    return drawing ?? null;
  },
});

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("drawings"),
      _creationTime: v.number(),
      drawingId: v.string(),
      name: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const userIdString = String(userId);
    const drawings = await ctx.db
      .query("drawings")
      .withIndex("by_userId", (q) => q.eq("userId", userIdString))
      .order("desc")
      .collect();

    // Only return what we need for the list (metadata only)
    return drawings.map((d) => ({
      _id: d._id,
      _creationTime: d._creationTime,
      drawingId: d.drawingId,
      name: d.name,
    }));
  },
});

export const getLatest = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const userIdString = String(userId);
    // Efficiently get the single most recent drawing
    const latest = await ctx.db
      .query("drawings")
      .withIndex("by_userId", (q) => q.eq("userId", userIdString))
      .order("desc") // Most recent first
      .first();

    return latest ? latest.drawingId : null;
  },
});

export const updateName = mutation({
  args: {
    drawingId: v.string(),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    const userIdString = String(userId);
    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_userId_and_drawingId", (q) =>
        q.eq("userId", userIdString).eq("drawingId", args.drawingId),
      )
      .first();

    if (!existing) {
      throw new Error("Drawing not found");
    }

    await ctx.db.patch(existing._id, {
      name: args.name,
    });

    return null;
  },
});
