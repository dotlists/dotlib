import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLists = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const lists = await ctx.db
      .query("lists")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    // For each list, get its items
    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .collect();

        return {
          id: list._id,
          name: list.name,
          nodes: items.map((item) => ({
            uuid: item._id,
            text: item.text,
            state: item.state,
          })),
        };
      }),
    );

    return listsWithItems.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createList = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const list = await ctx.db.insert("lists", {
      name: args.name,
      userId: identity.subject,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return list;
  },
});

export const updateList = mutation({
  args: {
    id: v.id("lists"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

export const deleteList = mutation({
  args: {
    id: v.id("lists"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Delete all items in the list
    const items = await ctx.db
      .query("items")
      .withIndex("by_list", (q) => q.eq("listId", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete the list
    await ctx.db.delete(args.id);
  },
});

export const createItem = mutation({
  args: {
    listId: v.id("lists"),
    text: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const item = await ctx.db.insert("items", {
      listId: args.listId,
      text: args.text,
      state: args.state,
      userId: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return item;
  },
});

export const updateItem = mutation({
  args: {
    id: v.id("items"),
    text: v.optional(v.string()),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      ...(args.text !== undefined && { text: args.text }),
      ...(args.state !== undefined && { state: args.state }),
      updatedAt: Date.now(),
    });
  },
});

export const deleteItem = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
