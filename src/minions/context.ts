/**
 * Items Context Factory
 * Creates the ItemsContext for headless (CLI/EC2) execution.
 */

import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ItemsContext, Item } from "./types";

export function createContext(client: ConvexClient): Partial<ItemsContext> & {
  _configure?: (config: Record<string, unknown>) => void;
  setup?: (visibleId: string, workerId: number) => Promise<void>;
} {
  // State managed by subscriptions
  let cachedItems: Item[] = [];

  // Project partitioning state
  let assignedProjectId: number | undefined;
  let numProjects = 0;
  let currentUnsubscribe: (() => void) | undefined;

  let subscribed = false;

  // Subscribe to items, optionally scoped to a projectId
  const subscribeToItems = (projectId?: number) => {
    // Unsubscribe from previous subscription if any
    if (currentUnsubscribe) {
      currentUnsubscribe();
    }

    subscribed = true;
    const args: { limit: number; projectId?: number } = { limit: 1000 };
    if (projectId !== undefined) {
      args.projectId = projectId;
    }

    currentUnsubscribe = client.onUpdate(api.items.listItems, args, (items) => {
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
        projectId: item.projectId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    });
  };

  // Lazily subscribe on first read access
  const ensureSubscribed = () => {
    if (!subscribed) {
      subscribeToItems(assignedProjectId);
    }
  };

  const context: Partial<ItemsContext> & {
    _configure?: (config: Record<string, unknown>) => void;
    setup?: (visibleId: string, workerId: number) => Promise<void>;
  } = {
    // ============== Configuration ==============

    _configure(config: Record<string, unknown>) {
      if (typeof config.numProjects === 'number') {
        numProjects = config.numProjects;
      }
    },

    async setup(_visibleId: string, workerId: number) {
      if (numProjects > 0) {
        assignedProjectId = workerId % numProjects;
        console.log(`[Context] Worker ${workerId} assigned to project ${assignedProjectId} (of ${numProjects})`);
        // Re-subscribe scoped to this worker's project
        subscribeToItems(assignedProjectId);
      }
    },

    // ============== Item Operations ==============

    createItem: async (data) => {
      const result = await client.mutation(api.items.createItem, {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags,
        projectId: data.projectId ?? assignedProjectId,
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
          projectId: item.projectId ?? assignedProjectId,
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

    getItems: () => {
      ensureSubscribed();
      return cachedItems;
    },

    getItemsByStatus: (status) => {
      ensureSubscribed();
      return cachedItems.filter((item) => item.status === status);
    },

    getItemsByPriority: (priority) => {
      ensureSubscribed();
      return cachedItems.filter((item) => item.priority === priority);
    },

    getRandomItem: () => {
      ensureSubscribed();
      if (cachedItems.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * cachedItems.length);
      return cachedItems[randomIndex];
    },

    getItemCount: () => {
      ensureSubscribed();
      return cachedItems.length;
    },
  };

  return context;
}
