// Re-export convex types and utilities for use in components
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export type { Id, Doc };
export { api };
