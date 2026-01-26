# Convex Benchmark Template

A template repository for creating Convex load testing benchmark apps with minion behaviors.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development:**
   ```bash
   npm run dev
   ```
   This will:
   - Generate the manifest
   - Start Convex backend (creates a new project on first run)
   - Open the dashboard in your browser
   - Start the Vite frontend

3. **Run a minion behavior:**
   - Click the "Minion Mode" toggle in the header
   - Select a behavior (e.g., "Seeder")
   - Click "Start"

## Available Behaviors

| Behavior | Category | Description |
|----------|----------|-------------|
| **Seeder** | seeder | Creates test items with random data (configurable count and batch size) |
| **Reader** | reader | Query-only workload - reads items by status and priority |
| **Writer** | writer | Write-heavy workload - 30% creates, 70% updates |
| **Mixed** | mixed | 70% reads, 30% writes - realistic workload simulation |

## Headless Execution (CLI)

Run behaviors without the browser UI:

```bash
# Set your Convex URL
export CONVEX_URL=https://your-deployment.convex.cloud

# Run a behavior
npx tsx scripts/run-minion.ts seeder
npx tsx scripts/run-minion.ts reader
npx tsx scripts/run-minion.ts writer
npx tsx scripts/run-minion.ts mixed
```

## Project Structure

```
convex-benchmark-template/
├── convex/                      # Convex backend
│   ├── schema.ts               # Database schema (users, items)
│   ├── items.ts                # Item CRUD operations
│   ├── users.ts                # User management
│   └── http.ts                 # Manifest HTTP endpoint
├── src/
│   ├── App.tsx                 # React UI with MinionPanel
│   ├── main.tsx                # Entry point
│   └── minions/
│       ├── index.ts            # Exports behaviors + context
│       ├── types.ts            # ItemsContext interface
│       ├── context.ts          # Context factory for CLI
│       ├── manifest.ts         # App metadata
│       └── behaviors/
│           ├── seeder.ts       # Seed data behavior
│           ├── reader.ts       # Read-only behavior
│           ├── writer.ts       # Write-heavy behavior
│           └── mixed.ts        # Mixed read/write
├── lib/
│   └── minion-benchmark/       # Bundled minion framework
│       ├── types.ts            # Core interfaces
│       ├── SeededRandom.ts     # Deterministic PRNG
│       ├── useMinionRunner.ts  # React hook
│       ├── schema-utils.ts     # Zod schema utilities
│       ├── react/              # UI components
│       └── latency-tracking/   # Optional latency tracking
└── scripts/
    ├── run-minion.ts           # CLI runner
    └── generate-manifest.ts    # Build manifest JSON
```

## Customization

See [CLAUDE.md](./CLAUDE.md) for detailed instructions on:
- Adding new behaviors
- Adding new context methods
- Modifying the schema
- Understanding the framework patterns

## Schema

The template includes a simple `items` table with common patterns:

```typescript
items: defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  status: v.string(),           // "pending" | "active" | "completed"
  priority: v.number(),         // 1-5
  ownerId: v.optional(v.id("users")),
  tags: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_status", ["status", "updatedAt"])
  .index("by_owner", ["ownerId", "updatedAt"])
  .index("by_priority", ["priority", "updatedAt"])
  .index("by_createdAt", ["createdAt"])
```

## License

MIT
