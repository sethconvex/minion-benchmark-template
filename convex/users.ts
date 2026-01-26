import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get or create a user by their visible ID.
 * Idempotent - calling with the same visibleId returns the same user.
 */
export const getOrCreateUser = mutation({
  args: {
    visibleId: v.string(),
    name: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_visibleId", (q) => q.eq("visibleId", args.visibleId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      visibleId: args.visibleId,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get a user by their visible ID.
 */
export const getUserByVisibleId = query({
  args: {
    visibleId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      visibleId: v.string(),
      name: v.string(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_visibleId", (q) => q.eq("visibleId", args.visibleId))
      .unique();
  },
});

/**
 * List all users.
 */
export const listUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      visibleId: v.string(),
      name: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
