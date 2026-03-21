type TagChipProps = {
  label: string;
  tone?: "default" | "accent" | "green";
};

export default function TagChip({ label, tone = "default" }: TagChipProps) {
  const toneClasses =
    tone === "accent"
      ? "bg-accent-light text-accent-text border-accent/20"
      : tone === "green"
        ? "bg-green-light text-green-text border-green/20"
        : "bg-surface-2 text-text-secondary border-border";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wide ${toneClasses}`}
    >
      {label}
    </span>
  );
}
