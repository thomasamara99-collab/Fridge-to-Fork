"use client";

import { useEffect, useMemo, useRef } from "react";

import { useMealFeed } from "./useMealFeed";
import { useSwipeStore } from "../store/swipeStore";

export function useSwipeDeck() {
  const {
    deck,
    setDeck,
    appendDeck,
    shiftDeck,
    filters,
    hungerLevel,
    setHungerLevel,
    toggleFilter,
  } = useSwipeStore();
  const recentlySeenRef = useRef<string[]>([]);

  const excludedMealIds = useMemo(() => {
    const combined = [...deck.map((meal) => meal.id), ...recentlySeenRef.current];
    return Array.from(new Set(combined)).slice(-80);
  }, [deck]);

  const mealFeed = useMealFeed({
    filters,
    hungerLevel,
    limit: 12,
    includeHungerInKey: false,
    excludeMealIds: excludedMealIds,
  });

  useEffect(() => {
    if (mealFeed.data) {
      setDeck(mealFeed.data);
      recentlySeenRef.current = Array.from(
        new Set([...recentlySeenRef.current, ...mealFeed.data.map((meal) => meal.id)]),
      ).slice(-120);
    }
  }, [mealFeed.data, setDeck]);

  return {
    deck,
    filters,
    hungerLevel,
    setHungerLevel,
    toggleFilter,
    setDeck,
    appendDeck,
    shiftDeck,
    isLoading: mealFeed.isLoading,
    error: mealFeed.error,
    refetch: mealFeed.refetch,
  };
}
