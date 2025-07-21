// This file runs in a Node.js environment
'use node';

import { action, ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';

// Action for user registration with email and password
const signUpArgs = v.object({
  email: v.string(),
  password: v.string(),
});

export const signUp = action({
  args: signUpArgs,
  handler: async (
    ctx: ActionCtx,
    { email, password },
  ): Promise<{ userId: Id<"users">; sessionToken: string }> => {
    const { runMutation, runQuery } = ctx;
    // Check if user already exists using a query
    const existingUser = await runQuery(api.users.getUserByEmail, { email });
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user using a mutation
    const userId = await runMutation(api.users.createUser, {
      email,
      hashedPassword,
      salt,
    });

    // Generate and store session token using a mutation
    const sessionToken = uuidv4();
    const expiration = Date.now() + (1000 * 60 * 60 * 24 * 7); // 7 days
    await runMutation(api.users.createSession, {
      userId,
      token: sessionToken,
      expiration,
    });

    return { userId, sessionToken };
  },
});

// Action for user login with email and password
const signInArgs = v.object({
  email: v.string(),
  password: v.string(),
});

export const signIn = action({
  args: signInArgs,
  handler: async (
    ctx: ActionCtx,
    { email, password },
  ): Promise<{ userId: Id<"users">; sessionToken: string }> => {
    const { runMutation, runQuery } = ctx;
    const user: { _id: Id<"users">; hashedPassword?: string } | null = await runQuery(
      api.users.getUserByEmail,
      { email },
    );

    if (!user || !user.hashedPassword) {
      throw new Error("Invalid credentials.");
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordMatch) {
      throw new Error("Invalid credentials.");
    }

    // Generate and store session token using a mutation
    const sessionToken = uuidv4();
    const expiration = Date.now() + (1000 * 60 * 60 * 24 * 7); // 7 days
    await runMutation(api.users.createSession, {
      userId: user._id,
      token: sessionToken,
      expiration,
    });

    return { userId: user._id, sessionToken };
  },
});