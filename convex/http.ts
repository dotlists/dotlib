import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { type Id } from "./_generated/dataModel";
import "./lists";
import "./teams";
import "./main"; // Import the new consolidated file

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

    const user = await ctx.runQuery(api.main.findUserByUsername, {
      username: username,
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const sanitized = {
      username: user.username,
      userId: user.userId,
    };

    return new Response(JSON.stringify(sanitized), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/users",
  method: "GET",
  handler: requireDevApiKey(async (ctx) => {
    const userCount = await ctx.runQuery(api.main.getUserCount);
    return new Response(JSON.stringify({ totalUsers: userCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});


http.route({
  path: "/lists",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);

    const lists = await ctx.runQuery(api.lists.getLists);

    return new Response(JSON.stringify(lists), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  pathPrefix: "/lists/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const rest = path.slice("/lists/".length);
    const [listId, ...subpath] = rest.split("/");

    if (!listId || subpath[0] !== "items") {
      return new Response("Not Found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);

    if (!listId) {
      return new Response("Missing `listId` parameter", { status: 400 });
    }

    const items = await ctx.runQuery(api.lists.getItems, {
      listId: listId as Id<"lists">,
    });

    if (!items) {
      return new Response("List not found", { status: 404 });
    }

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;