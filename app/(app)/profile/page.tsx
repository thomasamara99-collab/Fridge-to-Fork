"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProfile } from "../../../hooks/useProfile";
import TagChip from "../../../components/ui/TagChip";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

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
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Your targets</p>
          <Link href="/onboarding/step-3" className="text-xs text-accent">
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
        <p className="text-sm font-medium text-text-primary">My meals</p>
        <p className="mt-2 text-sm text-text-secondary">
          Custom meal tracking is coming next. You&apos;ll be able to see and edit
          everything you add.
        </p>
      </section>

      {isLoading ? (
        <p className="text-xs text-text-tertiary">Loading profile…</p>
      ) : null}
    </main>
  );
}
