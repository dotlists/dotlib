import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import "./lists";
import "./teams";
import "./users";

const http = httpRouter();

auth.addHttpRoutes(http);

// This is a placeholder to ensure the file is not empty.
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("OK", { status: 200 });
  }),
});

export default http;
