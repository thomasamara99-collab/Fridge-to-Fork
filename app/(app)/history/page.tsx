"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useLogHistory } from "../../../hooks/useLogHistory";

export default function HistoryPage() {
  const { data: history, isLoading } = useLogHistory(60);
  const queryClient = useQueryClient();

  const relogMeal = async (meal: {
    mealId: string | null;
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    const response = await fetch("/api/meals/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        meal.mealId
          ? { mealId: meal.mealId }
          : {
              mealName: meal.mealName,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
            },
      ),
    });

    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: ["log", "today"] });
      queryClient.invalidateQueries({ queryKey: ["log", "history"] });
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-24 pt-8">
      <header>
        <h1 className="font-display text-3xl text-text-primary">Cooked history</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review previous meals and re-log in one tap.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-card border border-border bg-surface-2 p-4 text-sm text-text-tertiary">
          Loading history...
        </div>
      ) : history?.length ? (
        <div className="space-y-4">
          {history.map((day) => (
            <section
              key={day.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">
                  {new Date(day.date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <p className="text-xs text-text-tertiary">{day.calories} kcal</p>
              </div>
              <div className="mt-3 space-y-2">
                {day.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-text-primary">{meal.mealName}</p>
                      <p className="text-xs text-text-tertiary">
                        {meal.calories} kcal - {meal.protein}g protein
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void relogMeal(meal);
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary"
                    >
                      Re-log
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-border bg-surface-2 p-4 text-sm text-text-tertiary">
          No history yet. Log meals to start building your timeline.
        </div>
      )}
    </main>
  );
}
