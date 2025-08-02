// convex/main.ts
import {
  mutation,
  query,
  internalAction,
  type ActionCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api"; // Use the internal API
import type { Doc } from "./_generated/dataModel";

// --- User Queries ---

export const getMyUserProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db
      .query("user_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const findUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const getUserCount = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("user_profiles").collect();
    return users.length;
  },
});

// --- Webhook Creation ---

export const createWebhook = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhooks", {
      name: args.name,
      url: args.url,
      event: args.event,
    });
  },
});

// --- Internal Actions ---

export const sendWebhookAction = internalAction({
  args: {
    webhooksJson: v.string(),
    payload: v.any(),
  },
  handler: async (_ctx: ActionCtx, { webhooksJson, payload }) => {
    const webhooks: Doc<"webhooks">[] = JSON.parse(webhooksJson);
    await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            console.error(
              `Webhook to ${webhook.name} failed with status ${response.status}`,
            );
          }
        } catch (error) {
          console.error(`Error sending webhook to ${webhook.name}:`, error);
        }
      }),
    );
  },
});

export const updateDiscordChannelNameAction = internalAction({
  args: {
    userCount: v.number(),
  },
  handler: async (_ctx: ActionCtx, { userCount }) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    if (!botToken || !channelId) {
      console.error(
        "Discord bot token or channel ID is not set in environment variables.",
      );
      return;
    }

    const newChannelName = `📊-total-users-${userCount}`;
    const url = `https://discord.com/api/v10/channels/${channelId}`;

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newChannelName }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Failed to update Discord channel name. Status: ${response.status}, Body: ${errorBody}`,
        );
      } else {
        console.log(`Successfully updated channel name to: ${newChannelName}`);
      }
    } catch (error) {
      console.error("Error sending request to Discord:", error);
    }
  },
});

// --- Main User Creation Mutation ---

export const createUserProfile = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to create a profile.");
    }

    const existingUser = await ctx.db
      .query("user_profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser) {
      throw new Error("Username is already taken.");
    }

    const existingProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      throw new Error("You already have a profile.");
    }

    const userProfile = await ctx.db.insert("user_profiles", {
      userId,
      username: args.username,
    });

    const allUsers = await ctx.db.query("user_profiles").collect();
    const userCount = allUsers.length;

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_event", (q) => q.eq("event", "user.created"))
      .collect();

    if (webhooks.length > 0) {
      await ctx.scheduler.runAfter(0, internal.main.sendWebhookAction, {
        webhooksJson: JSON.stringify(webhooks),
        payload: {
          content: `🎉 New user signed up! Welcome, **${args.username}**. We now have **${userCount}** total users.`,
        },
      });
    }

    await ctx.scheduler.runAfter(0, internal.main.updateDiscordChannelNameAction, {
      userCount,
    });

    return userProfile;
  },
});

export const deleteUserProfile = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get all teams user is a part of
    const teamMemberships = await ctx.db
      .query("team_members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get personal lists
    const personalLists = await ctx.db
      .query("lists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("teamId"), undefined))
      .collect();

    // Get team lists if the user is the only one in the team
    const teamLists = (
      await Promise.all(
        teamMemberships.map(async (membership) => {
          const members = await ctx.db
            .query("team_members")
            .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
            .collect();

          // Check if this user is the only one in the team
          if (members.length === 1 && members[0].userId === userId) {
            // Delete the team
            await ctx.db.delete(membership.teamId);
            // Return all the team's lists to be deleted
            return await ctx.db
              .query("lists")
              .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
              .collect();
          }

          // Find the next member in the team
          const otherMember =
            members.find((m) => m.userId !== userId && m.role === "admin") ??
            members.find((m) => m.userId !== userId && m.role === "member");
          if (!otherMember) return []; // fallback

          // Get all lists for the team
          const lists = await ctx.db
            .query("lists")
            .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
            .collect();

          // Make other member owner of all the team lists
          for (const list of lists) {
            await ctx.db.patch(list._id, {
              userId: otherMember.userId,
            });
          }

          // Make other member team owner and admin
          await ctx.db.patch(membership.teamId, {
            ownerId: otherMember.userId,
          });
          await ctx.db.patch(membership._id, {
            role: "admin",
          });

          // User is not the only one in the team
          return [];
        }),
      )
    ).flat();

    const allLists = [...personalLists, ...teamLists];

    // Delete all lists and items
    for (const list of allLists) {
      // remove items first
      const items = await ctx.db
        .query("items")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();

      for (const item of items) {
        await ctx.db.delete(item._id);
      }

      // then the list
      await ctx.db.delete(list._id);
    }

    // Remove user from all teams
    for (const team of teamMemberships) {
      const membership = await ctx.db
        .query("team_members")
        .withIndex("by_team_user", (q) =>
          q.eq("teamId", team.teamId).eq("userId", userId),
        )
        .first();

      if (membership) {
        await ctx.db.delete(membership._id);
      }
    }

    // Get all profiles of a user id (there should only be one but we have to be sure)
    const profiles = await ctx.db
      .query("user_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    
    // Delete all user profiles
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }

    // Get all auth accounts of a user
    const auth_accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    
    // Delete all auth accounts
    for (const account of auth_accounts) {
      await ctx.db.delete(account._id);
    }

    // Delete the user object
    await ctx.db.delete(userId);
  },
});
