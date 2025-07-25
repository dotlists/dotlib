// convex/comments.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { type QueryCtx, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";

const hasAccessToItem = async (
  ctx: QueryCtx | MutationCtx,
  itemId: Id<"items">,
): Promise<boolean> => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return false;
  }
  const item = await ctx.db.get(itemId);
  if (!item) {
    return false;
  }
  const list = await ctx.db.get(item.listId);
  if (!list) {
    return false;
  }
  if (list.userId === userId) {
    return true;
  }
  if (list.teamId) {
    const membership = await ctx.db
      .query("team_members")
      .withIndex("by_team_user", (q) =>
        q.eq("teamId", list.teamId!).eq("userId", userId),
      )
      .first();
    return !!membership;
  }
  return false;
};

export const getComments = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    if (!(await hasAccessToItem(ctx, args.itemId))) {
      return [];
    }
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    return Promise.all(
      comments.map(async (comment) => {
        const userProfile = await ctx.db
          .query("user_profiles")
          .withIndex("by_userId", (q) => q.eq("userId", comment.userId))
          .first();
        return {
          ...comment,
          author: userProfile?.username ?? "Unknown User",
        };
      }),
    );
  },
});

export const addComment = mutation({
  args: { itemId: v.id("items"), text: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await hasAccessToItem(ctx, args.itemId))) {
      throw new Error("Unauthorized");
    }

    const item = await ctx.db.get(args.itemId);
    // Notify the assignee if they are not the one commenting
    if (item?.assigneeId && item.assigneeId !== userId) {
      await ctx.db.insert("notifications", {
        recipientId: item.assigneeId,
        actorId: userId,
        type: "comment",
        itemId: args.itemId,
        read: false,
      });
    }

    return await ctx.db.insert("comments", {
      itemId: args.itemId,
      userId,
      text: args.text,
    });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.commentId);
  },
});