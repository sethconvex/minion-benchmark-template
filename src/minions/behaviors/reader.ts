import type { MinionBehavior } from "../../../lib/minion-benchmark";
import type { ItemsContext } from "../types";

const STATUSES = ["pending", "active", "completed"];

/**
 * Reader Minion
 *
 * Query-only workload that reads items by various criteria.
 * Tests subscription performance and query throughput.
 * Does NOT modify any data.
 */
export const readerBehavior: MinionBehavior<ItemsContext> = {
  name: "Reader",
  description: "Query-only workload - reads items by status and priority",

  async init(ctx) {
    ctx.log("Reader initialized - will read items without modifications");

    // Wait for initial data to load
    await ctx.sleep(500);

    const itemCount = ctx.getItemCount();
    ctx.log(`Found ${itemCount} items in cache`);

    if (itemCount === 0) {
      ctx.log("WARNING: No items found. Run the Seeder first!");
    }
  },

  async run(ctx) {
    ctx.log("Starting read loop...");

    let iterations = 0;
    const startTime = Date.now();

    while (!ctx.shouldStop()) {
      iterations++;

      // Randomly pick a read operation
      const operation = ctx.random.int(0, 5);

      const opStart = Date.now();
      let success = true;

      try {
        switch (operation) {
          case 0: {
            // Read all items
            const all = ctx.getItems();
            if (iterations % 50 === 1) {
              ctx.log(`Read all: ${all.length} items`);
            }
            break;
          }

          case 1: {
            // Read by status
            const status = ctx.random.pick(STATUSES);
            const byStatus = ctx.getItemsByStatus(status);
            if (iterations % 50 === 1) {
              ctx.log(`Read by status "${status}": ${byStatus.length} items`);
            }
            break;
          }

          case 2: {
            // Read by priority
            const priority = ctx.random.int(1, 6);
            const byPriority = ctx.getItemsByPriority(priority);
            if (iterations % 50 === 1) {
              ctx.log(`Read by priority ${priority}: ${byPriority.length} items`);
            }
            break;
          }

          case 3: {
            // Get random item
            const item = ctx.getRandomItem();
            if (iterations % 50 === 1) {
              ctx.log(`Random item: ${item ? item.title : "none"}`);
            }
            break;
          }

          case 4: {
            // Get item count
            const count = ctx.getItemCount();
            if (iterations % 50 === 1) {
              ctx.log(`Item count: ${count}`);
            }
            break;
          }
        }
      } catch (err) {
        success = false;
        ctx.log(`ERROR: Read operation failed: ${err}`);
      }

      if (ctx.reportMetric) {
        ctx.reportMetric(Date.now() - opStart, success);
      }

      // Log progress periodically
      if (iterations % 100 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const rate = Math.round(iterations / Math.max(1, elapsed));
        ctx.log(`Completed ${iterations} reads (${rate}/s)`);
      }

      // Small delay between reads
      await ctx.sleep(ctx.random.int(20, 100));
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    ctx.log(`Reader complete: ${iterations} reads in ${totalTime}s`);
  },
};
