"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import StepLayout from "../../../components/onboarding/StepLayout";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { useProfile } from "../../../hooks/useProfile";

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
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const { data: profile } = useProfile({ enabled: setupMode });
  const { trainingDays, setStep5 } = useOnboardingStore();
  
  // Get initial training days from profile if in setup mode
  const initialDays = setupMode && profile?.trainingDays 
    ? (() => {
        try {
          return JSON.parse(profile.trainingDays) as number[];
        } catch {
          return [];
        }
      })()
    : trainingDays;
    
  const [selected, setSelected] = useState<number[]>(initialDays);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (value: number) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((day) => day !== value) : [...prev, value],
    );
  };

  const submit = async () => {
    if (setupMode) {
      // Save directly to profile in setup mode
      setIsSaving(true);
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trainingDays: JSON.stringify(selected.sort()) }),
        });
        router.push("/swipe");
      } catch {
        // Handle error
      } finally {
        setIsSaving(false);
      }
    } else {
      // Original onboarding flow
      setStep5(selected.sort());
      router.push("/onboarding/step-6");
    }
  };

  return (
    <StepLayout
      step={setupMode ? 1 : 5}
      total={setupMode ? 1 : 6}
      title="Training schedule"
      subtitle="Tap the days you usually train so we can time meals better."
      ctaLabel={isSaving ? "Saving..." : setupMode ? "Save" : "Continue"}
      onBack={setupMode ? "/swipe" : "/onboarding/step-4"}
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
