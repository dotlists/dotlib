import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable(v.object({
    email: v.optional(v.string()),
    hashedPassword: v.optional(v.string()),
    salt: v.optional(v.string()),
    hashedOtpSecret: v.optional(v.string()),
    googleId: v.optional(v.string()),
  })).index("by_email", ["email"]),
    sessions: defineTable(v.object({
    userId: v.id("users"),
    token: v.string(),
    expiration: v.number(), // Unix timestamp
  })).index("by_token", ["token"]),
});
