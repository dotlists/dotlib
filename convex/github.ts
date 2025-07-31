import { internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasAccessToList } from "./lists";
import { Octokit } from "@octokit/rest";
import { internal } from "./_generated/api";

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
export const runSyncInternal = internalAction({
  args: {
    repos: v.array(v.object({
      owner: v.string(),
      repo: v.string(),
    })),
    listId: v.id("lists"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { repos } = args;
    const octokit = new Octokit();
    for (const repo of repos) {
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: repo.owner,
        repo: repo.repo,
        state: "open",
      });
      for (const issue of issues) {
        if (issue.pull_request) {
          continue;
        }
        await ctx.scheduler.runAfter(0, internal.lists.createItemInternal, {
          listId: args.listId,
          text: `[${repo.owner}/${repo.repo} #${issue.number}] ${issue.title}\n ${issue.body}`,
          state: issue.state === "open" ? "red" : "green",
          userId: args.userId as string,
        });
        /*
          * we care about:
          * - issue number
          * - body
          * - title
          * - state
        */
      };
    };
  },
});

export const runGithubSync = mutation({
  args: {
    listId: v.optional(v.id("lists")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!args.listId) {
      throw new Error("List ID is required");
    }
    if (!userId || !(await hasAccessToList(ctx, userId, args.listId!))) {
      throw new Error("Unauthorized");
    }
    const listId = args.listId!;
    const repos = await ctx.db.get(listId).then(list => list?.linkedGithubRepos) || [];
    const items = await ctx.db
      .query("items")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();

    for (const repo of repos) {
      const prefix = `[${repo.owner}/${repo.repo}`;
      const toDelete = items.filter(
        (item) => item.text.trim().startsWith(prefix)
      );
      for (const item of toDelete) {
        await ctx.runMutation(internal.lists.deleteItem, { id: item._id });
      }
    }
    await ctx.scheduler.runAfter(0, internal.github.runSyncInternal, {
        repos,
        listId,
        userId,
      });
  },
});
