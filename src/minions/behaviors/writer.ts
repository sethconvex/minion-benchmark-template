import { z } from "zod";
import type { MinionBehavior } from "../../../lib/minion-benchmark";
import type { ItemsContext } from "../types";

export const writerConfigSchema = z.object({
  numProjects: z
    .number()
    .min(0)
    .max(1000)
    .default(0)
    .describe("Number of projects to partition across (0 = no partitioning)"),
});

export type WriterConfig = z.infer<typeof writerConfigSchema>;

const TITLES = [
  "Review quarterly report",
  "Update documentation",
  "Fix login bug",
  "Design new feature",
  "Write unit tests",
  "Deploy to staging",
  "Code review PR",
  "Refactor module",
  "Add tracking",
  "Optimize queries",
];

const TAGS = ["urgent", "backend", "frontend", "bug", "feature", "docs"];
const STATUSES = ["pending", "active", "completed"];

/**
 * Writer Minion
 *
 * Write-heavy workload that creates and updates items.
 * ~30% creates, ~70% updates to test write throughput.
 * Tracks created items locally — does NOT subscribe to listItems.
 */
export const writerBehavior: MinionBehavior<ItemsContext> = {
  name: "Writer",
  description: "Write-heavy workload - creates and updates items (30/70 split)",

  async init(ctx) {
    ctx.log("Writer initialized (no listItems subscription)");
  },

  async run(ctx) {
    ctx.log("Starting write loop...");

    // Track items we've created locally so we can update them without listItems
    const knownItems: { id: string; title: string }[] = [];

    let iterations = 0;
    let creates = 0;
    let updates = 0;
    const startTime = Date.now();

    while (!ctx.shouldStop()) {
      iterations++;

      const opStart = Date.now();
      let success = true;

      try {
        // Decide: create (30%) or update (70%), but always create if we have nothing to update
        const shouldCreate = ctx.random.next() < 0.3 || knownItems.length === 0;

        if (shouldCreate) {
          // Create new item
          const title = `${ctx.random.pick(TITLES)} #${Date.now() % 10000}`;
          const status = ctx.random.pick(STATUSES);
          const priority = ctx.random.int(1, 6);
          const numTags = ctx.random.int(0, 3);
          const tags = ctx.random.shuffle([...TAGS]).slice(0, numTags);

          const id = await ctx.createItem({
            title,
            status,
            priority,
            tags,
          });

          knownItems.push({ id: id as string, title });

          creates++;
          if (iterations % 50 === 1) {
            ctx.log(`Created: ${title}`);
          }
        } else {
          // Update a random item we've previously created
          const item = knownItems[Math.floor(ctx.random.next() * knownItems.length)];
          // Randomly update some fields
          const updateData: Record<string, unknown> = {};

          if (ctx.random.next() < 0.5) {
            updateData.status = ctx.random.pick(STATUSES);
          }
          if (ctx.random.next() < 0.3) {
            updateData.priority = ctx.random.int(1, 6);
          }
          if (ctx.random.next() < 0.2) {
            const numTags = ctx.random.int(0, 3);
            updateData.tags = ctx.random.shuffle([...TAGS]).slice(0, numTags);
          }

          await ctx.updateItem(item.id, updateData as any);

          updates++;
          if (iterations % 50 === 1) {
            ctx.log(`Updated: ${item.title}`);
          }
        }
      } catch (err) {
        success = false;
        ctx.log(`ERROR: Write operation failed: ${err}`);
      }

      if (ctx.reportMetric) {
        ctx.reportMetric(Date.now() - opStart, success);
      }

      // Log progress periodically
      if (iterations % 100 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const rate = Math.round(iterations / Math.max(1, elapsed));
        ctx.log(`Progress: ${creates} creates, ${updates} updates, ${knownItems.length} tracked (${rate} ops/s)`);
      }

      // Small delay between writes
      await ctx.sleep(ctx.random.int(50, 200));
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    ctx.log(`Writer complete: ${creates} creates, ${updates} updates in ${totalTime}s`);
  },
};
