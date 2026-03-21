"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import MacroRing from "../../../components/ui/MacroRing";
import SwipeDeck from "../../../components/meal/SwipeDeck";
import { useSwipeDeck } from "../../../hooks/useSwipeDeck";
import { useTodayLog } from "../../../hooks/useTodayLog";
import { useProfile } from "../../../hooks/useProfile";
import { fetchMealFeed } from "../../../hooks/useMealFeed";
import type { MealFeedItem } from "../../../types";

export default function SwipePage() {
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

  const handleSwipe = async (meal: MealFeedItem, direction: "left" | "right") => {
    shiftDeck();

    if (direction === "right") {
      queryClient.setQueryData(["log", "today"], (current: any) => {
        const base = current ?? {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: [],
        };

        return {
          ...base,
          calories: base.calories + meal.calories,
          protein: base.protein + meal.protein,
          carbs: base.carbs + meal.carbs,
          fat: base.fat + meal.fat,
          meals: [
            {
              id: `optimistic-${meal.id}`,
              mealId: meal.id,
              mealName: meal.name,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              loggedAt: new Date().toISOString(),
            },
            ...(base.meals ?? []),
          ],
        };
      });
    }

    const swipeBody = JSON.stringify({ mealId: meal.id, direction });
    const swipeRequest = fetch("/api/meals/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: swipeBody,
    });

    const logRequest =
      direction === "right"
        ? fetch("/api/meals/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mealId: meal.id }),
          })
        : Promise.resolve();

    await Promise.all([swipeRequest, logRequest]);

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
    { key: "fridgeOnly", label: "In my fridge" },
    { key: "underTwentyMin", label: "Under 20 min" },
    { key: "highProtein", label: "High protein" },
    { key: "preWorkout", label: "Pre-workout" },
    { key: "budget", label: "Budget" },
    { key: "underFiveHundredKcal", label: "Under 500 kcal" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-10 pt-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          {dateLabel}
        </p>
        <h1 className="font-display text-3xl text-text-primary">
          Ready to cook?
        </h1>
      </header>

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
          ✕
        </button>
        <button className="h-12 w-12 rounded-full border border-border bg-white text-lg">
          📋
        </button>
        <button
          className="h-16 w-16 rounded-full bg-accent text-lg text-white"
          onClick={() => setPendingSwipe("right")}
          disabled={!deck.length}
        >
          ✓
        </button>
      </section>
    </main>
  );
}
