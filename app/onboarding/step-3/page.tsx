"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import StepLayout from "../../../components/onboarding/StepLayout";
import MacroTargetEditor from "../../../components/onboarding/MacroTargetEditor";
import { calculateTDEE, suggestMacros } from "../../../lib/nutrition";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { useProfile } from "../../../hooks/useProfile";

type MacroPreset = "high" | "balanced" | "low" | "custom";

export default function Step3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const { data: profile } = useProfile({ enabled: editMode });
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

  const profileGoalPreset: GoalPreset =
    profile?.goal === "custom"
      ? "maintain"
      : (profile?.goal as GoalPreset | undefined) ?? "";

  const baseAge = editMode ? profile?.age ?? age : age;
  const baseSex = editMode ? profile?.sex ?? sex : sex;
  const baseWeight = editMode ? profile?.weightKg ?? weightKg : weightKg;
  const baseHeight = editMode ? profile?.heightCm ?? heightCm : heightCm;
  const baseGoalPreset = editMode ? profileGoalPreset : goalPreset;

  const hasStats = editMode
    ? Boolean(profile)
    : Boolean(baseAge && baseSex && baseWeight && baseHeight && baseGoalPreset);
  const tdee = useMemo(() => {
    if (!baseAge || !baseSex || !baseWeight || !baseHeight || !baseGoalPreset) {
      return 0;
    }
    return calculateTDEE({
      weightKg: baseWeight,
      heightCm: baseHeight,
      age: baseAge,
      sex: baseSex,
      activityLevel: "moderate",
    });
  }, [baseAge, baseSex, baseWeight, baseHeight, baseGoalPreset]);

  const suggested = useMemo(() => {
    if (!baseAge || !baseSex || !baseWeight || !baseHeight || !baseGoalPreset) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return suggestMacros(tdee, baseGoalPreset, baseWeight);
  }, [baseAge, baseSex, baseWeight, baseHeight, baseGoalPreset, tdee]);

  const [customMode, setCustomMode] = useState(editMode ? true : !useSuggested);
  const [calories, setCalories] = useState(
    (editMode ? profile?.targetCalories : targetCalories) ?? suggested.calories,
  );
  const [protein, setProtein] = useState(
    (editMode ? profile?.targetProtein : targetProtein) ?? suggested.protein,
  );
  const [carbs, setCarbs] = useState(
    (editMode ? profile?.targetCarbs : targetCarbs) ?? suggested.carbs,
  );
  const [fat, setFat] = useState(
    (editMode ? profile?.targetFat : targetFat) ?? suggested.fat,
  );
  const [preset, setPreset] = useState<MacroPreset>("custom");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editMode || !profile) return;
    setCalories(profile.targetCalories);
    setProtein(profile.targetProtein);
    setCarbs(profile.targetCarbs);
    setFat(profile.targetFat);
    setCustomMode(true);
  }, [editMode, profile]);

  const helperText = !hasStats
    ? "Complete step 1 to see suggestions."
    : baseGoalPreset === "cut"
      ? "This is a 400 kcal deficit to help you lose ~0.5kg/week."
      : baseGoalPreset === "bulk"
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

  const submit = async () => {
    const finalCalories = customMode ? calories : suggested.calories;
    const finalProtein = customMode ? protein : suggested.protein;
    const finalCarbs = customMode ? carbs : suggested.carbs;
    const finalFat = customMode ? fat : suggested.fat;
    const goalFinal =
      Math.abs(finalCalories - suggested.calories) > 100
        ? "custom"
        : baseGoalPreset;

    if (editMode) {
      setSubmitting(true);
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetCalories: finalCalories,
            targetProtein: finalProtein,
            targetCarbs: finalCarbs,
            targetFat: finalFat,
            calculatedTdee: calculatedTdee ?? tdee,
            goal: goalFinal,
          }),
        });
        router.push("/profile");
      } finally {
        setSubmitting(false);
      }
      return;
    }

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
      step={editMode ? 1 : 3}
      total={editMode ? 1 : 6}
      title={editMode ? "Update targets" : "Calorie targets"}
      subtitle={
        editMode
          ? "Update your calorie and macro targets without redoing onboarding."
          : "Tune your calorie and macro goals for today."
      }
      ctaLabel={submitting ? "Saving..." : editMode ? "Save changes" : "Continue"}
      onBack={editMode ? "/profile" : "/onboarding/step-2"}
      disabled={!hasStats || submitting}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
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
