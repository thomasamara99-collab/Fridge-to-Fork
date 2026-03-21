type GoalCardProps = {
  title: string;
  description: string;
  selected?: boolean;
  onClick: () => void;
};

export default function GoalCard({
  title,
  description,
  selected,
  onClick,
}: GoalCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-card border px-5 py-4 text-left transition ${
        selected
          ? "border-accent bg-accent-light"
          : "border-border bg-surface"
      }`}
    >
      <h3 className="font-display text-xl text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </button>
  );
}
