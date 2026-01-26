# CLAUDE.md - AI Instructions for Convex Benchmark Template

This file provides guidance for AI assistants working with this codebase.

## Project Overview

This is a **Convex load testing benchmark template** that can be forked to create custom benchmark apps. It includes:

- **React frontend** with minion control panel
- **Convex backend** with items/users schema
- **Four behavior patterns**: Seeder, Reader, Writer, Mixed
- **CLI runner** for headless execution

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App                                │
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │ MinionToggle│  │   MinionPanel    │  │   Items Table      │  │
│  └─────────────┘  │  - Behavior      │  │   (data display)   │  │
│                   │    selector      │  │                    │  │
│                   │  - Start/Stop    │  │                    │  │
│                   │  - Logs          │  │                    │  │
│                   └─────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ useMinionRunner hook
                              │ creates context, runs behaviors
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ItemsContext                                 │
│  - random (SeededRandom)     - createItem()                     │
│  - sleep()                   - updateItem()                     │
│  - shouldStop()              - deleteItem()                     │
│  - log()                     - getItems()                       │
│  - reportMetric()            - getItemsByStatus()               │
│                              - getRandomItem()                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Convex mutations/queries
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Convex Backend                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ schema   │  │  items   │  │  users   │  │   http   │        │
│  │  .ts     │  │   .ts    │  │   .ts    │  │   .ts    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/minions/types.ts` | Defines `ItemsContext` interface |
| `src/minions/context.ts` | Context factory for CLI/headless execution |
| `src/minions/behaviors/*.ts` | Individual behavior implementations |
| `src/App.tsx` | React UI with context factory for browser |
| `lib/minion-benchmark/` | Core framework (bundled) |
| `scripts/run-minion.ts` | CLI runner for headless execution |

## Common Tasks

### Adding a New Behavior

**Step 1:** Create the behavior file at `src/minions/behaviors/myBehavior.ts`:

```typescript
import type { MinionBehavior } from "../../../lib/minion-benchmark";
import type { ItemsContext } from "../types";

/**
 * MyBehavior Minion
 *
 * Brief description of what this behavior does.
 */
export const myBehavior: MinionBehavior<ItemsContext> = {
  name: "My Behavior",
  description: "What this behavior does in one sentence",

  async init(ctx) {
    ctx.log("Initializing...");
    // Setup: create data, wait for subscriptions, etc.
    await ctx.sleep(500);
  },

  async run(ctx) {
    ctx.log("Starting main loop...");

    while (!ctx.shouldStop()) {
      // Your behavior logic here
      const opStart = Date.now();

      try {
        // Do something
        await ctx.createItem({ title: "Test item" });

        // Report success
        if (ctx.reportMetric) {
          ctx.reportMetric(Date.now() - opStart, true);
        }
      } catch (err) {
        ctx.log(`ERROR: ${err}`);
        if (ctx.reportMetric) {
          ctx.reportMetric(Date.now() - opStart, false);
        }
      }

      // Delay between operations
      await ctx.sleep(ctx.random.int(50, 200));
    }

    ctx.log("Behavior complete");
  },
};
```

**Step 2:** Export from `src/minions/index.ts`:

```typescript
import { myBehavior } from "./behaviors/myBehavior";

export const behaviors: Record<string, MinionBehavior<ItemsContext>> = {
  // ... existing behaviors
  myBehavior: myBehavior,
};

export { myBehavior };
```

**Step 3:** Add to manifest in `src/minions/manifest.ts`:

```typescript
behaviors: [
  // ... existing behaviors
  {
    key: "myBehavior",
    name: "My Behavior",
    description: "What this behavior does",
    category: "writer", // or "reader", "seeder", "mixed"
  },
],
```

**Step 4:** Regenerate manifest:
```bash
npm run generate:manifest
```

### Adding a Configurable Behavior

Add a Zod schema for configuration:

```typescript
import { z } from "zod";
import type { MinionBehavior } from "../../../lib/minion-benchmark";
import type { ItemsContext } from "../types";

export const myConfigSchema = z.object({
  count: z.number().min(1).max(1000).default(10).describe("Number of items"),
  delay: z.number().min(10).max(5000).default(100).describe("Delay between ops (ms)"),
});

export type MyConfig = z.infer<typeof myConfigSchema>;

export const myBehavior: MinionBehavior<ItemsContext, MyConfig> = {
  name: "My Behavior",
  description: "Configurable behavior example",
  configSchema: myConfigSchema,

  async init(ctx) {
    // Parse config from context (merged by worker)
    const config = myConfigSchema.parse({
      count: (ctx as unknown as Record<string, unknown>).count,
      delay: (ctx as unknown as Record<string, unknown>).delay,
    });

    ctx.log(`Creating ${config.count} items with ${config.delay}ms delay`);
    // Use config.count, config.delay...
  },

  async run(ctx) {
    // ...
  },
};
```

Then add configSchema to manifest:

```typescript
import { extractBehaviorConfigInfo } from "../../lib/minion-benchmark";
import { myConfigSchema } from "./behaviors/myBehavior";

