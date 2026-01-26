import { z } from "zod";
import type { MinionBehavior } from "../../../lib/minion-benchmark";
import type { ItemsContext } from "../types";

/**
 * Configuration schema for the Seeder behavior.
 * Defines configurable parameters with validation, defaults, and descriptions.
 */
export const seederConfigSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(10000)
    .default(100)
    .describe("Number of items to create"),
  batchSize: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe("Number of items per batch insert"),
});

export type SeederConfig = z.infer<typeof seederConfigSchema>;

// Sample data for generating items
const TITLES = [
  "Review quarterly report",
  "Update documentation",
  "Fix login bug",
  "Design new feature",
  "Write unit tests",
  "Deploy to staging",
  "Code review PR #123",
  "Refactor auth module",
  "Add analytics tracking",
  "Optimize database queries",
  "Setup CI/CD pipeline",
  "Create API endpoints",
  "Implement caching",
  "Update dependencies",
  "Write integration tests",
];

const TAGS = [
  "urgent",
  "backend",
  "frontend",
  "bug",
  "feature",
  "docs",
  "testing",
  "infra",
  "security",
  "performance",
];

const STATUSES = ["pending", "active", "completed"];

/**
 * Seeder Minion
 *
 * Creates a configurable number of items with random data for testing.
 * Uses batch inserts for efficiency. Runs quickly then stops.
 */
export const seederBehavior: MinionBehavior<ItemsContext, SeederConfig> = {
  name: "Seeder",
  description: "Creates test items with random data (configurable count and batch size)",
  configSchema: seederConfigSchema,

  async init(ctx) {
    // Get config from context (merged in by worker) with defaults
    const config = seederConfigSchema.parse({
      count: (ctx as unknown as Record<string, unknown>).count,
      batchSize: (ctx as unknown as Record<string, unknown>).batchSize,
    });

    const { count, batchSize } = config;

    ctx.log(`Starting seeder - creating ${count} items in batches of ${batchSize}...`);

    const startTime = Date.now();
    let created = 0;

    while (created < count) {
      if (ctx.shouldStop()) {
        ctx.log(`Stopped at ${created}/${count} items`);
        return;
      }

      // Build batch
      const remaining = count - created;
      const currentBatchSize = Math.min(batchSize, remaining);
      const batch = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const title = `${ctx.random.pick(TITLES)} #${created + i + 1}`;
        const status = ctx.random.pick(STATUSES);
        const priority = ctx.random.int(1, 6); // 1-5
        const numTags = ctx.random.int(0, 4);
        const tags = ctx.random.shuffle([...TAGS]).slice(0, numTags);

        batch.push({
          title,
          description: ctx.random.next() > 0.3 ? `Description for ${title}` : undefined,
          status,
          priority,
          tags,
        });
      }

      // Insert batch
      const batchStart = Date.now();
      try {
        await ctx.createItems(batch);
        if (ctx.reportMetric) {
          ctx.reportMetric(Date.now() - batchStart, true);
        }
      } catch (err) {
        ctx.log(`ERROR: Failed to create batch: ${err}`);
        if (ctx.reportMetric) {
          ctx.reportMetric(Date.now() - batchStart, false);
        }
      }

      created += currentBatchSize;

      // Progress logging every 10%
      if (created % Math.max(1, Math.floor(count / 10)) === 0 || created === count) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const rate = Math.round(created / Math.max(1, elapsed));
        ctx.log(`Progress: ${created}/${count} items (${elapsed}s, ${rate}/s)`);
      }

      // Small delay to avoid overwhelming the system
      await ctx.sleep(50);
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    ctx.log(`Seeding complete: ${count} items in ${totalTime}s`);
  },

  async run(ctx) {
    ctx.log("Seeder complete - no run phase needed");
  },
};
