import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * Users table - tracks unique users/workers in the system.
   * Each browser/worker gets a unique visibleId.
   */
  users: defineTable({
    visibleId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_visibleId", ["visibleId"]),

  /**
   * Items table - generic tasks/items for load testing.
   * Demonstrates common patterns: status filtering, priority sorting, ownership.
   */
  items: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "pending" | "active" | "completed"
    priority: v.number(), // 1-5 (1 = highest priority)
    ownerId: v.optional(v.id("users")),
    tags: v.array(v.string()),
    projectId: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status", "updatedAt"])
    .index("by_owner", ["ownerId", "updatedAt"])
    .index("by_priority", ["priority", "updatedAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_project", ["projectId", "createdAt"]),
});
