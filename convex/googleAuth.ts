import { httpAction, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.VITE_CONVEX_URL + "/google-oauth-callback";

const handleGoogleCallbackArgs = v.object({
  code: v.string(),
  state: v.string(),
});

export const initiateGoogleAuth = httpAction(async (ctx: ActionCtx, request: Request) => {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", "random_state_string"); // TODO: Generate and verify state
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
    },
  });
});

export const handleGoogleCallback = httpAction(async (ctx: ActionCtx, request: Request) => {
  // TODO: Verify state to prevent CSRF attacks

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  const tokenUrl = "https://oauth2.googleapis.com/token";
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    throw new Error(`Google token error: ${tokenData.error_description}`);
  }

  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    },
  );
  const userInfo = await userInfoResponse.json();

  // Now, use userInfo.email and userInfo.sub (Google user ID) to create/login user
  let user: Doc<"users"> | null = await ctx.runQuery(api.users.getUserByEmail, { email: userInfo.email });

  if (!user) {
    // Create new user if not exists
    const userId = await ctx.runMutation(api.users.createUser, {
      email: userInfo.email,
      googleId: userInfo.sub, // Store Google user ID
    });
    user = (await ctx.runQuery(api.users.getUserById, { userId }))!;
  } else if (!user.googleId) {
    // Link Google ID to existing user if not already linked
    await ctx.runMutation(api.users.updateUser, {
      id: user._id,
      googleId: userInfo.sub,
    });
  }

  if (!user) {
    throw new Error("User not found after login/signup.");
  }

  // Create session for the user
  const sessionToken = Math.random().toString(36).substring(2);
  const expiration = Date.now() + (1000 * 60 * 60 * 24 * 7); // 7 days
  await ctx.runMutation(api.users.createSession, {
    userId: user._id,
    token: sessionToken,
    expiration,
  });

  // Redirect to frontend with session token
  const frontendRedirectUrl = new URL(process.env.VITE_CONVEX_URL!);
  frontendRedirectUrl.searchParams.set("sessionToken", sessionToken);
  return new Response(null, {
    status: 302,
    headers: {
      Location: frontendRedirectUrl.toString(),
    },
  });
});
