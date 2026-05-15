"use client";

import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import MacroRing from "../../../components/ui/MacroRing";
import SwipeDeck from "../../../components/meal/SwipeDeck";
import { useSwipeDeck } from "../../../hooks/useSwipeDeck";
import { useTodayLog } from "../../../hooks/useTodayLog";
import { useProfile } from "../../../hooks/useProfile";
import { fetchMealFeed } from "../../../hooks/useMealFeed";
import type { MealFeedItem } from "../../../types";
import Link from "next/link";

export default function SwipePage() {
  const router = useRouter();
  const {
    deck,
    filters,
    hungerLevel,
    setHungerLevel,
    toggleFilter,
    appendDeck,
    shiftDeck,
    isLoading,
  } = useSwipeDeck();
  const { data: profile } = useProfile();
  const { data: log } = useTodayLog();
  const queryClient = useQueryClient();
  const [pendingSwipe, setPendingSwipe] = useState<"left" | "right" | null>(
    null,
  );
  const [isPrefetching, setIsPrefetching] = useState(false);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [],
  );

  const macroTargets = profile ?? {
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
  };

  const macroLog = log ?? {
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const frontMeal = deck[0];

  // Check if user needs to complete training schedule or fridge setup
  const needsTrainingSetup = useMemo(() => {
    if (!profile?.trainingDays) return true;
    try {
      const days = JSON.parse(profile.trainingDays) as number[];
      return days.length === 0;
    } catch {
      return true;
    }
  }, [profile?.trainingDays]);

  const needsFridgeSetup = useMemo(() => {
    // We'll use a simple check - in a real app you'd check actual fridge items
    return true; // Always show this prompt as an example
  }, []);

  // Periodic background meal syncing
  useEffect(() => {
    // Trigger background meal sync to ensure we always have plenty of meals
    const syncMeals = async () => {
      try {
        await fetch("/api/meals/sync", { method: "POST" });
      } catch {
        // Silently fail - the feed API will handle syncing if needed
      }
    };

    // Sync on page load
    syncMeals();

    // Sync every 30 minutes while app is open
    const interval = setInterval(syncMeals, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSwipe = async (meal: MealFeedItem, direction: "left" | "right") => {
    shiftDeck();

    const swipeBody = JSON.stringify({ mealId: meal.id, direction });
    const swipeRequest = fetch("/api/meals/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: swipeBody,
    });

    await swipeRequest;
    queryClient.invalidateQueries({ queryKey: ["saved-meals"] });

    const remainingCount = Math.max(deck.length - 1, 0);
    if (remainingCount <= 2 && !isPrefetching) {
      setIsPrefetching(true);
      try {
        const more = await fetchMealFeed(filters, hungerLevel, 5);
        appendDeck(more);
      } finally {
        setIsPrefetching(false);
      }
    }
  };

  const filterOptions: Array<{ key: keyof typeof filters; label: string }> = [
    { key: "noConstraints", label: "No constraints" },
    { key: "fridgeOnly", label: "In my fridge" },
    { key: "underTwentyMin", label: "Under 20 min" },
    { key: "underThirtyMin", label: "Under 30 min" },
    { key: "highProtein", label: "High protein" },
    { key: "preWorkout", label: "Pre-workout" },
    { key: "budget", label: "Budget" },
    { key: "underFiveHundredKcal", label: "Under 500 kcal" },
    { key: "vegetarianOnly", label: "Vegetarian" },
    { key: "veganOnly", label: "Vegan" },
    { key: "glutenFreeOnly", label: "Gluten-free" },
    { key: "dairyFreeOnly", label: "Dairy-free" },
    { key: "nutFreeOnly", label: "Nut-free" },
    { key: "lowCarb", label: "Low carb" },
    { key: "highFiber", label: "High fiber" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-10 pt-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          {dateLabel}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-text-primary">
            Ready to cook?
          </h1>
          <Link
            href="/saved"
            className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-secondary"
          >
            Saved meals
          </Link>
        </div>
      </header>

      {/* Contextual prompts for setup completion */}
      {needsTrainingSetup && (
        <div className="rounded-card border border-accent/30 bg-accent-light p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Set your training schedule
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Tell us when you train to get better pre-workout meal suggestions.
              </p>
            </div>
            <Link
              href="/onboarding/step-5?setup=1"
              className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-white"
            >
              Set up
            </Link>
          </div>
        </div>
      )}

      {needsFridgeSetup && (
        <div className="rounded-card border border-accent/30 bg-accent-light p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Add your fridge items
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Unlock better meal matches by adding what you have on hand.
              </p>
            </div>
            <Link
              href="/fridge"
              className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-white"
            >
              Add items
            </Link>
          </div>
        </div>
      )}

      <section className="flex justify-between rounded-card border border-border bg-surface px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.06),_0_0_0_0.5px_rgba(0,0,0,0.04)]">
        <MacroRing
          label="Protein"
          value={macroLog.protein}
          target={macroTargets.targetProtein}
          color="var(--accent)"
          unit="g"
        />
        <MacroRing
          label="Carbs"
          value={macroLog.carbs}
          target={macroTargets.targetCarbs}
          color="#4A90D9"
          unit="g"
        />
        <MacroRing
          label="Fat"
          value={macroLog.fat}
          target={macroTargets.targetFat}
          color="#F5A623"
          unit="g"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Hunger level</p>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-text-secondary">
            {hungerLevel}/5
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={hungerLevel}
          onChange={(event) => setHungerLevel(Number(event.target.value))}
          className="w-full accent-[var(--accent)]"
        />
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => toggleFilter(option.key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${
              filters[option.key]
                ? "border-accent bg-accent-light text-accent-text"
                : "border-border bg-surface text-text-secondary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="pt-2">
        {isLoading ? (
          <div className="flex h-[520px] items-center justify-center rounded-card border border-dashed border-border bg-surface-2 text-sm text-text-tertiary">
            Loading meals...
          </div>
        ) : (
          <SwipeDeck
            meals={deck}
            pendingSwipe={pendingSwipe}
            onPendingHandled={() => setPendingSwipe(null)}
            onSwipe={handleSwipe}
          />
        )}
      </section>

      <section className="flex items-center justify-center gap-6">
        <button
          className="h-14 w-14 rounded-full border border-border bg-white text-lg"
          onClick={() => setPendingSwipe("left")}
          disabled={!deck.length}
        >
          X
        </button>
        <button
          className="h-12 w-12 rounded-full border border-border bg-white text-[11px]"
          onClick={() => {
            if (frontMeal) {
              router.push(`/meals/${frontMeal.id}`);
            }
          }}
          disabled={!frontMeal}
        >
          Recipe
        </button>
        <button
          className="h-16 w-16 rounded-full bg-accent text-lg text-white"
          onClick={() => setPendingSwipe("right")}
          disabled={!deck.length}
        >
          Save
        </button>
      </section>
    </main>
  );
}