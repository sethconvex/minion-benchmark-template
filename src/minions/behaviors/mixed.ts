import type { MinionBehavior } from "../../../lib/minion-benchmark";
import type { ItemsContext } from "../types";

const TITLES = [
  "Review quarterly report",
  "Update documentation",
  "Fix login bug",
  "Design new feature",
  "Write unit tests",
];

const TAGS = ["urgent", "backend", "frontend", "bug", "feature"];
const STATUSES = ["pending", "active", "completed"];

/**
 * Mixed Minion
 *
 * Realistic workload with 70% reads and 30% writes.
 * Simulates typical application usage patterns.
 */
export const mixedBehavior: MinionBehavior<ItemsContext> = {
  name: "Mixed",
  description: "70% reads, 30% writes - realistic workload simulation",

  async init(ctx) {
    ctx.log("Mixed workload initialized");

    // Wait for initial data to load
    await ctx.sleep(500);

    const itemCount = ctx.getItemCount();
    ctx.log(`Found ${itemCount} items in cache`);

    if (itemCount === 0) {
      ctx.log("WARNING: No items found. Run the Seeder first for best results!");
    }
  },

  async run(ctx) {
    ctx.log("Starting mixed workload (70% reads, 30% writes)...");

    let iterations = 0;
    let reads = 0;
    let writes = 0;
    const startTime = Date.now();

    while (!ctx.shouldStop()) {
      iterations++;

      const opStart = Date.now();
      let success = true;

      try {
        // Decide: read (70%) or write (30%)
        const isRead = ctx.random.next() < 0.7;

        if (isRead) {
          // Read operation
          const readOp = ctx.random.int(0, 4);

          switch (readOp) {
            case 0: {
              ctx.getItems();
              break;
            }
            case 1: {
              const status = ctx.random.pick(STATUSES);
              ctx.getItemsByStatus(status);
              break;
            }
            case 2: {
              const priority = ctx.random.int(1, 6);
              ctx.getItemsByPriority(priority);
              break;
            }
            case 3: {
              ctx.getRandomItem();
              break;
            }
          }

          reads++;
        } else {
          // Write operation
          const writeOp = ctx.random.int(0, 3);

          switch (writeOp) {
            case 0: {
              // Create
              const title = `${ctx.random.pick(TITLES)} #${Date.now() % 10000}`;
              await ctx.createItem({
                title,
                status: ctx.random.pick(STATUSES),
                priority: ctx.random.int(1, 6),
                tags: ctx.random.shuffle([...TAGS]).slice(0, ctx.random.int(0, 3)),
              });

              if (iterations % 100 === 1) {
                ctx.log(`Created: ${title}`);
              }
              break;
            }

            case 1:
            case 2: {
              // Update (more common than create)
              const item = ctx.getRandomItem();
              if (item) {
                await ctx.updateItem(item.id, {
                  status: ctx.random.pick(STATUSES),
                  priority: ctx.random.int(1, 6),
                });

                if (iterations % 100 === 1) {
                  ctx.log(`Updated: ${item.title}`);
                }
              }
              break;
            }
          }

          writes++;
        }
      } catch (err) {
        success = false;
        ctx.log(`ERROR: Operation failed: ${err}`);
      }

      if (ctx.reportMetric) {
        ctx.reportMetric(Date.now() - opStart, success);
      }

      // Log progress periodically
      if (iterations % 200 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const rate = Math.round(iterations / Math.max(1, elapsed));
        const readPct = Math.round((reads / iterations) * 100);
        ctx.log(`Progress: ${reads} reads, ${writes} writes (${readPct}% reads, ${rate} ops/s)`);
      }

      // Variable delay based on operation type
      const delay = ctx.random.int(30, 150);
      await ctx.sleep(delay);
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const readPct = Math.round((reads / iterations) * 100);
    ctx.log(`Mixed workload complete: ${reads} reads, ${writes} writes (${readPct}% reads) in ${totalTime}s`);
  },
};
