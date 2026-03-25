"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import StepLayout from "../../../components/onboarding/StepLayout";
import { useOnboardingStore } from "../../../store/onboardingStore";

export const dynamic = "force-dynamic";

const days = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export default function Step5Page() {
  const router = useRouter();
  const { trainingDays, setStep5 } = useOnboardingStore();
  const [selected, setSelected] = useState<number[]>(trainingDays);

  const toggleDay = (value: number) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((day) => day !== value) : [...prev, value],
    );
  };

  const submit = () => {
    setStep5(selected.sort());
    router.push("/onboarding/step-6");
  };

  return (
    <StepLayout
      step={5}
      total={6}
      title="Training schedule"
      subtitle="Tap the days you usually train so we can time meals better."
      ctaLabel="Continue"
      onBack="/onboarding/step-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="space-y-5">
        <div className="flex justify-between rounded-card border border-border bg-surface p-4">
          {days.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${
                selected.includes(day.value)
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-text-secondary"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-text-secondary">
          We&apos;ll prioritize pre-workout and higher-protein meals on training
          days.
        </p>
      </div>
    </StepLayout>
  );
}
