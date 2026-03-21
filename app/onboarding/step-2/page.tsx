"use client";

import { useRouter } from "next/navigation";

import GoalCard from "../../../components/onboarding/GoalCard";
import StepLayout from "../../../components/onboarding/StepLayout";
import { useOnboardingStore } from "../../../store/onboardingStore";

const goals = [
  {
    key: "cut",
    title: "Lose fat",
    description: "Lean down while keeping muscle.",
  },
  {
    key: "maintain",
    title: "Maintain weight",
    description: "Stay steady with balanced energy.",
  },
  {
    key: "bulk",
    title: "Build muscle",
    description: "Fuel workouts and grow stronger.",
  },
] as const;

export default function Step2Page() {
  const router = useRouter();
  const { goalPreset, setGoalPreset } = useOnboardingStore();

  return (
    <StepLayout
      step={2}
      total={6}
      title="Your goal"
      subtitle="Pick the direction that matches what you want right now."
      ctaLabel="Continue"
      onBack="/onboarding/step-1"
      disabled={!goalPreset}
      onSubmit={(event) => {
        event.preventDefault();
        if (!goalPreset) return;
        router.push("/onboarding/step-3");
      }}
    >
      <div className="space-y-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.key}
            title={goal.title}
            description={goal.description}
            selected={goalPreset === goal.key}
            onClick={() => setGoalPreset(goal.key)}
          />
        ))}
      </div>
    </StepLayout>
  );
}
