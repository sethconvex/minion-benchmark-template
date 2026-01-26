# Convex Benchmark Template

A template repository for creating Convex load testing benchmark apps with minion behaviors. Fork this repo to create your own custom benchmark that works with the [Minions load testing harness](https://github.com/get-convex/minions).

## Using with Minions Harness

To run load tests with the Minions harness (EC2/Fargate workers):

1. **Fork this repository** (or use it as a template) to create your own benchmark

2. **Get your Convex Deploy Key:**
   - Go to your [Convex Dashboard](https://dashboard.convex.dev)
   - Navigate to Settings → Deploy Keys
   - Create a new deploy key

3. **Get a GitHub Personal Access Token** (for private repos):
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create a token with `repo` scope

4. **In the Minions harness:**
   - Enter your GitHub repo URL: `github.com/your-org/your-benchmark`
   - Provide your **Convex Deploy Key** (required - deploys your backend)
   - Provide your **GitHub Token** (only needed for private repos)
   - Select behaviors and worker counts
   - Start the test

The harness will:
1. Fetch the manifest from your repo to discover available behaviors
2. Clone your repo on EC2 instances
3. Run `npm install` to install dependencies
4. Deploy your Convex backend using the deploy key
5. Start workers running your behaviors against the deployed backend

## Local Development

### Quick Start

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

## Creating Your Own Benchmark

1. **Fork or use this template** to create your own repo

2. **Modify the schema** in `convex/schema.ts` for your domain

3. **Add Convex functions** in `convex/` for your app logic

4. **Update the context** in `src/minions/types.ts` and `src/minions/context.ts`

5. **Create behaviors** in `src/minions/behaviors/` (see CLAUDE.md for patterns)

6. **Update the manifest** in `src/minions/manifest.ts`

7. **Regenerate and commit:**
   ```bash
   npm run generate:manifest
   git add convex/manifest.generated.json
   git commit -m "Update manifest"
   git push
   ```

The `manifest.generated.json` file **must be committed** to your repo - the harness fetches it directly from GitHub to discover your behaviors before cloning.

## Customization Guide

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

## Important Notes

- **`manifest.generated.json` must be committed** - The harness fetches this from GitHub before cloning to discover available behaviors
- **Deploy keys are required** - The harness needs a Convex deploy key to deploy your backend on EC2
- **GitHub tokens are optional** - Only needed for private repositories
- The harness creates a preview deployment for each test run to avoid affecting production

## License

MIT
