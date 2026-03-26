"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import PhotoUpload from "../../../../components/meal/PhotoUpload";

const tagOptions = [
  "budget",
  "high protein",
  "quick",
  "meal prep",
  "pre-workout",
  "breakfast",
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
] as const;

const allergenOptions = [
  "gluten",
  "dairy",
  "nuts",
  "peanuts",
  "soy",
  "eggs",
  "fish",
  "shellfish",
  "sesame",
] as const;

const ingredientSchema = z.object({
  name: z.string().min(1, "Required"),
  amount: z.string().min(1, "Required"),
});

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().max(80, "Max 80 characters").optional(),
  calories: z.number().min(50, "Minimum 50 kcal"),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fibre: z.number().min(0),
  satiating: z.number().min(1).max(5),
  prepMinutes: z.number().min(0),
  cookMinutes: z.number().min(0),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  tags: z.array(z.string()),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.object({ value: z.string().min(1, "Required") })).min(1),
  tools: z.array(z.object({ value: z.string().min(1, "Required") })).min(1),
  allergens: z.array(z.string()),
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  isGlutenFree: z.boolean(),
  isDairyFree: z.boolean(),
  isHalal: z.boolean(),
  isKosher: z.boolean(),
  isNutFree: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type MealCategory = "breakfast" | "protein" | "veggie" | "carbs" | "light" | "snack";
type MealTheme = "amber" | "coral" | "green" | "teal" | "blue";

const deriveCategory = (tags: string[]): MealCategory => {
  if (tags.includes("breakfast")) return "breakfast";
  if (tags.includes("vegetarian") || tags.includes("vegan")) return "veggie";
  if (tags.includes("high protein")) return "protein";
  if (tags.includes("pre-workout")) return "carbs";
  return "light";
};

const deriveTheme = (category: MealCategory): MealTheme => {
  switch (category) {
    case "breakfast":
      return "amber";
    case "protein":
      return "coral";
    case "veggie":
      return "green";
    case "carbs":
      return "teal";
    case "snack":
      return "blue";
    default:
      return "amber";
  }
};

