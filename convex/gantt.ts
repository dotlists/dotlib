// convex/gantt.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasAccessToList } from "./lists";

export const getGanttData = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await hasAccessToList(ctx, userId, args.listId))) {
      throw new Error("Unauthorized");
    }

    const items = await ctx.db
      .query("items")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    const ganttTasks = await Promise.all(
      items.map(async (item) => {
        const startDate = new Date(item.startDate ?? item.createdAt);
        const start = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
          .toISOString()
          .split("T")[0];

        let end: string;
        if (item.dueDate) {
          const dueDate = new Date(item.dueDate);
          end = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
        } else {
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
          end = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
        }

        let progress = 0;
        if (item.state === "green") {
          progress = 100;
        } else if (item.state === "yellow") {
          progress = 50;
        }

        let assigneeName = "";
        if (item.assigneeId) {
          const assigneeProfile = await ctx.db
            .query("user_profiles")
            .withIndex("by_userId", (q) => q.eq("userId", item.assigneeId!))
            .first();
          assigneeName = assigneeProfile?.username ?? "Unknown";
        }

        return {
          id: item._id,
          name: `${item.text} ${assigneeName ? `(${assigneeName})` : ""}`,
          start: start,
          end: end,
          progress: progress,
          custom_class: `gantt-task-${item.state}`,
        };
      }),
    );

    return ganttTasks;
  },
});