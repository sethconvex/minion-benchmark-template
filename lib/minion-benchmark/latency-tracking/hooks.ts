/**
 * Latency-Tracked Convex Hooks
 *
 * Drop-in replacements for Convex React hooks that automatically
 * track latency and report to the LatencyProvider.
 */

import { useCallback, useRef, useEffect } from "react";
import {
  useMutation as useConvexMutation,
  useAction as useConvexAction,
  useQuery as useConvexQuery,
  type ReactMutation,
  type ReactAction,
} from "convex/react";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";
import { useLatencyContext } from "./LatencyContext";

/**
 * Extract function name from a FunctionReference for logging.
 * Falls back to a generic name if extraction fails.
 */
function getFunctionName(fn: FunctionReference<any, any, any>): string {
  // FunctionReference has a hidden property for the name
  // We'll try to extract it, fallback to toString
  try {
    const str = String(fn);
    // Convex function refs often stringify to something like "api.messages.sendMessage"
    if (str.includes(".")) {
      return str;
    }
    // Try to access internal property
    if ((fn as any)._name) {
      return (fn as any)._name;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Tracked version of useMutation.
 * Automatically records latency for each mutation call.
 *
 * @example
 * ```tsx
 * const sendMessage = useTrackedMutation(api.messages.sendMessage);
 * // Latency is automatically tracked when you call:
 * await sendMessage({ channelId, content });
 * ```
 */
export function useTrackedMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
): ReactMutation<Mutation> {
  const baseMutation = useConvexMutation(mutation);
  const latencyCtx = useLatencyContext();
  const functionName = getFunctionName(mutation);

  return useCallback(
    async (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
      const startTime = performance.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await baseMutation(args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const latencyMs = Math.round(performance.now() - startTime);

        // Record to context if available (optional tracking)
        latencyCtx?.record({
          type: "mutation",
          functionName,
          latencyMs,
          success,
          error,
        });
      }
    },
    [baseMutation, latencyCtx, functionName]
  ) as ReactMutation<Mutation>;
}

/**
 * Tracked version of useAction.
 * Automatically records latency for each action call.
 *
 * @example
 * ```tsx
 * const generateImage = useTrackedAction(api.images.generate);
 * // Latency is automatically tracked when you call:
 * await generateImage({ prompt });
 * ```
 */
export function useTrackedAction<Action extends FunctionReference<"action">>(
  action: Action
): ReactAction<Action> {
  const baseAction = useConvexAction(action);
  const latencyCtx = useLatencyContext();
  const functionName = getFunctionName(action);

  return useCallback(
    async (args: FunctionArgs<Action>): Promise<FunctionReturnType<Action>> => {
      const startTime = performance.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await baseAction(args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const latencyMs = Math.round(performance.now() - startTime);

        latencyCtx?.record({
          type: "action",
          functionName,
          latencyMs,
          success,
          error,
        });
      }
    },
    [baseAction, latencyCtx, functionName]
  ) as ReactAction<Action>;
}

/**
 * Tracked version of useQuery.
 * Records latency for initial query result (time to first data).
 *
 * Note: Queries are subscriptions, so we track time-to-first-result,
 * not each update. Subsequent updates from the subscription are not tracked.
 *
 * @example
 * ```tsx
 * const messages = useTrackedQuery(api.messages.list, { channelId });
 * // Time to first result is automatically tracked
 * ```
 */
export function useTrackedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query> | "skip"
): FunctionReturnType<Query> | undefined {
  const result = useConvexQuery(query, args);
  const latencyCtx = useLatencyContext();
  const functionName = getFunctionName(query);

  // Track time to first result
  const startTimeRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const argsKeyRef = useRef<string>("");

  // Reset tracking when args change
  const argsKey = args === "skip" ? "skip" : JSON.stringify(args);
  if (argsKey !== argsKeyRef.current) {
    argsKeyRef.current = argsKey;
    hasRecordedRef.current = false;
    startTimeRef.current = args === "skip" ? null : performance.now();
  }

  // Record when we get first result
  useEffect(() => {
    if (
      result !== undefined &&
      !hasRecordedRef.current &&
      startTimeRef.current !== null
    ) {
      hasRecordedRef.current = true;
      const latencyMs = Math.round(performance.now() - startTimeRef.current);

      latencyCtx?.record({
        type: "query",
        functionName,
        latencyMs,
        success: true,
      });
    }
  }, [result, latencyCtx, functionName]);

  return result;
}

/**
 * Hook to manually record a latency measurement.
 * Useful for tracking custom operations or external API calls.
 *
 * @example
 * ```tsx
 * const recordLatency = useRecordLatency();
 *
 * const fetchData = async () => {
 *   const start = performance.now();
 *   try {
 *     const result = await externalApi.fetch();
 *     recordLatency("action", "externalApi.fetch", performance.now() - start, true);
 *     return result;
 *   } catch (err) {
 *     recordLatency("action", "externalApi.fetch", performance.now() - start, false, err.message);
 *     throw err;
 *   }
 * };
 * ```
 */
export function useRecordLatency() {
  const latencyCtx = useLatencyContext();

  return useCallback(
    (
      type: "query" | "mutation" | "action",
      functionName: string,
      latencyMs: number,
      success: boolean,
      error?: string
    ) => {
      latencyCtx?.record({
        type,
        functionName,
        latencyMs,
        success,
        error,
      });
    },
    [latencyCtx]
  );
}
