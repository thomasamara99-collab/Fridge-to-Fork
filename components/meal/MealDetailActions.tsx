"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MealDetailActionsProps = {
  mealId: string;
  mealName: string;
};

export default function MealDetailActions({ mealId, mealName }: MealDetailActionsProps) {
  const router = useRouter();
  const [isCooking, setIsCooking] = useState(false);

  const cookMeal = async () => {
    if (isCooking) return;
    setIsCooking(true);

    try {
      const logResponse = await fetch("/api/meals/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId, mealName }),
      });

      if (!logResponse.ok) {
        return;
      }

      await fetch("/api/meals/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId, direction: "cooked", save: false }),
      });

      router.push("/log");
      router.refresh();
    } finally {
      setIsCooking(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-secondary"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => {
          void cookMeal();
        }}
        disabled={isCooking}
        className="flex-1 rounded-md bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {isCooking ? "Cooking..." : "Cook this"}
      </button>
    </div>
  );
}
