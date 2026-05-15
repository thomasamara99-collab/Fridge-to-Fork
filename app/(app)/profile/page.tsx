"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useProfile } from "../../../hooks/useProfile";
import { useLogStats } from "../../../hooks/useLogStats";
import { useLogHistory } from "../../../hooks/useLogHistory";
import TagChip from "../../../components/ui/TagChip";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useLogStats();
  const { data: history } = useLogHistory(7);
  const queryClient = useQueryClient();
  const [weightInput, setWeightInput] = useState("");
  const [updatingWeight, setUpdatingWeight] = useState(false);
  const [weightMessage, setWeightMessage] = useState<string | null>(null);

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

  // Calculate weekly progress
  const weeklyProgress = useMemo(() => {
    if (!history || !profile) return null;
    
    const daysWithProteinGoal = history.filter(day => day.protein >= (profile.targetProtein || 0)).length;
    const daysWithCalorieGoal = history.filter(day => {
      const targetCalories = profile.targetCalories || 2000;
      const withinRange = Math.abs(day.calories - targetCalories) <= 200;
      return withinRange;
    }).length;
    
    const totalProtein = history.reduce((sum, day) => sum + day.protein, 0);
    const totalCalories = history.reduce((sum, day) => sum + day.calories, 0);
    
    return {
      proteinGoalDays: daysWithProteinGoal,
      calorieGoalDays: daysWithCalorieGoal,
      totalDays: history.length,
      avgProtein: Math.round(totalProtein / history.length),
      avgCalories: Math.round(totalCalories / history.length),
    };
  }, [history, profile]);

  // Generate progress narrative
  const progressNarrative = useMemo(() => {
    if (!weeklyProgress || !stats) return null;
    
    const { proteinGoalDays, totalDays } = weeklyProgress;
    const proteinRate = Math.round((proteinGoalDays / Math.max(totalDays, 1)) * 100);
    
    if (stats.streakDays >= 7) {
      return `Amazing! You're on a ${stats.streakDays}-day streak. You hit your protein goal ${proteinGoalDays}/${totalDays} days this week. Keep crushing it! 💪`;
    } else if (stats.streakDays >= 3) {
      return `Great progress! ${stats.streakDays}-day streak going. You hit your protein goal ${proteinGoalDays}/${totalDays} days this week. You're building momentum! 🔥`;
    } else if (proteinRate >= 70) {
      return `You hit your protein goal ${proteinGoalDays}/${totalDays} days this week. Your nutrition is on point! Let's get that streak going! 🎯`;
    } else if (proteinRate >= 50) {
      return `You hit your protein goal ${proteinGoalDays}/${totalDays} days this week. Good progress! Try to increase your protein intake on the other days. 💪`;
    } else {
      return `You hit your protein goal ${proteinGoalDays}/${totalDays} days this week. Let's focus on high-protein meals to boost your progress! 🚀`;
    }
  }, [weeklyProgress, stats]);

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

      {/* Progress Narrative Section */}
      {progressNarrative ? (
        <section className="rounded-card border border-border bg-surface p-5">
          <p className="text-sm font-medium text-text-primary">Your progress</p>
          <p className="mt-3 text-sm text-text-secondary">{progressNarrative}</p>
          {weeklyProgress && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-text-tertiary">Protein goal</p>
                <p className="mt-1 font-display text-lg text-text-primary">
                  {weeklyProgress.proteinGoalDays}/{weeklyProgress.totalDays} days
                </p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-text-tertiary">Avg protein</p>
                <p className="mt-1 font-display text-lg text-text-primary">
                  {weeklyProgress.avgProtein}g
                </p>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {/* Streak and History */}
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

      {/* Quick Stats */}
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

      {/* Your Targets */}
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

      {/* Settings Section */}
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between rounded-card border border-border bg-surface px-5 py-4 text-sm font-medium text-text-primary">
          Settings & Preferences
          <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-4 flex flex-col gap-4 px-5">
          {/* Weight Update */}
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

          {/* Dietary Preferences */}
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

          {/* Training Days */}
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

        </div>
      </details>

      {isLoading ? (
        <p className="text-xs text-text-tertiary">Loading profile…</p>
      ) : null}
    </main>
  );
}
