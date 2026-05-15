"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useOnboardingStore } from "../../../store/onboardingStore";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const {
    name,
    age,
    sex,
    weightKg,
    heightCm,
    goal,
    goalPreset,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    calculatedTdee,
    dietaryFilters,
    dislikedIngredients,
    cuisinePrefs,
    cookingSkill,
    budget,
    reset,
  } = useOnboardingStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = useCallback(async () => {
    if (
      !name ||
      age == null ||
      !sex ||
      weightKg == null ||
      heightCm == null ||
      targetCalories == null ||
      targetProtein == null ||
      targetCarbs == null ||
      targetFat == null
    ) {
      setError("Please complete the onboarding steps first.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const profilePayload = {
      weightKg,
      heightCm,
      age,
      sex,
      goal: goal || goalPreset || "custom",
      activityLevel: "moderate",
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      calculatedTdee: calculatedTdee ?? targetCalories,
      dietaryFilters: JSON.stringify(dietaryFilters),
      dislikedIngredients: JSON.stringify(dislikedIngredients),
      cuisinePrefs: JSON.stringify(cuisinePrefs),
      cookingSkill,
      budget,
      trainingDays: JSON.stringify([]), // Empty array for now, can be set later
    };

    try {
      const profileResponse = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      if (!profileResponse.ok) {
        throw new Error("Unable to save profile.");
      }

      // Automatically sync meal database in the background
      fetch("/api/meals/sync", { method: "POST" }).catch(() => {
        // Silently fail - meal sync will happen on next feed fetch anyway
      });

      reset();
      router.replace("/swipe");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    name,
    age,
    sex,
    weightKg,
    heightCm,
    goal,
    goalPreset,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    calculatedTdee,
    dietaryFilters,
    dislikedIngredients,
    cuisinePrefs,
    cookingSkill,
    budget,
    reset,
    router,
  ]);

  useEffect(() => {
    saveProfile();
  }, [saveProfile]);

  if (isSaving) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 pb-24 pt-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light text-2xl">
          ...
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-text-primary">
            Setting up your profile
          </h1>
          <p className="text-sm text-text-secondary">
            This will only take a moment...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 pb-24 pt-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-light text-2xl">
          ×
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-text-primary">
            Something went wrong
          </h1>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
        <Link
          href="/onboarding/step-1"
          className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white"
        >
          Start over
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 pb-24 pt-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-light text-2xl">
        ✓
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-text-primary">
          You&apos;re all set{name ? `, ${name}` : ""}.
        </h1>
        <p className="text-sm text-text-secondary">
          Daily target: {targetCalories ?? 0} kcal - {targetProtein ?? 0}g
          protein - {targetCarbs ?? 0}g carbs - {targetFat ?? 0}g fat
        </p>
        <p className="mt-4 text-sm text-text-secondary">
          Setup your training schedule and fridge items later for even better meal recommendations.
        </p>
      </div>
      <Link
        href="/swipe"
        className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white"
      >
        Start swiping -&gt;
      </Link>
    </main>
  );
}
