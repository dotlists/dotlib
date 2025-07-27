/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as gantt from "../gantt.js";
import type * as gemini from "../gemini.js";
import type * as http from "../http.js";
import type * as lists from "../lists.js";
import type * as main from "../main.js";
import type * as notifications from "../notifications.js";
import type * as subtasks from "../subtasks.js";
import type * as teams from "../teams.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  comments: typeof comments;
  gantt: typeof gantt;
  gemini: typeof gemini;
  http: typeof http;
  lists: typeof lists;
  main: typeof main;
  notifications: typeof notifications;
  subtasks: typeof subtasks;
  teams: typeof teams;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
