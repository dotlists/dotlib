import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

export const createUser = mutation({
  args: {
    email: v.optional(v.string()),
    hashedPassword: v.optional(v.string()),
    salt: v.optional(v.string()),
    googleId: v.optional(v.string()),
    hashedOtpSecret: v.optional(v.string()),
  },
  handler: async ({ db }, { email, hashedPassword, salt, googleId, hashedOtpSecret }) => {
    const userId = await db.insert("users", {
      email,
      hashedPassword,
      salt,
      googleId,
      hashedOtpSecret,
    });
    return userId;
  },
});

export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async ({ db }, { email }) => {
    return await db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();
  },
});

export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async ({ db }, { userId }) => {
    return await db.get(userId);
  },
});

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiration: v.number(),
  },
  handler: async ({ db }, { userId, token, expiration }) => {
    await db.insert("sessions", {
      userId,
      token,
      expiration,
    });
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    googleId: v.string(),
  },
  handler: async ({ db }, { id, googleId }) => {
    await db.patch(id, { googleId });
  },
});

export const setOtpSecret = mutation({
  args: {
    userId: v.id("users"),
    otpSecret: v.string(),
  },
  handler: async ({ db }, { userId, otpSecret }) => {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedOtpSecret = await bcrypt.hash(otpSecret, salt);
    await db.patch(userId, { hashedOtpSecret });
  },
});

export const verifyOtp = query({
  args: {
    userId: v.id("users"),
    otp: v.string(),
  },
  handler: async ({ db }, { userId, otp }) => {
    const user = await db.get(userId);
    if (!user || !user.hashedOtpSecret) {
      return false;
    }
    return await bcrypt.compare(otp, user.hashedOtpSecret);
  },
});