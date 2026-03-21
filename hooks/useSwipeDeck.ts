"use client";

import { useEffect } from "react";

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

  const mealFeed = useMealFeed({
    filters,
    hungerLevel,
    limit: 5,
    includeHungerInKey: false,
  });

  useEffect(() => {
    if (mealFeed.data) {
      setDeck(mealFeed.data);
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
