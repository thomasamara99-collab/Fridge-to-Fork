import StepLayout from "../../../components/onboarding/StepLayout";

export default function Step5Page() {
  return (
    <StepLayout
      step={5}
      total={6}
      title="Training schedule"
      subtitle="Training day selection is queued next."
      ctaLabel="Continue"
      onBack="/onboarding/step-4"
      onSubmit={(event) => event.preventDefault()}
      disabled
    >
      <div className="rounded-card border border-border bg-surface p-6 text-sm text-text-secondary">
        Step 5 UI will be implemented in the next sprint.
      </div>
    </StepLayout>
  );
}