behaviors: [
  {
    key: "myBehavior",
    name: "My Behavior",
    description: "...",
    category: "writer",
    configSchema: extractBehaviorConfigInfo(myConfigSchema),
  },
],
```

### Adding New Context Methods

**Step 1:** Add method signature to `src/minions/types.ts`:

```typescript
export interface ItemsContext extends BaseMinionContext {
  // ... existing methods

  /** New method description */
  myNewMethod(arg: string): Promise<Result>;
}
```

**Step 2:** Implement in both locations:

**Browser context** (`src/App.tsx` in `createContext`):
```typescript
const createContext = useCallback(
  (log, shouldStop, seed): ItemsContext => ({
    // ... existing methods

    myNewMethod: async (arg) => {
      return await myMutation({ arg });
    },
  }),
  [/* deps */]
);
```

**CLI context** (`src/minions/context.ts`):
```typescript
const context: Partial<ItemsContext> = {
  // ... existing methods

  myNewMethod: async (arg) => {
    return await client.mutation(api.items.myMutation, { arg });
  },
};
```

**CLI runner** (`scripts/run-minion.ts`):
```typescript
function createContext(log, checkStop, seed): ItemsContext {
  return {
    // ... existing methods

    myNewMethod: async (arg) => {
      return await client.mutation(api.items.myMutation, { arg });
    },
  };
}
```

### Modifying the Schema

1. Edit `convex/schema.ts`
2. Add corresponding mutations/queries in `convex/items.ts` or create new files
3. Update `ItemsContext` interface if adding new methods
4. Run `npm run dev` to sync changes

## Key Patterns

### Graceful Shutdown

Always check `ctx.shouldStop()` in loops:

```typescript
async run(ctx) {
  while (!ctx.shouldStop()) {
    // Work
    await ctx.sleep(100);
  }
  ctx.log("Stopped gracefully");
}
```

### Deterministic Randomness

Use `ctx.random` for reproducible tests:

```typescript
const item = ctx.random.pick(items);     // Pick random element
const num = ctx.random.int(1, 100);      // Random int [1, 100)
const pct = ctx.random.float(0, 1);      // Random float [0, 1)
ctx.random.shuffle(array);               // Shuffle in place
```

### Metric Reporting

Track operation latency:

```typescript
const start = Date.now();
try {
  await ctx.doSomething();
  ctx.reportMetric?.(Date.now() - start, true);
} catch (err) {
  ctx.reportMetric?.(Date.now() - start, false);
  throw err;
}
```

### Batch Operations

For bulk inserts, use batch mutations:

```typescript
// Good - single mutation
await ctx.createItems(items);

// Bad - N mutations
for (const item of items) {
  await ctx.createItem(item);  // Slow!
}
```

### Subscription-Based Reads

Context methods like `getItems()` read from subscriptions (cached data), not direct queries. This is faster and demonstrates realistic app behavior.

## Behavior Categories

| Category | Description | Example |
|----------|-------------|---------|
| `seeder` | Creates initial test data | Seeder |
| `reader` | Read-only workload | Reader |
| `writer` | Write-heavy workload | Writer |
| `mixed` | Balanced read/write | Mixed |

## Common Issues

### "No items found" Warning

Run the Seeder behavior first to create test data.

### Context Method Not Found

Ensure the method is implemented in both:
- `src/App.tsx` (browser context)
- `src/minions/context.ts` (CLI context)
- `scripts/run-minion.ts` (CLI runner)

### Manifest Out of Date

Regenerate after changing behaviors:
```bash
npm run generate:manifest
```

## Commands

```bash
npm run dev              # Start development (frontend + backend)
npm run build            # Production build
npm run lint             # Type check + lint
npm run generate:manifest # Regenerate manifest.json

# CLI execution
CONVEX_URL=... npx tsx scripts/run-minion.ts seeder
CONVEX_URL=... npx tsx scripts/run-minion.ts reader
CONVEX_URL=... npx tsx scripts/run-minion.ts writer
CONVEX_URL=... npx tsx scripts/run-minion.ts mixed
```

## Convex Best Practices

- Use `withIndex()` instead of `filter()` for queries
- Add indexes for all queried fields
- Use `internalMutation` for functions called only from other functions
- Include explicit `returns` validators on all functions
- Batch writes when possible to reduce OCC conflicts
