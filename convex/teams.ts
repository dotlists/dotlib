// convex/teams.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const createTeam = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      ownerId: userId,
    });

    await ctx.db.insert("team_members", {
      teamId,
      userId,
      role: "admin",
    });

    return teamId;
  },
});

export const sendInvitation = mutation({
  args: { teamId: v.id("teams"), inviteeUsername: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== userId) {
      throw new Error("Only team owners can send invitations.");
    }

    const invitee = await ctx.db
      .query("user_profiles")
      .withIndex("by_username", (q) => q.eq("username", args.inviteeUsername))
      .first();

    if (!invitee) {
      throw new Error("User not found.");
    }

    if (invitee.userId === userId) {
      throw new Error("You cannot invite yourself.");
    }

    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_team_invitee", (q) =>
        q.eq("teamId", args.teamId).eq("inviteeId", invitee.userId),
      )
      .first();

    if (existingInvitation) {
      throw new Error("This user has already been invited to the team.");
    }

    await ctx.db.insert("invitations", {
      teamId: args.teamId,
      inviterId: userId,
      inviteeId: invitee.userId,
      status: "pending",
    });
  },
});

export const getPendingInvitations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_invitee", (q) => q.eq("inviteeId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return Promise.all(
      invitations.map(async (invitation) => {
        const team = await ctx.db.get(invitation.teamId);
        const inviterProfile = await ctx.db
          .query("user_profiles")
          .withIndex("by_userId", (q) => q.eq("userId", invitation.inviterId))
          .first();
        return {
          ...invitation,
          teamName: team?.name,
          inviterName: inviterProfile?.username,
        };
      }),
    );
  },
});

export const acceptInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.inviteeId !== userId) {
      throw new Error("Invitation not found.");
    }

    await ctx.db.patch(args.invitationId, { status: "accepted" });

    await ctx.db.insert("team_members", {
      teamId: invitation.teamId,
      userId: userId,
      role: "member",
    });
  },
});

export const declineInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.inviteeId !== userId) {
      throw new Error("Invitation not found.");
    }

    await ctx.db.patch(args.invitationId, { status: "declined" });
  },
});

export const getTeams = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const teamMemberships = await ctx.db
      .query("team_members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teams = await Promise.all(
      teamMemberships.map(async (membership) => {
        return await ctx.db.get(membership.teamId);
      }),
    );
    // filter out nulls if a team was deleted but membership remains
    return teams.filter(Boolean);
  },
});
