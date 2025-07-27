import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  teams: defineTable({
    name: v.string(),
    ownerId: v.string(),
  }).index("by_owner", ["ownerId"]),
  team_members: defineTable({
    teamId: v.id("teams"),
    userId: v.string(),
    role: v.string(), // "admin" or "member"
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_user", ["teamId", "userId"]),
  lists: defineTable({
    name: v.string(),
    userId: v.string(),
    teamId: v.optional(v.id("teams")),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"]),
  items: defineTable({
    listId: v.id("lists"),
    text: v.string(),
    state: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    assigneeId: v.optional(v.string()),
  })
    .index("by_list", ["listId"])
    .index("by_user", ["userId"]),
  subtasks: defineTable({
    parentId: v.id("items"),
    text: v.string(),
    state: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    assigneeId: v.optional(v.string()),
  }).index("by_parent", ["parentId"]),
  user_profiles: defineTable({
    userId: v.string(),
    username: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),
  invitations: defineTable({
    teamId: v.id("teams"),
    inviterId: v.string(),
    inviteeId: v.string(),
    status: v.string(), // "pending", "accepted", "declined"
  })
    .index("by_invitee", ["inviteeId"])
    .index("by_team_invitee", ["teamId", "inviteeId"]),
  comments: defineTable({
    itemId: v.id("items"),
    userId: v.string(),
    text: v.string(),
  }).index("by_item", ["itemId"]),
  notifications: defineTable({
    recipientId: v.string(),
    actorId: v.string(),
    type: v.string(), // "assignment", "comment", "invitation"
    itemId: v.optional(v.id("items")),
    teamId: v.optional(v.id("teams")),
    read: v.boolean(),
  }).index("by_recipient", ["recipientId"]),
  webhooks: defineTable({
    name: v.string(),
    url: v.string(),
    event: v.string(),
  }).index("by_event", ["event"]),
});

export default schema;
