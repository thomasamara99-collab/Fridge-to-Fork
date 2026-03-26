import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import TagChip from "../../../../components/ui/TagChip";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import type { IngredientEntry } from "../../../../types";

export const dynamic = "force-dynamic";

const colorMap: Record<string, string> = {
  amber: "bg-yellow-light",
  coral: "bg-accent-light",
  green: "bg-green-light",
  teal: "bg-[#E6F5F4]",
  blue: "bg-[#EAF1FB]",
};

export default async function MealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const meal = await prisma.meal.findUnique({
    where: { id: params.id },
  });

  if (!meal) {
    notFound();
  }

  const tags = (() => {
    try {
      return JSON.parse(meal.tags) as string[];
    } catch {
      return [];
    }
  })();

  const ingredients = (() => {
    try {
      return JSON.parse(meal.ingredients) as IngredientEntry[];
    } catch {
      return [];
    }
  })();

  const steps = (() => {
    try {
      return JSON.parse(meal.steps) as string[];
    } catch {
      return [];
    }
  })();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-24 pt-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Meal details
        </p>
        <h1 className="font-display text-3xl text-text-primary">{meal.name}</h1>
        <p className="text-sm text-text-secondary">{meal.description}</p>
      </header>

      <section className="overflow-hidden rounded-card border border-border bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.06),_0_0_0_0.5px_rgba(0,0,0,0.04)]">
        {meal.photoPath ? (
          <Image
            src={meal.photoPath}
            alt={meal.name}
            width={640}
            height={420}
            className="h-56 w-full object-cover"
            priority
          />
        ) : (
          <div
            className={`flex h-56 items-center justify-center ${
              colorMap[meal.colorTheme] ?? "bg-surface-2"
            }`}
          >
            <span className="text-6xl">{meal.emoji}</span>
          </div>
        )}
        <div className="border-t border-border px-4 py-4 text-sm text-text-secondary">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-xs">
              {meal.protein}g protein
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs">
              {meal.calories} kcal
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs">
              {meal.prepMinutes + meal.cookMinutes} min
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm font-medium text-text-primary">Macros</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-text-secondary">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Calories
            </p>
            <p className="mt-1 font-display text-lg text-text-primary">
              {meal.calories}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Protein
            </p>
            <p className="mt-1 font-display text-lg text-text-primary">
              {meal.protein}g
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Carbs
            </p>
            <p className="mt-1 font-display text-lg text-text-primary">
              {meal.carbs}g
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Fat
            </p>
            <p className="mt-1 font-display text-lg text-text-primary">
              {meal.fat}g
            </p>
          </div>
        </div>
      </section>

      {tags.length ? (
        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-sm font-medium text-text-primary">Tags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm font-medium text-text-primary">Ingredients</p>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          {ingredients.length ? (
            ingredients.map((ingredient) => (
              <li
                key={`${ingredient.name}-${ingredient.amount}`}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-text-primary">{ingredient.name}</span>
                <span className="text-xs text-text-tertiary">
                  {ingredient.amount}
                </span>
              </li>
            ))
          ) : (
            <li className="text-text-tertiary">No ingredients listed.</li>
          )}
        </ul>
      </section>

      <section className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm font-medium text-text-primary">Steps</p>
        <ol className="mt-3 space-y-3 text-sm text-text-secondary">
          {steps.length ? (
            steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 text-xs text-text-tertiary">
                  {index + 1}
                </span>
                <span className="text-text-primary">{step}</span>
              </li>
            ))
          ) : (
            <li className="text-text-tertiary">No steps saved yet.</li>
          )}
        </ol>
      </section>
    </main>
  );
}
