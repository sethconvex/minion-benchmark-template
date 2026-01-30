/**
 * Items Benchmark App Manifest
 *
 * Exposes the app's metadata and behaviors to the harness.
 * Config schemas are derived from Zod schemas in behavior files.
 */

import type { BenchmarkAppManifest } from "../../lib/minion-benchmark";
import { extractBehaviorConfigInfo } from "../../lib/minion-benchmark";
import { seederConfigSchema } from "./behaviors/seeder";
import { readerConfigSchema } from "./behaviors/reader";
import { writerConfigSchema } from "./behaviors/writer";

export const manifest: BenchmarkAppManifest = {
  key: "items",
  name: "Items Benchmark",
  description:
    "Generic items/tasks benchmark app. Tests CRUD operations, filtering by status/priority, and batch operations.",
  defaultUrl: process.env.VITE_CONVEX_URL ?? "",
  // Setup script clears all data for a clean slate
  setupScript: "scripts/setup.ts",
  behaviors: [
    {
      key: "seeder",
      name: "Seeder",
      description: "Creates test items with random data",
      category: "seeder",
      configSchema: extractBehaviorConfigInfo(seederConfigSchema),
    },
    {
      key: "reader",
      name: "Reader",
      description: "Query-only workload - reads items by status and priority",
      category: "reader",
      configSchema: extractBehaviorConfigInfo(readerConfigSchema),
    },
    {
      key: "writer",
      name: "Writer",
      description: "Write-heavy workload - creates and updates items",
      category: "writer",
      configSchema: extractBehaviorConfigInfo(writerConfigSchema),
    },
    {
      key: "mixed",
      name: "Mixed",
      description: "70% reads, 30% writes - realistic workload simulation",
      category: "mixed",
    },
  ],
};

export default manifest;
