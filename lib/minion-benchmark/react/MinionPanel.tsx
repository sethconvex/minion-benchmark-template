import type { MinionBehavior, BaseMinionContext } from "../types";

export interface MinionPanelProps<TContext extends BaseMinionContext = BaseMinionContext> {
  /** Record of behavior name -> behavior definition */
  behaviors: Record<string, MinionBehavior<TContext>>;
  /** Currently selected behavior name */
  selectedBehavior: string;
  /** Callback when user selects a different behavior */
  onSelectBehavior: (name: string) => void;
  /** Whether a behavior is currently running */
  isRunning: boolean;
  /** Callback to start the selected behavior */
  onStart: () => void;
  /** Callback to stop the running behavior */
  onStop: () => void;
  /** Callback to clear log output */
  onClearLogs: () => void;
  /** Log messages to display */
  logs: string[];
  /** Optional title (default: "Minion Controls") */
  title?: string;
  /** Optional custom class name for the container */
  className?: string;
}

/**
 * MinionPanel - Shared UI component for controlling minion behaviors
 *
 * Provides:
 * - Behavior selector dropdown
 * - Start/Stop buttons
 * - Status indicator
 * - Scrollable log output
 *
 * Styled with Tailwind CSS classes.
 */
export function MinionPanel<TContext extends BaseMinionContext = BaseMinionContext>({
  behaviors,
  selectedBehavior,
  onSelectBehavior,
  isRunning,
  onStart,
  onStop,
  onClearLogs,
  logs,
  title = "Minion Controls",
  className = "",
}: MinionPanelProps<TContext>) {
  const behaviorNames = Object.keys(behaviors);
  const currentBehavior = behaviors[selectedBehavior];

  return (
    <div className={`bg-white rounded-lg shadow p-4 h-full flex flex-col ${className}`}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {/* Behavior selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Behavior
        </label>
        <select
          value={selectedBehavior}
          onChange={(e) => onSelectBehavior((e.target as HTMLSelectElement).value)}
          disabled={isRunning}
          className="w-full border rounded-lg px-3 py-2 disabled:opacity-50"
        >
          {behaviorNames.map((name) => (
            <option key={name} value={name}>
              {behaviors[name].name}
            </option>
          ))}
        </select>
        {currentBehavior?.description && (
          <p className="text-xs text-gray-500 mt-1">{currentBehavior.description}</p>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex gap-2 mb-4">
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => onStart()}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Start
          </button>
        )}
        <button
          onClick={onClearLogs}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Status indicator */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isRunning ? "bg-green-500 animate-pulse" : "bg-gray-300"
          }`}
        />
        <span className="text-sm text-gray-600">
          {isRunning ? "Running..." : "Stopped"}
        </span>
      </div>

      {/* Logs */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-sm font-medium text-gray-700 mb-1">Logs</div>
        <div className="flex-1 min-h-0 bg-gray-900 rounded-lg p-2 overflow-y-auto font-mono text-xs text-green-400">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
