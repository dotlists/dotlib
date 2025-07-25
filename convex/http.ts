import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import "./lists";
import "./teams";
import "./users";

const http = httpRouter();

auth.addHttpRoutes(http);

const requireDevApiKey = (handler: (ctx: any, request: Request) => Promise<Response>) => {
  return httpAction(async (ctx, request) => {
    const apiKey = request.headers.get("X-API-KEY");
    if (apiKey !== process.env.DEV_API_KEY) {
      return new Response("Invalid API Key", { status: 401 });
    }
    return handler(ctx, request);
  });
};

// This is a placeholder to ensure the file is not empty.
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/user",
  method: "GET",
  handler: requireDevApiKey(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return new Response("Missing `username` parameter", { status: 400 });
    }

    const user = await ctx.runQuery(api.users.findUserByUsername, {
      username: username,
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const sanitized = {
      username: user.username,
      userId: user.userId,
      // Add more fields if your schema supports them
    };

    return new Response(JSON.stringify(sanitized), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
