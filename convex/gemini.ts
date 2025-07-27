// convex/gemini.ts
"use action";

import { action } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v } from "convex/values";

export const breakdownTask = action({
  args: {
    listId: v.id("lists"),
    taskId: v.id("items"),
    taskText: v.string(),
  },
  handler: async (_, { taskText }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Break down the following high-level task into a concise list of 3 to 5 essential sub-tasks: "${taskText}". The sub-tasks should be distinct and actionable. Return the result as a JSON array of strings.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean the response to get a valid JSON array
      const jsonString = text.replace(/```json|```/g, "").trim();
      const subTasks = JSON.parse(jsonString);

      if (Array.isArray(subTasks)) {
        return subTasks;
      }
      return [];
    } catch (error) {
      console.error("Error breaking down task:", error);
      return [];
    }
  },
});

