/**
 * Seeded random number generator interface
 */
export interface ISeededRandom {
  /** Random float between 0 and 1 */
  next(): number;
  /** Random integer between min (inclusive) and max (exclusive) */
  int(min: number, max: number): number;
  /** Random float between min and max */
  float(min: number, max: number): number;
  /** Pick random item from array */
  pick<T>(array: T[]): T;
  /** Shuffle array in place */
  shuffle<T>(array: T[]): T[];
}

/**
 * Structured logger interface.
 * Used when the context supports structured logging.
 */
export interface MinionLogger {
  /** Simple info message (backwards compatible) */
  info(message: string): void;
  /** Log an action being taken */
  action(name: string, target?: string, args?: Record<string, unknown>): void;
  /** Log the result of an action */
  result(success: boolean, message: string, latencyMs?: number): void;
  /** Log an error */
  error(message: string, code?: string): void;
  /** Highlight an element in the UI */
  highlight(elementId: string, style?: "active" | "success" | "error" | "clear"): void;
  /** Record a metric */
  metric(name: string, value: number, op?: "set" | "inc"): void;
}

/**
 * Base context provided to all minion behaviors.
 * Apps extend this with their own methods.
 */
export interface BaseMinionContext {
  /** Seeded random number generator */
  random: ISeededRandom;

  /** Sleep for a duration in milliseconds */
  sleep(ms: number): Promise<void>;

  /** Check if the behavior should stop */
  shouldStop(): boolean;

  /**
   * Log a message (simple string or structured).
   * Can be called as log("message") for backwards compat,
   * or access log.action(), log.result(), etc. for structured logging.
   */
  log: ((message: string) => void) & Partial<MinionLogger>;

  /**
   * Report a metric to the shared metrics collector (optional).
   * Used for latency tracking and aggregated metrics.
   * @param latencyMs - The latency of the operation in milliseconds
   * @param success - Whether the operation succeeded
   */
  reportMetric?(latencyMs: number, success: boolean): void;
}

/**
 * A minion behavior definition.
 * Generic over the app-specific context type and optional config type.
 *
 * @template TContext - The app-specific context type (extends BaseMinionContext)
 * @template TConfig - Optional configuration type validated by configSchema
 */
export interface MinionBehavior<
  TContext extends BaseMinionContext = BaseMinionContext,
  TConfig = unknown
> {
  /** Display name */
  name: string;

  /** Description of what this behavior does */
  description: string;

  /**
   * Optional Zod schema for behavior configuration.
   * When provided, the UI will auto-generate a form with descriptions.
   * Config values are merged into the context at runtime.
   *
   * Example:
   * ```typescript
   * import { z } from 'zod';
   * configSchema: z.object({
   *   count: z.number().min(1).default(10).describe('Number of items to create'),
   * })
   * ```
   */
  configSchema?: import('zod').ZodType<TConfig, import('zod').ZodTypeDef, unknown>;

  /**
   * Initialize resources before the main run loop.
   * Use this to create data, set up state, etc.
   */
  init(ctx: TContext): Promise<void>;

  /**
   * The main behavior loop.
   * Should periodically check ctx.shouldStop() and exit gracefully.
   */
  run(ctx: TContext): Promise<void>;
}

/**
 * Behavior category for grouping in UI.
 */
export type BehaviorCategory = "seeder" | "writer" | "reader" | "mixed";

/**
 * Behavior manifest for app registration.
 */
export interface BehaviorManifest {
  key: string;
  name: string;
  description: string;
  category: BehaviorCategory;
  configSchema?: BehaviorConfigInfo;
}

/**
 * Config field info for UI generation.
 */
export interface ConfigFieldInfo {
  name: string;
  type: 'number' | 'string' | 'boolean';
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

/**
 * Config schema info for a behavior.
 */
export interface BehaviorConfigInfo {
  fields: ConfigFieldInfo[];
  defaults: Record<string, unknown>;
}

/**
 * Benchmark app manifest.
 */
export interface BenchmarkAppManifest {
  key: string;
  name: string;
  description: string;
  defaultUrl: string;
  behaviors: BehaviorManifest[];
  /** Default setup script path (e.g., "scripts/setup.ts") */
  setupScript?: string;
  /** Default teardown script path */
  teardownScript?: string;
}
