"use client";

import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

import { useSavedMeals } from "../../../hooks/useSavedMeals";

export default function SavedMealsPage() {
  const { data: savedMeals, isLoading } = useSavedMeals();
  const queryClient = useQueryClient();

  const logMeal = async (savedMealId: string) => {
    const response = await fetch("/api/meals/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedMealId }),
    });

    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: ["saved-meals"] });
      queryClient.invalidateQueries({ queryKey: ["log", "today"] });
    }
  };

  const removeSaved = async (id: string) => {
    const response = await fetch(`/api/meals/saved?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: ["saved-meals"] });
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-24 pt-8">
      <header>
        <h1 className="font-display text-3xl text-text-primary">Saved meals</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Swipe right now saves meals here. Log only when you actually eat.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-card border border-border bg-surface-2 p-4 text-sm text-text-tertiary">
          Loading saved meals...
        </div>
      ) : savedMeals?.length ? (
        <div className="space-y-3">
          {savedMeals.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-card border border-border bg-surface"
            >
              <div className="flex items-center gap-3 p-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-md bg-surface-2">
                  {item.meal.photoPath ? (
                    <Image
                      src={item.meal.photoPath}
                      alt={item.meal.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-text-tertiary">
                      No photo
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-medium text-text-primary">{item.meal.name}</h2>
                  <p className="text-xs text-text-tertiary">
                    {item.meal.calories} kcal - {item.meal.protein}g protein
                  </p>
                </div>
              </div>
              <div className="flex gap-2 border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    void logMeal(item.id);
                  }}
                  className="flex-1 rounded-md bg-accent px-4 py-2 text-sm text-white"
                >
                  Log as cooked
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void removeSaved(item.id);
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-border bg-surface-2 p-4 text-sm text-text-tertiary">
          No saved meals yet. Head to Swipe and save meals first.
        </div>
      )}
    </main>
  );
}
