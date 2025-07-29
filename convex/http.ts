import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction, type ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import "./lists";
import "./teams";
import "./main"; // Import the new consolidated file

const http = httpRouter();

auth.addHttpRoutes(http);

const requireDevApiKey = (handler: (ctx: ActionCtx, request: Request) => Promise<Response>) => {
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
  path: "/calendar",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return new Response("Missing `userId` parameter", { status: 400 });
    }

    const items = await ctx.runQuery(api.lists.getItemsWithDueDates, {
      userId: userId,
    });

    const events = items.map((item) => {
      const lines = item.text.split("\n");
      const title = lines[0];
      const description = lines.slice(1).join("\n");
      const dt = new Date(item.dueDate!)

      const date = dt.toISOString().split("T")[0].replace(/-/g, "");

      return [
        "BEGIN:VEVENT",
        `UID:${item._id}@dotlist`,
        `DTSTAMP:${date}T000000Z`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:${title}`,
        description ? `DESCRIPTION:${description}` : "",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    });

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//dotlist//EN",
      "NAME:Dotlist Calendar",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="tasks-${userId}.ics"`,
      },
    });
  }),
});

export default http;
