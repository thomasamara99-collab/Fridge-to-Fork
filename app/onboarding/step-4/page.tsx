import StepLayout from "../../../components/onboarding/StepLayout";

export default function Step4Page() {
  return (
    <StepLayout
      step={4}
      total={6}
      title="Dietary preferences"
      subtitle="Dietary chips and dislikes are coming next."
      ctaLabel="Continue"
      onBack="/onboarding/step-3"
      onSubmit={(event) => event.preventDefault()}
      disabled
    >
      <div className="rounded-card border border-border bg-surface p-6 text-sm text-text-secondary">
        Step 4 UI will be implemented in the next sprint.
      </div>
    </StepLayout>
  );
}
