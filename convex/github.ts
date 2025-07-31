import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasAccessToList } from "./lists";

export const getLinkedRepos = query({
  args: { listId: v.optional(v.id("lists")) },
  handler: async (ctx, args) => {
    if (!args.listId) {
      throw new Error("List ID is required");
    }
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await hasAccessToList(ctx, userId, args.listId))) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.listId);
    if (!project) {
      throw new Error("Project not found");
    }
    const repos = project.linkedGithubRepos || [];
    return {
      repos,
      name: project.name,
    };
  },
});
export const addLinkedRepo = mutation({
  args: {
    listId: v.id("lists"),
    repo: v.object({
      owner: v.string(),
      repo: v.string(),
      // Add other repo fields as needed
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await hasAccessToList(ctx, userId, args.listId))) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.listId);
    if (!project) {
      throw new Error("Project not found");
    }

    const currentRepos = project.linkedGithubRepos || [];

    await ctx.db.patch(args.listId, {
      linkedGithubRepos: [...currentRepos, args.repo],
    });
  },
});
export const removeLinkedRepo = mutation({
  args: {
    listId: v.id("lists"),
    repo: v.object({
      owner: v.string(),
      repo: v.string(),
      // Add other repo fields as needed
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await hasAccessToList(ctx, userId, args.listId))) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.listId);
    if (!project) {
      throw new Error("Project not found");
    }

    const currentRepos = project.linkedGithubRepos || [];
    const updatedRepos = currentRepos.filter(
      (r) => !(r.owner === args.repo.owner && r.repo === args.repo.repo)
    );

    await ctx.db.patch(args.listId, {
      linkedGithubRepos: updatedRepos,
    });
  },
});
