type ProgressBarProps = {
  label: string;
  value: number;
  target: number;
  color: string;
  unit: string;
};

export default function ProgressBar({
  label,
  value,
  target,
  color,
  unit,
}: ProgressBarProps) {
  const pct = target > 0 ? Math.min(value / target, 1) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="text-text-secondary">
          {value}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2">
        <div
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
