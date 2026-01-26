/**
 * Generate manifest.json for Convex HTTP endpoint
 *
 * This runs at build time in Node.js where we have access to:
 * - Zod schemas in src/minions/behaviors/
 * - zod-to-json-schema for conversion
 *
 * The output is a static JSON file that the Convex HTTP action can serve.
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { manifest } from "../src/minions/manifest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "../convex/manifest.generated.json");

// Serialize manifest (Zod→JSON conversion happens at import time)
const json = JSON.stringify(manifest, null, 2);
writeFileSync(outputPath, json);

console.log(`Generated ${outputPath}`);
