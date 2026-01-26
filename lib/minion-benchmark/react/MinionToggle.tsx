export interface MinionToggleProps {
  /** Whether minion mode is enabled */
  enabled: boolean;
  /** Callback when toggle is changed */
  onChange: (enabled: boolean) => void;
  /** Optional label text */
  label?: string;
  /** Optional custom class name */
  className?: string;
}

/**
 * MinionToggle - A toggle switch for enabling/disabling minion mode
 */
export function MinionToggle({
  enabled,
  onChange,
  label = "Minion Mode",
  className = "",
}: MinionToggleProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        className="rounded"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
