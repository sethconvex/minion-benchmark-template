/**
 * CLI Runner for Items Benchmark Minions
 *
 * Usage:
 *   CONVEX_URL=https://your-deployment.convex.cloud npx tsx scripts/run-minion.ts [behavior]
 *
 * Examples:
 *   CONVEX_URL=... npx tsx scripts/run-minion.ts seeder
 *   CONVEX_URL=... npx tsx scripts/run-minion.ts reader
 *   CONVEX_URL=... npx tsx scripts/run-minion.ts writer
 *   CONVEX_URL=... npx tsx scripts/run-minion.ts mixed
 */

import { ConvexClient } from "convex/browser";
import { SeededRandom } from "../lib/minion-benchmark";
import { behaviors, type ItemsContext, type Item } from "../src/minions";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL environment variable is required");
  console.error("");
  console.error(
    "Usage: CONVEX_URL=https://your-deployment.convex.cloud npx tsx scripts/run-minion.ts [behavior]"
  );
  console.error("");
  console.error(`Available behaviors: ${Object.keys(behaviors).join(", ")}`);
  process.exit(1);
}

const behaviorName = process.argv[2] || "seeder";
const behavior = behaviors[behaviorName.toLowerCase()];
if (!behavior) {
  console.error(`Unknown behavior: ${behaviorName}`);
  console.error(`Available behaviors: ${Object.keys(behaviors).join(", ")}`);
  process.exit(1);
}

const visibleId = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const userName = `CLI-${behaviorName}`;

console.log(`User ID: ${visibleId}`);
console.log(`Behavior: ${behavior.name}`);
console.log(`Convex URL: ${CONVEX_URL}`);
console.log("");

const client = new ConvexClient(CONVEX_URL);

let shouldStop = false;
let items: Item[] = [];

process.on("SIGINT", () => {
  console.log("\nStopping...");
  shouldStop = true;
  void client.close();
  process.exit(0);
});

async function initialize(): Promise<void> {
  console.log("Initializing...");
}

function subscribeToData() {
  client.onUpdate(api.items.listItems, { limit: 1000 }, (result: any) => {
    if (result) {
      items = result.map((item: any) => ({
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
    }
  });
}

function createContext(
  log: (msg: string) => void,
  checkStop: () => boolean,
  seed: number
): ItemsContext {
  return {
    random: new SeededRandom(seed),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    shouldStop: checkStop,
    log,

    createItem: async (data) => {
      return await client.mutation(api.items.createItem, {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags,
      });
    },

    createItems: async (itemsData) => {
      return await client.mutation(api.items.createItems, {
        items: itemsData.map((item) => ({
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          tags: item.tags,
        })),
      });
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

    getItems: () => items,

    getItemsByStatus: (status) => items.filter((item) => item.status === status),

    getItemsByPriority: (priority) => items.filter((item) => item.priority === priority),

    getRandomItem: () => {
      if (items.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * items.length);
      return items[randomIndex];
    },

    getItemCount: () => items.length,
  };
}

async function main() {
  try {
    await initialize();
    subscribeToData();

    // Wait for initial subscription data
    await new Promise((r) => setTimeout(r, 1000));

    console.log(`\nStarting ${behavior.name}...`);
    console.log("---");

    const ctx = createContext(
      (msg) => {
        const ts = new Date().toLocaleTimeString();
        console.log(`[${ts}] ${msg}`);
      },
      () => shouldStop,
      Date.now()
    );

    await behavior.init(ctx);
    if (!shouldStop) {
      await behavior.run(ctx);
    }

    console.log("---");
    console.log("Behavior completed");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    void client.close();
    process.exit(0);
  }
}

void main();
