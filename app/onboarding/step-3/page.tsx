"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StepLayout from "../../../components/onboarding/StepLayout";
import MacroTargetEditor from "../../../components/onboarding/MacroTargetEditor";
import { calculateTDEE, suggestMacros } from "../../../lib/nutrition";
import { useOnboardingStore } from "../../../store/onboardingStore";

type MacroPreset = "high" | "balanced" | "low" | "custom";

export default function Step3Page() {
  const router = useRouter();
  const {
    age,
    sex,
    weightKg,
    heightCm,
    goalPreset,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    useSuggested,
    calculatedTdee,
    setTargets,
  } = useOnboardingStore();

  const hasStats = age && sex && weightKg && heightCm && goalPreset;
  const tdee = useMemo(() => {
    if (!age || !sex || !weightKg || !heightCm || !goalPreset) return 0;
    return calculateTDEE({
      weightKg,
      heightCm,
      age,
      sex,
      activityLevel: "moderate",
    });
  }, [age, sex, weightKg, heightCm, goalPreset]);

  const suggested = useMemo(() => {
    if (!age || !sex || !weightKg || !heightCm || !goalPreset) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return suggestMacros(tdee, goalPreset, weightKg);
  }, [age, sex, weightKg, heightCm, goalPreset, tdee]);

  const [customMode, setCustomMode] = useState(!useSuggested);
  const [calories, setCalories] = useState(
    targetCalories ?? suggested.calories,
  );
  const [protein, setProtein] = useState(
    targetProtein ?? suggested.protein,
  );
  const [carbs, setCarbs] = useState(targetCarbs ?? suggested.carbs);
  const [fat, setFat] = useState(targetFat ?? suggested.fat);
  const [preset, setPreset] = useState<MacroPreset>("custom");

  const helperText = !hasStats
    ? "Complete step 1 to see suggestions."
    : goalPreset === "cut"
      ? "This is a 400 kcal deficit to help you lose ~0.5kg/week."
      : goalPreset === "bulk"
        ? "This is a 300 kcal surplus to support muscle growth."
        : "This keeps you steady with balanced energy.";

  const applyPreset = (type: MacroPreset, baseCalories = calories) => {
    setPreset(type);
    if (type === "custom") return;
    const splits =
      type === "high"
        ? { p: 0.4, c: 0.35, f: 0.25 }
        : type === "balanced"
          ? { p: 0.3, c: 0.4, f: 0.3 }
          : { p: 0.35, c: 0.25, f: 0.4 };
    const nextProtein = Math.round((baseCalories * splits.p) / 4);
    const nextCarbs = Math.round((baseCalories * splits.c) / 4);
    const nextFat = Math.round((baseCalories * splits.f) / 9);
    setProtein(nextProtein);
    setCarbs(nextCarbs);
    setFat(nextFat);
  };

  const submit = () => {
    const finalCalories = customMode ? calories : suggested.calories;
    const finalProtein = customMode ? protein : suggested.protein;
    const finalCarbs = customMode ? carbs : suggested.carbs;
    const finalFat = customMode ? fat : suggested.fat;
    const goalFinal =
      Math.abs(finalCalories - suggested.calories) > 100
        ? "custom"
        : goalPreset;

    setTargets({
      useSuggested: !customMode,
      targetCalories: finalCalories,
      targetProtein: finalProtein,
      targetCarbs: finalCarbs,
      targetFat: finalFat,
      calculatedTdee: calculatedTdee ?? tdee,
      goal: goalFinal,
    });

    router.push("/onboarding/step-4");
  };

  return (
    <StepLayout
      step={3}
      total={6}
      title="Calorie targets"
      subtitle="Tune your calorie and macro goals for today."
      ctaLabel="Continue"
      onBack="/onboarding/step-2"
      disabled={!hasStats}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="space-y-5">
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Based on your stats, we suggest
          </p>
          <div className="mt-4 rounded-md border border-border bg-surface-2 p-4">
            <p className="font-display text-2xl text-text-primary">
              {suggested.calories.toLocaleString()} kcal / day
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-text-secondary">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                  Protein
                </p>
                <p className="font-display text-lg text-text-primary">
                  {suggested.protein}g
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                  Carbs
                </p>
                <p className="font-display text-lg text-text-primary">
                  {suggested.carbs}g
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                  Fat
                </p>
                <p className="font-display text-lg text-text-primary">
                  {suggested.fat}g
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-secondary">{helperText}</p>
        </div>

        <div className="flex items-center justify-between rounded-full border border-border bg-surface px-3 py-2 text-sm">
          <span className={!customMode ? "text-text-primary" : "text-text-tertiary"}>
            Use suggested
          </span>
          <button
            type="button"
            onClick={() => setCustomMode((prev) => !prev)}
            className={`relative h-7 w-14 rounded-full transition ${
              customMode ? "bg-accent" : "bg-surface-2"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                customMode ? "left-8" : "left-1"
              }`}
            />
          </button>
          <span className={customMode ? "text-text-primary" : "text-text-tertiary"}>
            Customise
          </span>
        </div>

        {customMode ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset("high")}
                className={`rounded-full border px-3 py-1 text-xs ${
                  preset === "high"
                    ? "border-accent bg-accent-light text-accent-text"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                High protein
              </button>
              <button
                type="button"
                onClick={() => applyPreset("balanced")}
                className={`rounded-full border px-3 py-1 text-xs ${
                  preset === "balanced"
                    ? "border-accent bg-accent-light text-accent-text"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => applyPreset("low")}
                className={`rounded-full border px-3 py-1 text-xs ${
                  preset === "low"
                    ? "border-accent bg-accent-light text-accent-text"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                Low carb
              </button>
              <button
                type="button"
                onClick={() => applyPreset("custom")}
                className={`rounded-full border px-3 py-1 text-xs ${
                  preset === "custom"
                    ? "border-accent bg-accent-light text-accent-text"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                Custom
              </button>
            </div>

            <MacroTargetEditor
              targetCalories={calories}
              protein={protein}
              carbs={carbs}
              fat={fat}
              onCaloriesChange={(value) => {
                setCalories(value);
                if (preset !== "custom") applyPreset(preset, value);
              }}
              onProteinChange={setProtein}
              onCarbsChange={setCarbs}
              onFatChange={setFat}
            />
          </div>
        ) : null}
      </div>
    </StepLayout>
  );
}
