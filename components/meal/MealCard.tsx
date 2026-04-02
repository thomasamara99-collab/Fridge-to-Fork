"use client";

import { useState } from "react";
import Image from "next/image";

import TagChip from "../ui/TagChip";
import type { MealFeedItem } from "../../types";

const themeColors: Record<string, string> = {
  amber: "#F7D07A",
  coral: "#F4A38C",
  green: "#A7D8B8",
  teal: "#9FDAD5",
  blue: "#A7C8F2",
};

export default function MealCard({ meal }: { meal: MealFeedItem }) {
  const totalMinutes = meal.prepMinutes + meal.cookMinutes;
  const tags = meal.computedTags.length ? meal.computedTags : meal.tags;
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.06),_0_0_0_0.5px_rgba(0,0,0,0.04)]">
      <div className="relative h-[240px] w-full">
        {meal.photoPath && !imageFailed ? (
          <Image
            src={meal.photoPath}
            alt={meal.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 360px"
            priority
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: themeColors[meal.colorTheme] ?? "#F4F2ED" }}
          >
            <span className="text-6xl">{meal.emoji}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2 rounded-md border border-border bg-white/90 px-3 py-2 text-[11px] text-text-secondary">
            <span className="text-text-primary">{meal.protein}g protein</span>
            <span>·</span>
            <span className="text-text-primary">{meal.calories} kcal</span>
            <span>·</span>
            <span className="text-text-primary">{totalMinutes} min</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div>
          <h3 className="font-display text-[22px] italic text-text-primary">
            {meal.name}
          </h3>
          <p className="mt-1 truncate text-[13px] text-text-secondary">
            {meal.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              tone={tag.includes("fridge") ? "green" : "default"}
            />
          ))}
        </div>

        <div className="h-px w-full bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green">
            {meal.matchScore}% match
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`h-2 w-2 rounded-full ${
                  meal.difficulty >= level ? "bg-text-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
