/**
 * Latency Tracking Types
 *
 * Types for automatic latency tracking of Convex operations.
 */

export type ConvexOperationType = "query" | "mutation" | "action";

export interface LatencyRecord {
  /** Type of Convex operation */
  type: ConvexOperationType;
  /** Function name (e.g., "messages:sendMessage") */
  functionName: string;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Timestamp when the operation started */
  timestamp: number;
  /** Error message if failed */
  error?: string;
}

export interface LatencyMetrics {
  /** Total operations tracked */
  totalCount: number;
  /** Successful operations */
  successCount: number;
  /** Failed operations */
  errorCount: number;
  /** Latency percentiles */
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  latencyMin: number;
  latencyMax: number;
  latencyMean: number;
  /** Operations per second */
  opsPerSecond: number;
  /** Breakdown by operation type */
  byType: {
    query: TypeMetrics;
    mutation: TypeMetrics;
    action: TypeMetrics;
  };
}

export interface TypeMetrics {
  count: number;
  successCount: number;
  errorCount: number;
  latencyMean: number;
  latencyP95: number;
}

export interface LatencyReporterConfig {
  /** URL to POST metrics to (e.g., worker endpoint) */
  reportUrl?: string;
  /** Flush interval in milliseconds (default: 5000) */
  flushIntervalMs?: number;
  /** Maximum records to buffer before auto-flush (default: 100) */
  maxBufferSize?: number;
  /** Custom callback when metrics are flushed */
  onFlush?: (records: LatencyRecord[]) => Promise<void>;
  /** Custom callback for each recorded operation */
  onRecord?: (record: LatencyRecord) => void;
  /** Enable console logging (default: false in production) */
  debug?: boolean;
  /** Unique identifier for this client (for multi-minion scenarios) */
  clientId?: string;
}

export interface LatencyContextValue {
  /** Record a latency measurement */
  record: (record: Omit<LatencyRecord, "timestamp">) => void;
  /** Get current metrics snapshot */
  getMetrics: () => LatencyMetrics;
  /** Get all buffered records */
  getRecords: () => LatencyRecord[];
  /** Manually flush records to reporter */
  flush: () => Promise<void>;
  /** Reset all metrics */
  reset: () => void;
  /** Whether tracking is enabled */
  enabled: boolean;
}
