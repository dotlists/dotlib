// convex/notifications.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getNotifications = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { notifications: [], invitations: [] };
    }

    // Fetch notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .order("desc")
      .collect();

    const populatedNotifications = await Promise.all(
      notifications.map(async (n) => {
        const actor = await ctx.db
          .query("user_profiles")
          .withIndex("by_userId", (q) => q.eq("userId", n.actorId))
          .first();
        return {
          ...n,
          actorName: actor?.username ?? "Someone",
        };
      }),
    );

    // Fetch invitations
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_invitee", (q) => q.eq("inviteeId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const populatedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const team = await ctx.db.get(invitation.teamId);
        const inviter = await ctx.db
          .query("user_profiles")
          .withIndex("by_userId", (q) => q.eq("userId", invitation.inviterId))
          .first();
        return {
          ...invitation,
          teamName: team?.name ?? "A team",
          inviterName: inviter?.username ?? "Someone",
        };
      }),
    );

    return {
      notifications: populatedNotifications,
      invitations: populatedInvitations,
    };
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const notification = await ctx.db.get(args.notificationId);
    if (notification?.recipientId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.notificationId, { read: true });
  },
});