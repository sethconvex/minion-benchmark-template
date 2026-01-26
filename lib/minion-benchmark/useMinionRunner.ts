import { useState, useRef, useCallback } from "react";
import type { MinionBehavior, BaseMinionContext } from "./types";

/**
 * Context factory function type.
 * Apps provide this to create their context with app-specific methods.
 */
export type CreateContext<TContext extends BaseMinionContext> = (
  log: (message: string) => void,
  shouldStop: () => boolean,
  seed: number
) => TContext;

/**
 * Return type from useMinionRunner hook
 */
export interface MinionRunner {
  /** Whether a behavior is currently running */
  isRunning: boolean;
  /** Log messages from the behavior */
  logs: string[];
  /** Currently selected behavior key */
  selectedBehavior: string;
  /** Select a behavior by key */
  selectBehavior: (key: string) => void;
  /** Start the selected behavior */
  start: (seed?: number) => void;
  /** Stop the running behavior */
  stop: () => void;
  /** Clear the logs */
  clearLogs: () => void;
  /** Manually add a log message */
  log: (message: string) => void;
}

/**
 * React hook for running minion behaviors.
 *
 * @param behaviors - Record of behavior key -> behavior definition
 * @param createContext - Factory function to create app-specific context
 * @returns MinionRunner controls
 *
 * @example
 * ```tsx
 * const minion = useMinionRunner(behaviors, (log, shouldStop, seed) => ({
 *   random: new SeededRandom(seed),
 *   sleep: (ms) => new Promise(r => setTimeout(r, ms)),
 *   shouldStop,
 *   log,
 *   // App-specific methods:
 *   createPost: (content) => createPostMutation({ content }),
 * }));
 * ```
 */
export function useMinionRunner<TContext extends BaseMinionContext>(
  behaviors: Record<string, MinionBehavior<TContext>>,
  createContext: CreateContext<TContext>
): MinionRunner {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedBehavior, setSelectedBehavior] = useState(
    Object.keys(behaviors)[0] ?? ""
  );
  const stopRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-200), `[${ts}] ${msg}`]);
  }, []);

  const start = useCallback(
    async (seed?: number) => {
      const behavior = behaviors[selectedBehavior];
      if (!behavior || isRunning) return;

      setIsRunning(true);
      stopRef.current = false;
      setLogs([]);
      addLog(`Starting ${behavior.name}...`);

      const ctx = createContext(
        addLog,
        () => stopRef.current,
        seed ?? Date.now()
      );

      try {
        await behavior.init(ctx);
        if (!stopRef.current) {
          await behavior.run(ctx);
        }
      } catch (err) {
        addLog(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsRunning(false);
        addLog("Stopped");
      }
    },
    [behaviors, selectedBehavior, createContext, isRunning, addLog]
  );

  const stop = useCallback(() => {
    stopRef.current = true;
    addLog("Stop requested...");
  }, [addLog]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    isRunning,
    logs,
    selectedBehavior,
    selectBehavior: setSelectedBehavior,
    start,
    stop,
    clearLogs,
    log: addLog,
  };
}
