"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useProfile } from "../../../hooks/useProfile";
import { useLogStats } from "../../../hooks/useLogStats";
import TagChip from "../../../components/ui/TagChip";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useLogStats();
  const queryClient = useQueryClient();
  const [weightInput, setWeightInput] = useState("");
  const [updatingWeight, setUpdatingWeight] = useState(false);
  const [weightMessage, setWeightMessage] = useState<string | null>(null);
  const [syncingMeals, setSyncingMeals] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const dietaryFilters = useMemo(() => {
    if (!profile?.dietaryFilters) return [];
    try {
      return JSON.parse(profile.dietaryFilters) as string[];
    } catch {
      return [];
    }
  }, [profile?.dietaryFilters]);

  const trainingDays = useMemo(() => {
    if (!profile?.trainingDays) return [];
    try {
      return JSON.parse(profile.trainingDays) as number[];
    } catch {
      return [];
    }
  }, [profile?.trainingDays]);

  const warning =
    profile &&
    (profile.targetCalories < 800 || profile.targetCalories > 5000)
      ? "Your calorie target is quite extreme. Make sure it reflects a plan you trust."
      : null;

  const updateWeight = async () => {
    const next = Number(weightInput);
    if (!Number.isFinite(next) || next < 30 || next > 250) {
      setWeightMessage("Enter a valid weight between 30kg and 250kg.");
      return;
    }

    setUpdatingWeight(true);
    setWeightMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: next }),
      });
      if (!response.ok) {
        throw new Error("Could not update weight.");
      }

      setWeightInput("");
      setWeightMessage("Weight updated and TDEE recalculated.");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["log", "stats"] });
    } catch {
      setWeightMessage("Could not update weight right now.");
    } finally {
      setUpdatingWeight(false);
    }
  };

  const syncMealDatabase = async () => {
    setSyncingMeals(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/meals/sync", { method: "POST" });
      if (!response.ok) {
        throw new Error("Could not sync meals");
      }
      const payload = (await response.json()) as { totalThemealDbMeals?: number };
      setSyncMessage(
        `Meal database updated. ${payload.totalThemealDbMeals ?? 0} imported meals available.`,
      );
      queryClient.invalidateQueries({ queryKey: ["meal-feed"] });
    } catch {
      setSyncMessage("Meal sync failed. Please try again in a moment.");
    } finally {
      setSyncingMeals(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-24 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Profile</h1>
          <p className="text-sm text-text-secondary">
            {profile?.goal ? `${profile.goal} goal` : "Your nutrition overview"}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white">
          {profile?.sex ? profile.sex.charAt(0).toUpperCase() : "F"}
        </div>
      </div>

      {warning ? (
        <div className="rounded-card border border-yellow/40 bg-yellow-light p-4 text-sm text-text-secondary">
          {warning}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Weight
          </p>
          <p className="mt-2 font-display text-2xl text-text-primary">
            {profile?.weightKg ?? "--"} kg
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Daily calories
          </p>
          <p className="mt-2 font-display text-2xl text-text-primary">
            {profile?.targetCalories ?? "--"}
          </p>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="text-sm font-medium text-text-primary">Streak and history</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-md bg-surface-2 p-3">
            <p className="text-xs text-text-tertiary">Current streak</p>
            <p className="mt-1 font-display text-xl text-text-primary">
              {stats?.streakDays ?? 0}
            </p>
          </div>
          <div className="rounded-md bg-surface-2 p-3">
            <p className="text-xs text-text-tertiary">Best streak</p>
            <p className="mt-1 font-display text-xl text-text-primary">
              {stats?.longestStreak ?? 0}
            </p>
          </div>
          <div className="rounded-md bg-surface-2 p-3">
            <p className="text-xs text-text-tertiary">Tracked days</p>
            <p className="mt-1 font-display text-xl text-text-primary">
              {stats?.trackedDays ?? 0}
            </p>
          </div>
        </div>
        <Link
          href="/history"
          className="mt-4 inline-flex items-center justify-center rounded-md border border-border bg-surface-2 px-4 py-2 text-xs text-text-primary"
        >
          View cooked history
        </Link>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="text-sm font-medium text-text-primary">
          Weight update and TDEE
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Keep your weight fresh and we recalculate TDEE automatically.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
            inputMode="decimal"
            placeholder="New weight (kg)"
            className="w-full rounded-md border border-transparent bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
          <button
            type="button"
            onClick={() => {
              void updateWeight();
            }}
            disabled={updatingWeight}
            className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {updatingWeight ? "Saving..." : "Update"}
          </button>
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          Current TDEE: {profile?.calculatedTdee ?? "--"} kcal
        </p>
        {weightMessage ? (
          <p className="mt-2 text-xs text-text-secondary">{weightMessage}</p>
        ) : null}
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Your targets</p>
          <Link href="/onboarding/step-3?edit=1" className="text-xs text-accent">
            Edit
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-text-secondary">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Protein
            </p>
            <p className="mt-1 font-display text-lg text-text-primary">
              {profile?.targetProtein ?? 0}g
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Carbs
            </p>
            <p className="mt-1 font-display text-lg text-text-primary">
              {profile?.targetCarbs ?? 0}g
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Fat
            </p>
            <p className="mt-1 font-display text-lg text-text-primary">
              {profile?.targetFat ?? 0}g
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="text-sm font-medium text-text-primary">
          Dietary preferences
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {dietaryFilters.length ? (
            dietaryFilters.map((filter) => (
              <TagChip key={filter} label={filter} tone="accent" />
            ))
          ) : (
            <TagChip label="No restrictions" />
          )}
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="text-sm font-medium text-text-primary">Training days</p>
        <div className="mt-3 flex justify-between rounded-full bg-surface-2 p-2">
          {dayLabels.map((label, index) => {
            const active = trainingDays.includes(index + 1);
            return (
              <span
                key={label}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  active ? "bg-accent text-white" : "text-text-tertiary"
                }`}
              >
                {label[0]}
              </span>
            );
          })}
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="text-sm font-medium text-text-primary">Recipe database</p>
        <p className="mt-2 text-sm text-text-secondary">
          Meals are imported from TheMealDB so users do not need manual admin entry.
        </p>
        <button
          type="button"
          onClick={() => {
            void syncMealDatabase();
          }}
          disabled={syncingMeals}
          className="mt-4 inline-flex items-center justify-center rounded-md border border-border bg-surface-2 px-4 py-2 text-xs text-text-primary disabled:opacity-60"
        >
          {syncingMeals ? "Syncing..." : "Sync meal database"}
        </button>
        {syncMessage ? (
          <p className="mt-2 text-xs text-text-secondary">{syncMessage}</p>
        ) : null}
      </section>

      {isLoading ? (
        <p className="text-xs text-text-tertiary">Loading profile…</p>
      ) : null}
    </main>
  );
}
