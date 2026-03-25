"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useOnboardingStore } from "../../../store/onboardingStore";

export default function OnboardingCompletePage() {
  const { name, targetCalories, targetProtein, targetCarbs, targetFat, reset } =
    useOnboardingStore();

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 pb-24 pt-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-light text-3xl">
        ✓
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-text-primary">
          You&apos;re all set{name ? `, ${name}` : ""}.
        </h1>
        <p className="text-sm text-text-secondary">
          Daily target: {targetCalories ?? 0} kcal · {targetProtein ?? 0}g
          protein · {targetCarbs ?? 0}g carbs · {targetFat ?? 0}g fat
        </p>
      </div>
      <Link
        href="/swipe"
        className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white"
      >
        Start swiping →
      </Link>
    </main>
  );
}
