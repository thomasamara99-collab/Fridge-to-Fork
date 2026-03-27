"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useFridge } from "../../../hooks/useFridge";

const categories = [
  "protein",
  "veg",
  "carb",
  "dairy",
  "pantry",
  "fruit",
  "other",
] as const;

export default function FridgePage() {
  const { data: items, isLoading } = useFridge();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("protein");
  const [quantity, setQuantity] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, typeof items> = {};
    (items ?? []).forEach((item) => {
      const key = item.category || "other";
      if (!map[key]) map[key] = [];
      map[key]?.push(item);
    });
    return map;
  }, [items]);

  const addItem = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Add an ingredient name.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          category,
          quantity: quantity.trim() || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Could not save item.");
      }
      setName("");
      setQuantity("");
      setExpiresAt("");
      queryClient.invalidateQueries({ queryKey: ["fridge"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save item.");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    await fetch(`/api/fridge?id=${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["fridge"] });
  };

  const handlePhoto = (file: File | null) => {
    setPhotoError(null);
    setPhotoPreview(null);

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      setPhotoPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-24 pt-8">
      <h1 className="font-display text-3xl text-text-primary">Your fridge</h1>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Add from photo
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Snap your fridge or pantry and we will extract ingredients.
        </p>
        <div className="mt-4 space-y-3">
          {photoPreview ? (
            <div className="relative h-44 overflow-hidden rounded-md border border-border">
              <Image
                src={photoPreview}
                alt="Fridge preview"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-border bg-surface-2 text-sm text-text-tertiary">
              Add a fridge photo to start
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) =>
              handlePhoto(event.target.files?.[0] ?? null)
            }
            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-accent-light file:px-4 file:py-2 file:text-xs file:font-medium file:text-accent-text"
          />
          {photoError ? (
            <p className="text-xs text-accent-text">{photoError}</p>
          ) : null}
          <button
            type="button"
            disabled
            className="w-full rounded-md border border-dashed border-border bg-surface-2 px-4 py-3 text-sm text-text-tertiary"
          >
            Analyze photo (coming soon)
          </button>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Add ingredients
        </p>
        <div className="mt-3 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ingredient name"
            className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as typeof category)
              }
              className="w-full rounded-md border border-transparent bg-surface-2 px-3 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Quantity"
              className="w-full rounded-md border border-transparent bg-surface-2 px-3 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
          </div>
          <input
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="w-full rounded-md border border-transparent bg-surface-2 px-3 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
          {error ? (
            <p className="text-sm text-accent-text">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={addItem}
            className="w-full rounded-md bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add to fridge"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-text-primary">Inventory</h2>
        {isLoading ? (
          <div className="rounded-card border border-border bg-surface-2 p-4 text-sm text-text-tertiary">
            Loading fridge...
          </div>
        ) : !items?.length ? (
          <div className="rounded-card border border-dashed border-border bg-surface-2 p-4 text-sm text-text-tertiary">
            Add your first ingredient to start matching meals.
          </div>
        ) : (
          Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-text-tertiary">
                {group}
              </p>
              <div className="space-y-2">
                {groupItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-card border border-border bg-surface p-3 text-sm"
                  >
                    <div>
                      <p className="text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-tertiary">
                        {item.quantity ? `${item.quantity} · ` : ""}
                        {item.expiresAt
                          ? `Expires ${new Date(item.expiresAt).toLocaleDateString()}`
                          : "No expiry"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