export default function AddMealPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      calories: 450,
      protein: 35,
      carbs: 40,
      fat: 15,
      fibre: 4,
      satiating: 3,
      prepMinutes: 10,
      cookMinutes: 15,
      difficulty: 2,
      tags: [],
      ingredients: [{ name: "", amount: "" }],
      steps: [{ value: "" }],
      tools: [{ value: "" }],
      allergens: [],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isDairyFree: false,
      isHalal: false,
      isKosher: false,
      isNutFree: false,
    },
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } =
    useFieldArray({
      control,
      name: "ingredients",
    });

  const { fields: stepFields, append: appendStep, remove: removeStep } =
    useFieldArray({
      control,
      name: "steps",
    });

  const { fields: toolFields, append: appendTool, remove: removeTool } =
    useFieldArray({
      control,
      name: "tools",
    });

  const selectedTags = watch("tags");
  const selectedAllergens = watch("allergens");
  const selectedDifficulty = watch("difficulty");
  const calories = watch("calories") ?? 0;
  const protein = watch("protein") ?? 0;
  const carbs = watch("carbs") ?? 0;
  const fat = watch("fat") ?? 0;

  const macroCalories = useMemo(
    () => protein * 4 + carbs * 4 + fat * 9,
    [protein, carbs, fat],
  );
  const macroDelta = Math.abs(macroCalories - calories);
  const macroMatches = calories > 0 && macroDelta <= 50;

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];
    setValue("tags", next, { shouldDirty: true });
  };

  const toggleAllergen = (allergen: string) => {
    const next = selectedAllergens.includes(allergen)
      ? selectedAllergens.filter((item) => item !== allergen)
      : [...selectedAllergens, allergen];
    setValue("allergens", next, { shouldDirty: true });
  };

  const handleFileChange = (files: File[]) => {
    setPhotoError(null);
    setPhotoFiles([]);
    setPhotoPreviews([]);

    if (!files.length) {
      return;
    }

    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      setPhotoError("Please upload image files only.");
      return;
    }

    setPhotoFiles(images);
    void Promise.all(
      images.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(typeof reader.result === "string" ? reader.result : "");
            reader.readAsDataURL(file);
          }),
      ),
    ).then((previews) => {
      setPhotoPreviews(previews.filter(Boolean));
    });
  };

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);

    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    const inferredCategory = deriveCategory(data.tags);
    const inferredTheme = deriveTheme(inferredCategory);

    formData.append("emoji", "🍽️");
    formData.append("category", inferredCategory);
    formData.append("colorTheme", inferredTheme);
    formData.append("calories", String(data.calories));
    formData.append("protein", String(data.protein));
    formData.append("carbs", String(data.carbs));
    formData.append("fat", String(data.fat));
    formData.append("fibre", String(data.fibre));
    formData.append("satiating", String(data.satiating));
    formData.append("prepMinutes", String(data.prepMinutes));
    formData.append("cookMinutes", String(data.cookMinutes));
    formData.append("difficulty", String(data.difficulty));
    formData.append("tags", JSON.stringify(data.tags));
    formData.append("ingredients", JSON.stringify(data.ingredients));
    formData.append(
      "steps",
      JSON.stringify(data.steps.map((step) => step.value)),
    );
    formData.append(
      "tools",
      JSON.stringify(data.tools.map((tool) => tool.value)),
    );
    formData.append("allergens", JSON.stringify(data.allergens));
    formData.append("isVegetarian", String(data.isVegetarian));
    formData.append("isVegan", String(data.isVegan));
    formData.append("isGlutenFree", String(data.isGlutenFree));
    formData.append("isDairyFree", String(data.isDairyFree));
    formData.append("isHalal", String(data.isHalal));
    formData.append("isKosher", String(data.isKosher));
    formData.append("isNutFree", String(data.isNutFree));

    if (photoFiles.length) {
      photoFiles.forEach((file) => {
        formData.append("photos", file);
      });
    }

    const response = await fetch("/api/meals/add", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setSubmitError("We couldn't save that meal. Please try again.");
      return;
    }

    router.push("/swipe");
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-24 pt-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Create a custom meal
        </p>
        <h1 className="font-display text-3xl text-text-primary">
          Add your own recipe
        </h1>
        <p className="text-sm text-text-secondary">
          This helps the app learn what you actually cook. Keep it short and
          practical.
        </p>
      </header>

      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Basics
          </p>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Meal name
              </span>
              <input
                {...register("name")}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-accent-text">
                  {errors.name.message}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Description
              </span>
              <input
                {...register("description")}
                placeholder="Optional, max 80 characters"
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
              {errors.description ? (
                <p className="mt-1 text-xs text-accent-text">
                  {errors.description.message}
                </p>
              ) : null}
            </label>

            <div className="rounded-md bg-surface-2 px-4 py-3 text-xs text-text-secondary">
              Category, emoji, and color theme are assigned automatically to keep
              creation fast.
            </div>
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Macros
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Calories
              </span>
              <input
                type="number"
                {...register("calories", { valueAsNumber: true })}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
              {errors.calories ? (
                <p className="mt-1 text-xs text-accent-text">
                  {errors.calories.message}
                </p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Protein (g)
              </span>
              <input
                type="number"
                {...register("protein", { valueAsNumber: true })}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Carbs (g)
              </span>
              <input
                type="number"
                {...register("carbs", { valueAsNumber: true })}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Fat (g)
              </span>
              <input
                type="number"
                {...register("fat", { valueAsNumber: true })}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Fibre (g)
              </span>
              <input
                type="number"
                {...register("fibre", { valueAsNumber: true })}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
            </label>
          </div>
          <div
            className={`mt-4 rounded-md px-3 py-2 text-xs ${
              macroMatches
                ? "bg-green-light text-green-text"
                : "bg-yellow-light text-text-secondary"
            }`}
          >
            Macro calories: {macroCalories} kcal
            {calories > 0
              ? macroMatches
                ? " - Looks aligned with your calorie total."
                : " - Adjust macros to be within +/- 50 kcal."
              : null}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Timing & difficulty
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Prep minutes
              </span>
              <input
                type="number"
                {...register("prepMinutes", { valueAsNumber: true })}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-text-tertiary">
                Cook minutes
              </span>
              <input
                type="number"
                {...register("cookMinutes", { valueAsNumber: true })}
                className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
              />
            </label>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Difficulty
            </span>
            <input type="hidden" {...register("difficulty")} />
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-md bg-surface-2 p-1">
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setValue("difficulty", level as 1 | 2 | 3)}
                  className={`rounded-md px-2 py-2 text-xs font-medium ${
                    selectedDifficulty === level
                      ? "bg-white text-text-primary shadow"
                      : "text-text-secondary"
                  }`}
                >
                  {level === 1 ? "Easy" : level === 2 ? "Medium" : "Hard"}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            How satiating is it?
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Light</span>
              <span>Very filling</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              {...register("satiating", { valueAsNumber: true })}
              className="w-full accent-[var(--accent)]"
            />
            {errors.satiating ? (
              <p className="text-xs text-accent-text">
                {errors.satiating.message}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Dietary flags
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-text-secondary">
            {[
              { key: "isVegetarian", label: "Vegetarian" },
              { key: "isVegan", label: "Vegan" },
              { key: "isGlutenFree", label: "Gluten-free" },
              { key: "isDairyFree", label: "Dairy-free" },
              { key: "isHalal", label: "Halal" },
              { key: "isKosher", label: "Kosher" },
              { key: "isNutFree", label: "Nut-free" },
            ].map((flag) => (
              <label
                key={flag.key}
                className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <input
                  type="checkbox"
                  {...register(flag.key as keyof FormValues)}
                  className="accent-[var(--accent)]"
                />
                {flag.label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Allergen labels
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allergenOptions.map((allergen) => {
              const active = selectedAllergens.includes(allergen);
              return (
                <button
                  key={allergen}
                  type="button"
                  onClick={() => toggleAllergen(allergen)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-accent bg-accent-light text-accent-text"
                      : "border-border bg-surface text-text-secondary"
                  }`}
                >
                  {allergen}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Tools needed
            </p>
            <button
              type="button"
              onClick={() => appendTool({ value: "" })}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary"
            >
              Add tool
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {toolFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  {...register(`tools.${index}.value`)}
                  placeholder="e.g. Non-stick pan"
                  className="w-full rounded-md border border-transparent bg-surface-2 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent focus:bg-white"
                />
                {toolFields.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeTool(index)}
                    className="text-xs text-text-tertiary"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            {errors.tools ? (
              <p className="text-xs text-accent-text">
                Add at least one tool.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Ingredients
            </p>
            <button
              type="button"
              onClick={() => appendIngredient({ name: "", amount: "" })}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary"
            >
              Add row
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {ingredientFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-2">
                <input
                  {...register(`ingredients.${index}.name`)}
                  placeholder="Ingredient"
                  className="rounded-md border border-transparent bg-surface-2 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent focus:bg-white"
                />
                <input
                  {...register(`ingredients.${index}.amount`)}
                  placeholder="Amount"
                  className="rounded-md border border-transparent bg-surface-2 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="text-xs text-text-tertiary"
                >
                  Remove
                </button>
              </div>
            ))}
            {errors.ingredients ? (
              <p className="text-xs text-accent-text">
                Add at least one ingredient.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Steps
            </p>
            <button
              type="button"
              onClick={() => appendStep({ value: "" })}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary"
            >
              Add step
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {stepFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <textarea
                  rows={2}
                  {...register(`steps.${index}.value`)}
                  placeholder={`Step ${index + 1}`}
                  className="w-full rounded-md border border-transparent bg-surface-2 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent focus:bg-white"
                />
                {stepFields.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="pt-2 text-xs text-text-tertiary"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            {errors.steps ? (
              <p className="text-xs text-accent-text">
                Add at least one step.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Tags
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-accent bg-accent-light text-accent-text"
                      : "border-border bg-surface text-text-secondary"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        <PhotoUpload
          previewUrls={photoPreviews}
          onFilesChange={handleFileChange}
          error={photoError ?? undefined}
        />

        {submitError ? (
          <p className="text-sm text-accent-text">{submitError}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-accent px-5 py-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save meal"}
        </button>
      </form>
    </main>
  );
}
