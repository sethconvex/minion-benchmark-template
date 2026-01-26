import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Valid status values
const VALID_STATUSES = ["pending", "active", "completed"] as const;

/**
 * Create a new item.
 */
export const createItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.number()),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("items", {
      title: args.title,
      description: args.description,
      status: args.status ?? "pending",
      priority: args.priority ?? 3,
      ownerId: args.ownerId,
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Create multiple items at once (batch insert).
 * More efficient than individual creates for seeding.
 */
export const createItems = mutation({
  args: {
    items: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        status: v.optional(v.string()),
        priority: v.optional(v.number()),
        ownerId: v.optional(v.id("users")),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  returns: v.array(v.id("items")),
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids: string[] = [];

    for (const item of args.items) {
      const id = await ctx.db.insert("items", {
        title: item.title,
        description: item.description,
        status: item.status ?? "pending",
        priority: item.priority ?? 3,
        ownerId: item.ownerId,
        tags: item.tags ?? [],
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }

    return ids as any;
  },
});

/**
 * Update an item.
 */
export const updateItem = mutation({
  args: {
    id: v.id("items"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.number()),
    ownerId: v.optional(v.union(v.id("users"), v.null())),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const item = await ctx.db.get(id);
    if (!item) {
      throw new Error("Item not found");
    }

    // Build update object with only provided fields
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if (updates.ownerId !== undefined) patch.ownerId = updates.ownerId;
    if (updates.tags !== undefined) patch.tags = updates.tags;

    await ctx.db.patch(id, patch);
    return null;
  },
});

/**
 * Delete an item.
 */
export const deleteItem = mutation({
  args: {
    id: v.id("items"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Get a single item by ID.
 */
export const getItem = query({
  args: {
    id: v.id("items"),
  },
  returns: v.union(
    v.object({
      _id: v.id("items"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.string(),
      priority: v.number(),
      ownerId: v.optional(v.id("users")),
      tags: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List all items, optionally filtered by status.
 */
export const listItems = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("items"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.string(),
      priority: v.number(),
      ownerId: v.optional(v.id("users")),
      tags: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.status) {
      return await ctx.db
        .query("items")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("items")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

/**
 * List items by priority.
 */
export const listByPriority = query({
  args: {
    priority: v.number(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("items"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.string(),
      priority: v.number(),
      ownerId: v.optional(v.id("users")),
      tags: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_priority", (q) => q.eq("priority", args.priority))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

/**
 * List items by owner.
 */
export const listByOwner = query({
  args: {
    ownerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("items"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.string(),
      priority: v.number(),
      ownerId: v.optional(v.id("users")),
      tags: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

/**
 * Get item count (useful for dashboard stats).
 */
export const getItemCount = query({
  args: {
    status: v.optional(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (args.status) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
      return items.length;
    }

    const items = await ctx.db.query("items").collect();
    return items.length;
  },
});

/**
 * Get a random item (useful for behaviors that need to pick items to update).
 */
export const getRandomItem = query({
  args: {
    status: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("items"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.string(),
      priority: v.number(),
      ownerId: v.optional(v.id("users")),
      tags: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let items;
    if (args.status) {
      items = await ctx.db
        .query("items")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      items = await ctx.db.query("items").collect();
    }

    if (items.length === 0) return null;

    // Simple random selection - for true randomness in behaviors,
    // use the seeded random from context
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  },
});
