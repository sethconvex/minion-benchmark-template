/**
 * Items Context Factory
 * Creates the ItemsContext for headless (CLI/EC2) execution.
 */

import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ItemsContext, Item } from "./types";

export function createContext(client: ConvexClient): Partial<ItemsContext> {
  // State managed by subscriptions
  let cachedItems: Item[] = [];

  // Subscribe to items
  const subscribeToItems = () => {
    client.onUpdate(api.items.listItems, { limit: 1000 }, (items) => {
      if (!items) {
        cachedItems = [];
        return;
      }
      cachedItems = items.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        ownerId: item.ownerId,
        tags: item.tags,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    });
  };

  // Start subscription immediately
  subscribeToItems();

  const context: Partial<ItemsContext> = {
    // ============== Item Operations ==============

    createItem: async (data) => {
      const result = await client.mutation(api.items.createItem, {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags,
      });
      return result;
    },

    createItems: async (items) => {
      const result = await client.mutation(api.items.createItems, {
        items: items.map((item) => ({
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          tags: item.tags,
        })),
      });
      return result;
    },

    updateItem: async (id, data) => {
      await client.mutation(api.items.updateItem, {
        id: id as Id<"items">,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags,
      });
    },

    deleteItem: async (id) => {
      await client.mutation(api.items.deleteItem, {
        id: id as Id<"items">,
      });
    },

    // ============== Queries ==============

    getItems: () => cachedItems,

    getItemsByStatus: (status) =>
      cachedItems.filter((item) => item.status === status),

    getItemsByPriority: (priority) =>
      cachedItems.filter((item) => item.priority === priority),

    getRandomItem: () => {
      if (cachedItems.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * cachedItems.length);
      return cachedItems[randomIndex];
    },

    getItemCount: () => cachedItems.length,
  };

  return context;
}
