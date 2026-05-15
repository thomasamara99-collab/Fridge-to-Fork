"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MealDetailActionsProps = {
  mealId: string;
  mealName: string;
  calories?: number;
  protein?: number;
};

export default function MealDetailActions({ 
  mealId, 
  mealName,
  calories = 0,
  protein = 0 
}: MealDetailActionsProps) {
  const router = useRouter();
  const [isCooking, setIsCooking] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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

      setShowShare(true);
      setTimeout(() => {
        router.push("/log");
        router.refresh();
      }, 500);
    } finally {
      setIsCooking(false);
    }
  };

  const shareMeal = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const shareData = {
        title: `I just cooked ${mealName}!`,
        text: `I just cooked ${mealName} using Fridge to Fork. ${calories} calories, ${protein}g protein. Track your nutrition with personalized meal recommendations!`,
        url: typeof window !== 'undefined' ? window.location.href : 'https://fridgetofork.app',
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
      // Don't show error for user cancellation
    } finally {
      setIsSharing(false);
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
      {showShare && (
        <button
          type="button"
          onClick={() => {
            void shareMeal();
          }}
          disabled={isSharing}
          className="rounded-md border border-accent bg-surface px-4 py-3 text-sm font-medium text-accent disabled:opacity-60"
        >
          {isSharing ? "Sharing..." : "Share 🎉"}
        </button>
      )}
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
