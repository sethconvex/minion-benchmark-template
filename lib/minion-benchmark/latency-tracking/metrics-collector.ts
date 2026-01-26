/**
 * Latency Metrics Collector
 *
 * Collects latency records and computes aggregate metrics.
 */

import type {
  LatencyRecord,
  LatencyMetrics,
  TypeMetrics,
  ConvexOperationType,
} from "./types";

export class LatencyMetricsCollector {
  private records: LatencyRecord[] = [];
  private startTime: number = Date.now();

  /**
   * Add a latency record.
   */
  record(rec: LatencyRecord): void {
    this.records.push(rec);
  }

  /**
   * Get all buffered records.
   */
  getRecords(): LatencyRecord[] {
    return [...this.records];
  }

  /**
   * Clear buffered records (after flush).
   */
  clearRecords(): void {
    this.records = [];
  }

  /**
   * Get the current count of records.
   */
  getCount(): number {
    return this.records.length;
  }

  /**
   * Reset all state.
   */
  reset(): void {
    this.records = [];
    this.startTime = Date.now();
  }

  /**
   * Compute aggregate metrics from all records.
   */
  getMetrics(): LatencyMetrics {
    const now = Date.now();
    const windowSeconds = Math.max(1, (now - this.startTime) / 1000);

    // Separate by success/failure
    const successful = this.records.filter((r) => r.success);
    const failed = this.records.filter((r) => !r.success);

    // All latencies (successful only for percentiles)
    const latencies = successful.map((r) => r.latencyMs).sort((a, b) => a - b);

    // Compute percentiles
    const percentile = (arr: number[], p: number): number => {
      if (arr.length === 0) return 0;
      const idx = Math.ceil(arr.length * p) - 1;
      return arr[Math.max(0, Math.min(idx, arr.length - 1))];
    };

    const mean = (arr: number[]): number => {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, v) => sum + v, 0) / arr.length;
    };

    // Compute per-type metrics
    const computeTypeMetrics = (type: ConvexOperationType): TypeMetrics => {
      const typeRecords = this.records.filter((r) => r.type === type);
      const typeSuccess = typeRecords.filter((r) => r.success);
      const typeLatencies = typeSuccess
        .map((r) => r.latencyMs)
        .sort((a, b) => a - b);

      return {
        count: typeRecords.length,
        successCount: typeSuccess.length,
        errorCount: typeRecords.length - typeSuccess.length,
        latencyMean: mean(typeLatencies),
        latencyP95: percentile(typeLatencies, 0.95),
      };
    };

    return {
      totalCount: this.records.length,
      successCount: successful.length,
      errorCount: failed.length,
      latencyP50: percentile(latencies, 0.5),
      latencyP95: percentile(latencies, 0.95),
      latencyP99: percentile(latencies, 0.99),
      latencyMin: latencies.length > 0 ? latencies[0] : 0,
      latencyMax: latencies.length > 0 ? latencies[latencies.length - 1] : 0,
      latencyMean: mean(latencies),
      opsPerSecond: this.records.length / windowSeconds,
      byType: {
        query: computeTypeMetrics("query"),
        mutation: computeTypeMetrics("mutation"),
        action: computeTypeMetrics("action"),
      },
    };
  }
}
