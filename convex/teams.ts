// convex/teams.ts
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { type Id } from "./_generated/dataModel";

// Helper function to get a user's role in a team
const getViewerRole = async (
  ctx: QueryCtx,
  teamId: Id<"teams">,
): Promise<"admin" | "member" | null> => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }
  const membership = await ctx.db
    .query("team_members")
    .withIndex("by_team_user", (q) =>
      q.eq("teamId", teamId).eq("userId", userId),
    )
    .first();
  if (!membership) {
    return null;
  }
  return membership.role as "admin" | "member";
};

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

    const role = await getViewerRole(ctx, args.teamId);
    if (role !== "admin") {
      throw new Error("Only team admins can send invitations.");
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

    await ctx.db.insert("notifications", {
      recipientId: invitee.userId,
      actorId: userId,
      type: "invitation",
      teamId: args.teamId,
      read: false,
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
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;
        return {
          ...team,
          role: membership.role,
        };
      }),
    );
    return teams.filter(Boolean);
  },
});

export const getTeamMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("team_members")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    return Promise.all(
      members.map(async (member) => {
        const userProfile = await ctx.db
          .query("user_profiles")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .first();
        return {
          ...member,
          username: userProfile?.username ?? "Unknown User",
        };
      }),
    );
  },
});

export const removeMemberFromTeam = mutation({
  args: { teamId: v.id("teams"), memberId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const role = await getViewerRole(ctx, args.teamId);
    if (role !== "admin") {
      throw new Error("Only team admins can remove members.");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found.");
    }

    if (team.ownerId === args.memberId) {
      throw new Error("Cannot remove the team owner.");
    }

    const membership = await ctx.db
      .query("team_members")
      .withIndex("by_team_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.memberId),
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

export const deleteTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found.");
    }

    if (team.ownerId !== userId) {
      throw new Error("Only the team owner can delete the team.");
    }

    // Delete all team members
    const members = await ctx.db
      .query("team_members")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all lists and their items
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const list of lists) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(list._id);
    }

    // Delete all invitations
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_team_invitee", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }

    // Delete the team
    await ctx.db.delete(args.teamId);
  },
});
