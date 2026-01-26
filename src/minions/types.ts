import type { BaseMinionContext } from "../../lib/minion-benchmark";

/**
 * Simplified item type for behavior use.
 */
export interface Item {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  ownerId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Items app-specific context.
 * Extends BaseMinionContext with methods to interact with the items database.
 */
export interface ItemsContext extends BaseMinionContext {
  // ============== Item Operations ==============

  /** Create a new item */
  createItem(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: number;
    tags?: string[];
  }): Promise<string>;

  /** Create multiple items at once (batch) */
  createItems(items: Array<{
    title: string;
    description?: string;
    status?: string;
    priority?: number;
    tags?: string[];
  }>): Promise<string[]>;

  /** Update an existing item */
  updateItem(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: number;
    tags?: string[];
  }): Promise<void>;

  /** Delete an item */
  deleteItem(id: string): Promise<void>;

  // ============== Queries ==============

  /** Get all items (from subscription cache) */
  getItems(): Item[];

  /** Get items filtered by status */
  getItemsByStatus(status: string): Item[];

  /** Get items filtered by priority */
  getItemsByPriority(priority: number): Item[];

  /** Get a random item from the cache */
  getRandomItem(): Item | null;

  /** Get total item count */
  getItemCount(): number;
}
