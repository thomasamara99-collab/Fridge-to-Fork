"use client";

import { useMemo, useState } from "react";

import StepLayout from "../../../components/onboarding/StepLayout";
import { useOnboardingStore } from "../../../store/onboardingStore";

export const dynamic = "force-dynamic";

const pantrySections = [
  {
    label: "Proteins",
    category: "protein",
    items: [
      { name: "Chicken breast", quantity: "300g" },
      { name: "Salmon", quantity: "2 fillets" },
      { name: "Eggs", quantity: "6" },
      { name: "Tuna", quantity: "2 cans" },
      { name: "Ground beef", quantity: "300g" },
      { name: "Turkey", quantity: "300g" },
      { name: "Tofu", quantity: "1 block" },
      { name: "Greek yogurt", quantity: "500g" },
      { name: "Shrimp", quantity: "250g" },
      { name: "Tempeh", quantity: "1 block" },
      { name: "Cottage cheese", quantity: "300g" },
      { name: "Canned beans", quantity: "2 cans" },
    ],
  },
  {
    label: "Veggies",
    category: "veg",
    items: [
      { name: "Spinach", quantity: "200g" },
      { name: "Broccoli", quantity: "1 head" },
      { name: "Bell pepper", quantity: "3" },
      { name: "Cherry tomatoes", quantity: "250g" },
      { name: "Zucchini", quantity: "2" },
      { name: "Carrots", quantity: "4" },
      { name: "Onion", quantity: "2" },
      { name: "Garlic", quantity: "1 bulb" },
      { name: "Mushrooms", quantity: "200g" },
      { name: "Cucumber", quantity: "1" },
      { name: "Kale", quantity: "150g" },
      { name: "Green beans", quantity: "200g" },
    ],
  },
  {
    label: "Carbs",
    category: "carb",
    items: [
      { name: "Rice", quantity: "500g" },
      { name: "Pasta", quantity: "500g" },
      { name: "Quinoa", quantity: "400g" },
      { name: "Potatoes", quantity: "1kg" },
      { name: "Tortillas", quantity: "8" },
      { name: "Oats", quantity: "500g" },
      { name: "Bread", quantity: "1 loaf" },
      { name: "Sweet potato", quantity: "2" },
      { name: "Couscous", quantity: "400g" },
      { name: "Noodles", quantity: "400g" },
      { name: "Bagels", quantity: "4" },
      { name: "Wraps", quantity: "6" },
    ],
  },
  {
    label: "Dairy",
    category: "dairy",
    items: [
      { name: "Milk", quantity: "1L" },
      { name: "Cheddar", quantity: "200g" },
      { name: "Parmesan", quantity: "100g" },
      { name: "Butter", quantity: "250g" },
      { name: "Cottage cheese", quantity: "300g" },
      { name: "Feta", quantity: "200g" },
      { name: "Mozzarella", quantity: "200g" },
      { name: "Cream", quantity: "250ml" },
      { name: "Yogurt", quantity: "500g" },
      { name: "Sour cream", quantity: "200g" },
      { name: "Cream cheese", quantity: "200g" },
      { name: "Ricotta", quantity: "250g" },
    ],
  },
  {
    label: "Pantry",
    category: "pantry",
    items: [
      { name: "Olive oil", quantity: "500ml" },
      { name: "Soy sauce", quantity: "250ml" },
      { name: "Tomato paste", quantity: "1 tube" },
      { name: "Canned beans", quantity: "2 cans" },
      { name: "Chickpeas", quantity: "2 cans" },
      { name: "Peanut butter", quantity: "1 jar" },
      { name: "Hot sauce", quantity: "1 bottle" },
      { name: "Honey", quantity: "1 jar" },
      { name: "Coconut milk", quantity: "2 cans" },
      { name: "Stock cubes", quantity: "1 pack" },
      { name: "Mustard", quantity: "1 jar" },
      { name: "Vinegar", quantity: "1 bottle" },
    ],
  },
  {
    label: "Fruits",
    category: "fruit",
    items: [
      { name: "Banana", quantity: "6" },
      { name: "Apple", quantity: "6" },
      { name: "Lemon", quantity: "3" },
      { name: "Lime", quantity: "3" },
      { name: "Berries", quantity: "250g" },
      { name: "Avocado", quantity: "3" },
      { name: "Orange", quantity: "6" },
      { name: "Grapes", quantity: "500g" },
      { name: "Mango", quantity: "2" },
      { name: "Pineapple", quantity: "1" },
      { name: "Strawberries", quantity: "250g" },
      { name: "Blueberries", quantity: "250g" },
    ],
  },
] as const;

export default function Step6Page() {
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

  const toggleItem = (
    nameValue: string,
    category: string,
    defaultQuantity: string,
  ) => {
    setSelectedItems((prev) => {
      const exists = prev.some(
        (item) => item.name.toLowerCase() === nameValue.toLowerCase(),
      );
      if (exists) {
        return prev.filter(
          (item) => item.name.toLowerCase() !== nameValue.toLowerCase(),
        );
      }
      return [...prev, { name: nameValue, category, quantity: defaultQuantity }];
    });
  };

  const updateQuantity = (nameValue: string, quantity: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.name.toLowerCase() === nameValue.toLowerCase()
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const filteredSections = useMemo(
    () =>
      pantrySections.map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          searchValue
            ? item.name.toLowerCase().includes(searchValue)
            : true,
        ),
      })),
    [searchValue],
  );

  const addCustomItem = () => {
    const value = customItem.trim();
    if (!value) return;
    toggleItem(value, "other", "1");
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
                quantity: item.quantity || undefined,
              }),
            }),
          );
          await Promise.all(fridgeRequests);
        }

      window.location.href = "/swipe";
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
                      selected.name.toLowerCase() === item.name.toLowerCase(),
                  );
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() =>
                        toggleItem(item.name, section.category, item.quantity)
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        active
                          ? "border-accent bg-accent-light text-accent-text"
                          : "border-border bg-surface text-text-secondary"
                      }`}
                    >
                      {item.name}
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

        {selectedItems.length ? (
          <div className="rounded-card border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Selected items & quantities
            </p>
            <div className="mt-3 space-y-2">
              {selectedItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-text-primary">{item.name}</span>
                  <input
                    value={item.quantity ?? ""}
                    onChange={(event) =>
                      updateQuantity(item.name, event.target.value)
                    }
                    placeholder="Qty"
                    className="w-24 rounded-md border border-transparent bg-surface-2 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-accent-text">{error}</p>
        ) : null}
      </div>
    </StepLayout>
  );
}
