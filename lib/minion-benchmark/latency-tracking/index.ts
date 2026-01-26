/**
 * Latency Tracking for Convex Benchmark Apps
 *
 * Provides automatic latency tracking for Convex operations with
 * batched reporting to worker instances.
 *
 * @example
 * ```tsx
 * import {
 *   LatencyProvider,
 *   useTrackedMutation,
 *   useTrackedQuery,
 * } from "./lib/minion-benchmark/latency-tracking";
 *
 * // In your app root:
 * <LatencyProvider
 *   reportUrl="http://localhost:3001/metrics"
 *   flushIntervalMs={5000}
 *   debug={true}
 * >
 *   <ConvexProvider client={convex}>
 *     <App />
 *   </ConvexProvider>
 * </LatencyProvider>
 *
 * // In your components:
 * const sendMessage = useTrackedMutation(api.messages.send);
 * const messages = useTrackedQuery(api.messages.list, { channelId });
 * ```
 */

// Types
export type {
  ConvexOperationType,
  LatencyRecord,
  LatencyMetrics,
  TypeMetrics,
  LatencyReporterConfig,
  LatencyContextValue,
} from "./types";

// Context and Provider
export {
  LatencyProvider,
  useLatencyContext,
  useLatencyTracking,
  type LatencyProviderProps,
} from "./LatencyContext";

// Tracked hooks
export {
  useTrackedMutation,
  useTrackedAction,
  useTrackedQuery,
  useRecordLatency,
} from "./hooks";

// Metrics collector (for advanced use)
export { LatencyMetricsCollector } from "./metrics-collector";
