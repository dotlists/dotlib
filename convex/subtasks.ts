// convex/subtasks.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createSubtask = mutation({
  args: {
    parentId: v.id("items"),
    text: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const subtaskId = await ctx.db.insert("subtasks", {
      ...args,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return subtaskId;
  },
});

export const updateSubtask = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    text: v.optional(v.string()),
    state: v.optional(v.string()),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    assigneeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { subtaskId, ...rest } = args;
    await ctx.db.patch(subtaskId, {
      ...rest,
      updatedAt: Date.now(),
    });
  },
});

export const deleteSubtask = mutation({
  args: { subtaskId: v.id("subtasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.subtaskId);
  },
});

export const getSubtasks = query({
  args: { parentId: v.id("items") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});
