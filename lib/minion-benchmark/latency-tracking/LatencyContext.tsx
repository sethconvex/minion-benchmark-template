/**
 * Latency Tracking Context
 *
 * React context for automatic latency tracking of Convex operations.
 */

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type {
  LatencyContextValue,
  LatencyRecord,
  LatencyReporterConfig,
} from "./types";
import { LatencyMetricsCollector } from "./metrics-collector";

const LatencyContext = createContext<LatencyContextValue | null>(null);

export interface LatencyProviderProps extends LatencyReporterConfig {
  children: ReactNode;
  /** Disable tracking entirely (default: false) */
  disabled?: boolean;
}

/**
 * Provider for latency tracking.
 * Wrap your ConvexProvider with this to enable automatic latency tracking.
 *
 * @example
 * ```tsx
 * <LatencyProvider
 *   reportUrl="http://worker:3001/metrics"
 *   flushIntervalMs={5000}
 *   debug={true}
 * >
 *   <ConvexProvider client={convex}>
 *     <App />
 *   </ConvexProvider>
 * </LatencyProvider>
 * ```
 */
export function LatencyProvider({
  children,
  disabled = false,
  reportUrl,
  flushIntervalMs = 5000,
  maxBufferSize = 100,
  onFlush,
  onRecord,
  debug = false,
  clientId,
}: LatencyProviderProps) {
  const collectorRef = useRef(new LatencyMetricsCollector());
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Flush function
  const flush = useCallback(async () => {
    const records = collectorRef.current.getRecords();
    if (records.length === 0) return;

    if (debug) {
      console.log(
        `[LatencyTracker] Flushing ${records.length} records`,
        clientId ? `(client: ${clientId})` : ""
      );
    }

    // Clear before async to avoid double-flush
    collectorRef.current.clearRecords();

    // Custom callback
    if (onFlush) {
      try {
        await onFlush(records);
      } catch (err) {
        console.error("[LatencyTracker] onFlush error:", err);
      }
    }

    // POST to URL if configured
    if (reportUrl) {
      try {
        const payload = {
          clientId,
          timestamp: Date.now(),
          records,
          metrics: collectorRef.current.getMetrics(),
        };

        const response = await fetch(reportUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error(
            `[LatencyTracker] Failed to report metrics: ${response.status}`
          );
        }
      } catch (err) {
        console.error("[LatencyTracker] Report error:", err);
      }
    }
  }, [reportUrl, onFlush, debug, clientId]);

  // Record function
  const record = useCallback(
    (rec: Omit<LatencyRecord, "timestamp">) => {
      if (disabled) return;

      const fullRecord: LatencyRecord = {
        ...rec,
        timestamp: Date.now(),
      };

      collectorRef.current.record(fullRecord);

      if (debug) {
        const icon = rec.success ? "+" : "x";
        console.log(
          `[LatencyTracker] ${icon} ${rec.type}:${rec.functionName} - ${rec.latencyMs}ms`
        );
      }

      // Callback for each record
      onRecord?.(fullRecord);

      // Auto-flush if buffer is full
      if (collectorRef.current.getCount() >= maxBufferSize) {
        void flush();
      }
    },
    [disabled, debug, onRecord, maxBufferSize, flush]
  );

  // Set up periodic flush
  useEffect(() => {
    if (disabled) return;

    flushTimerRef.current = setInterval(() => {
      void flush();
    }, flushIntervalMs);

    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
      // Final flush on unmount
      void flush();
    };
  }, [disabled, flushIntervalMs, flush]);

  const contextValue = useMemo<LatencyContextValue>(
    () => ({
      record,
      getMetrics: () => collectorRef.current.getMetrics(),
      getRecords: () => collectorRef.current.getRecords(),
      flush,
      reset: () => collectorRef.current.reset(),
      enabled: !disabled,
    }),
    [record, flush, disabled]
  );

  return (
    <LatencyContext.Provider value={contextValue}>
      {children}
    </LatencyContext.Provider>
  );
}

/**
 * Hook to access the latency tracking context.
 */
export function useLatencyContext(): LatencyContextValue | null {
  return useContext(LatencyContext);
}

/**
 * Hook to access latency tracking, throws if not in provider.
 */
export function useLatencyTracking(): LatencyContextValue {
  const ctx = useContext(LatencyContext);
  if (!ctx) {
    throw new Error(
      "useLatencyTracking must be used within a LatencyProvider"
    );
  }
  return ctx;
}
