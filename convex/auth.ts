import { Secret, TOTP } from "otpauth";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";


// Query to verify a session token
export const verifySession = query({
  args: { sessionToken: v.string() },
  handler: async ({ db }, { sessionToken }) => {
    const session = await db.query("sessions").withIndex("by_token", (q) => q.eq("token", sessionToken)).first();

    if (!session || session.expiration < Date.now()) {
      return null; // Session invalid or expired
    }

    const user = await db.get(session.userId);
    return user; // Return the user associated with the valid session
  },
});