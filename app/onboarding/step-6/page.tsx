"use client";

import StepLayout from "../../../components/onboarding/StepLayout";

export const dynamic = "force-dynamic";

export default function Step6Page() {
  return (
    <StepLayout
      step={6}
      total={6}
      title="Fridge setup"
      subtitle="Add what you currently have on hand."
      ctaLabel="Complete"
      onBack="/onboarding/step-5"
      onSubmit={(event) => event.preventDefault()}
      disabled
    >
      <div className="rounded-card border border-border bg-surface p-6 text-sm text-text-secondary">
        Step 6 UI will be implemented in the next sprint.
      </div>
    </StepLayout>
  );
}
