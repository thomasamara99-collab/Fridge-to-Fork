"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StepLayout from "../../../components/onboarding/StepLayout";
import { useOnboardingStore } from "../../../store/onboardingStore";

export const dynamic = "force-dynamic";

const pantrySections = [
  {
    label: "Proteins",
    category: "protein",
    items: [
      "Chicken breast",
      "Salmon",
      "Eggs",
      "Tuna",
      "Ground beef",
      "Turkey",
      "Tofu",
      "Greek yogurt",
    ],
  },
  {
    label: "Veggies",
    category: "veg",
    items: [
      "Spinach",
      "Broccoli",
      "Bell pepper",
      "Cherry tomatoes",
      "Zucchini",
      "Carrots",
      "Onion",
      "Garlic",
    ],
  },
  {
    label: "Carbs",
    category: "carb",
    items: [
      "Rice",
      "Pasta",
      "Quinoa",
      "Potatoes",
      "Tortillas",
      "Oats",
      "Bread",
      "Sweet potato",
    ],
  },
  {
    label: "Dairy",
    category: "dairy",
    items: [
      "Milk",
      "Cheddar",
      "Parmesan",
      "Butter",
      "Cottage cheese",
      "Feta",
      "Mozzarella",
      "Cream",
    ],
  },
  {
    label: "Pantry",
    category: "pantry",
    items: [
      "Olive oil",
      "Soy sauce",
      "Tomato paste",
      "Canned beans",
      "Chickpeas",
      "Peanut butter",
      "Hot sauce",
      "Honey",
    ],
  },
  {
    label: "Fruits",
    category: "fruit",
    items: [
      "Banana",
      "Apple",
      "Lemon",
      "Lime",
      "Berries",
      "Avocado",
      "Orange",
      "Grapes",
    ],
  },
] as const;

export default function Step6Page() {
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
    trainingDays,
    fridgeItems,
    nextShopDate,
    setStep6,
  } = useOnboardingStore();

  const [selectedItems, setSelectedItems] = useState(fridgeItems);
  const [search, setSearch] = useState("");
  const [customItem, setCustomItem] = useState("");
  const [shopDate, setShopDate] = useState(nextShopDate ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchValue = search.trim().toLowerCase();

  const toggleItem = (nameValue: string, category: string) => {
    setSelectedItems((prev) => {
      const exists = prev.some(
        (item) => item.name.toLowerCase() === nameValue.toLowerCase(),
      );
      if (exists) {
        return prev.filter(
          (item) => item.name.toLowerCase() !== nameValue.toLowerCase(),
        );
      }
      return [...prev, { name: nameValue, category }];
    });
  };

  const filteredSections = useMemo(
    () =>
      pantrySections.map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          searchValue ? item.toLowerCase().includes(searchValue) : true,
        ),
      })),
    [searchValue],
  );

  const addCustomItem = () => {
    const value = customItem.trim();
    if (!value) return;
    toggleItem(value, "other");
    setCustomItem("");
  };

  const submit = async () => {
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
      setError("Please complete the earlier steps before finishing.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setStep6({ fridgeItems: selectedItems, nextShopDate: shopDate || null });

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
      trainingDays: JSON.stringify(trainingDays),
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

      if (selectedItems.length) {
        const fridgeRequests = selectedItems.map((item) =>
          fetch("/api/fridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              category: item.category,
            }),
          }),
        );
        await Promise.all(fridgeRequests);
      }

      router.push("/onboarding/complete");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving your profile.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepLayout
      step={6}
      total={6}
      title="Fridge setup"
      subtitle="Add what you currently have on hand."
      ctaLabel={submitting ? "Saving..." : "Complete"}
      onBack="/onboarding/step-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!submitting) {
          void submit();
        }
      }}
      disabled={submitting}
    >
      <div className="space-y-6">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-text-tertiary">
            Search ingredients
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ingredient"
            className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
        </label>

        <div className="space-y-5">
          {filteredSections.map((section) => (
            <div key={section.label} className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-text-tertiary">
                {section.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => {
                  const active = selectedItems.some(
                    (selected) =>
                      selected.name.toLowerCase() === item.toLowerCase(),
                  );
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(item, section.category)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        active
                          ? "border-accent bg-accent-light text-accent-text"
                          : "border-border bg-surface text-text-secondary"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
                {!section.items.length && searchValue ? (
                  <p className="text-xs text-text-tertiary">
                    No matches in {section.label.toLowerCase()}.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Add a custom item
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={customItem}
              onChange={(event) => setCustomItem(event.target.value)}
              placeholder="e.g. Fresh basil"
              className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            <button
              type="button"
              onClick={addCustomItem}
              className="rounded-md border border-border px-4 text-sm text-text-primary"
            >
              Add
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-text-tertiary">
            Next shopping trip
          </span>
          <input
            type="date"
            value={shopDate}
            onChange={(event) => setShopDate(event.target.value)}
            className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
        </label>

        <div className="rounded-card border border-border bg-surface-2 p-4 text-sm text-text-secondary">
          {selectedItems.length
            ? `${selectedItems.length} items selected`
            : "Select a few items to personalize your matches."}
        </div>

        {error ? (
          <p className="text-sm text-accent-text">{error}</p>
        ) : null}
      </div>
    </StepLayout>
  );
}
