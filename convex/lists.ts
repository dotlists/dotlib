// convex/lists.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

//
// FETCH ALL LISTS FOR A USER
//
export const getLists = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    console.log("getLists tokenIdentifier:", identity.tokenIdentifier);
    const lists = await ctx.db
      .query("lists")
      //.withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    return lists.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getItems = query({
  args: {
    listId: v.id("lists"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const items = await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("listId"), args.listId))
      .collect();
    return items.map((item) => ({
      uuid: item._id,
      text: item.text,
      state: item.state,
    }));
  },
});

//
// CREATE A NEW LIST
//
export const createList = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    console.log("createList tokenIdentifier:", identity.tokenIdentifier);
    const userId = identity.tokenIdentifier;

    return await ctx.db.insert("lists", {
      name: args.name,
      userId,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

//
// RENAME A LIST
//
export const updateList = mutation({
  args: { id: v.id("lists"), name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.tokenIdentifier;

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

//
// DELETE A LIST + ITS ITEMS
//
export const deleteList = mutation({
  args: { id: v.id("lists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.tokenIdentifier;

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // remove items first
    const items = await ctx.db
      .query("items")
      .withIndex("by_list", (q) => q.eq("listId", args.id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // then the list
    await ctx.db.delete(args.id);
  },
});

//
// CRUD FOR ITEMS
//
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
    const userId = identity.tokenIdentifier;

    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("items", {
      listId: args.listId,
      text: args.text,
      state: args.state,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
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
    const userId = identity.tokenIdentifier;

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== userId) {
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
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.tokenIdentifier;

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});