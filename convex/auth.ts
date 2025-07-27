import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { randomInt } from "crypto";

import github from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [github, Google],
});

export const generateAuthKey = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const code = Math.floor(Math.random() * 1000000);
    const codeStr = code.toString().padStart(6, "0");
    return await ctx.db.insert("authKeys", {
      code: codeStr,
      userId: userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    });
  },
});

export const getAuthKey = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const keys = await ctx.db
      .query("authKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter in-memory
    const validKeys = keys
      .filter((k) => k.expiresAt > Date.now())
      .sort((a, b) => b.createdAt - a.createdAt); // Sort descending by createdAt

    if (validKeys[0]) {
      const validCode = validKeys[0].code;
      return validCode;
    }
    else {
      return "";
    }
  },
});
