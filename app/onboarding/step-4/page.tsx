"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StepLayout from "../../../components/onboarding/StepLayout";
import { useOnboardingStore } from "../../../store/onboardingStore";

export const dynamic = "force-dynamic";

const dietaryOptions = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "pescatarian", label: "Pescatarian" },
  { key: "gluten-free", label: "Gluten-free" },
  { key: "dairy-free", label: "Dairy-free" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Kosher" },
  { key: "nut-free", label: "Nut-free" },
] as const;

export default function Step4Page() {
  const router = useRouter();
  const {
    dietaryFilters,
    dislikedIngredients,
    cookingSkill,
    setStep4,
  } = useOnboardingStore();

  const [selectedFilters, setSelectedFilters] = useState([...dietaryFilters]);
  const [dislikesInput, setDislikesInput] = useState(
    dislikedIngredients.join(", "),
  );
  const [skill, setSkill] = useState(cookingSkill);

  const hasRestrictions = selectedFilters.length > 0;

  const toggleFilter = (key: (typeof dietaryOptions)[number]["key"]) => {
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const parsedDislikes = useMemo(
    () =>
      dislikesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [dislikesInput],
  );

  const submit = () => {
    setStep4({
      dietaryFilters: selectedFilters,
      dislikedIngredients: parsedDislikes,
      cookingSkill: skill,
      budget: "medium",
    });
    router.push("/onboarding/step-5");
  };

  return (
    <StepLayout
      step={4}
      total={6}
      title="Dietary preferences"
      subtitle="Pick what you avoid so we only show meals that fit."
      ctaLabel="Continue"
      onBack="/onboarding/step-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Dietary filters
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedFilters([])}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                !hasRestrictions
                  ? "border-accent bg-accent-light text-accent-text"
                  : "border-border bg-surface text-text-secondary"
              }`}
            >
              No restrictions
            </button>
            {dietaryOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleFilter(option.key)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  selectedFilters.includes(option.key)
                    ? "border-accent bg-accent-light text-accent-text"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-text-tertiary">
            Ingredients you hate (optional)
          </span>
          <input
            value={dislikesInput}
            onChange={(event) => setDislikesInput(event.target.value)}
            placeholder="Mushrooms, olives, anchovies"
            className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
          {parsedDislikes.length ? (
            <p className="mt-2 text-xs text-text-tertiary">
              We&apos;ll avoid: {parsedDislikes.join(", ")}
            </p>
          ) : null}
        </label>

        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Cooking skill
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 rounded-md bg-surface-2 p-1">
            {([
              { value: "beginner", label: "New" },
              { value: "intermediate", label: "Confident" },
              { value: "advanced", label: "Advanced" },
            ] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSkill(item.value)}
                className={`rounded-md px-2 py-2 text-[11px] font-semibold ${
                  skill === item.value
                    ? "bg-white text-text-primary shadow"
                    : "text-text-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-tertiary">
            Confident means you can follow recipes and cook a few staples without
            stress.
          </p>
        </div>
      </div>
    </StepLayout>
  );
}
