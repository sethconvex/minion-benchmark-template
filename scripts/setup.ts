/**
 * Setup Script - Clear All Data
 *
 * Clears all items from the database to ensure a clean slate before each test run.
 *
 * Usage:
 *   CONVEX_URL=https://your-deployment.convex.cloud npx tsx scripts/setup.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL environment variable is required");
  process.exit(1);
}

console.log("[Setup] Clearing all data...");
console.log(`[Setup] Convex URL: ${CONVEX_URL}`);

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  try {
    // Clear all items in batches to stay within Convex read limits
    let totalDeleted = 0;
    let hasMore = true;
    while (hasMore) {
      const result = await client.mutation(api.items.clearAll, {});
      totalDeleted += result.deleted;
      hasMore = result.hasMore;
      if (hasMore) {
        console.log(`[Setup] Cleared ${totalDeleted} items so far...`);
      }
    }
    console.log(`[Setup] Cleared ${totalDeleted} items total`);
    console.log("[Setup] Complete - database is clean");
    process.exit(0);
  } catch (error) {
    console.error("[Setup] Error:", error);
    process.exit(1);
  }
}

main();
