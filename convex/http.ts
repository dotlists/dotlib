import { httpRouter } from "convex/server";
import { initiateGoogleAuth, handleGoogleCallback } from "./googleAuth";

const http = httpRouter();

http.route({
  path: "/google-oauth-init",
  method: "GET",
  handler: initiateGoogleAuth,
});

http.route({
  path: "/google-oauth-callback",
  method: "GET",
  handler: handleGoogleCallback,
});

export default http;
