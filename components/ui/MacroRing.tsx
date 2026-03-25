"use client";

type MacroRingProps = {
  label: string;
  value: number;
  target: number;
  color: string;
  unit: string;
  size?: number;
  stroke?: number;
};

export default function MacroRing({
  label,
  value,
  target,
  color,
  unit,
  size = 88,
  stroke = 8,
}: MacroRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(value / target, 1) : 0;
  const dash = circumference * progress;
  const remaining = Math.max(0, target - value);
  const valueClass = size >= 120 ? "text-3xl" : "text-xl";
  const unitClass = size >= 120 ? "text-xs" : "text-[10px]";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display ${valueClass} text-text-primary`}>
            {remaining}
          </span>
          <span
            className={`${unitClass} uppercase tracking-wide text-text-tertiary`}
          >
            {unit}
          </span>
        </div>
      </div>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
