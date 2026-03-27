"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import MacroRing from "../../../components/ui/MacroRing";
import ProgressBar from "../../../components/ui/ProgressBar";
import { useTodayLog } from "../../../hooks/useTodayLog";
import { useProfile } from "../../../hooks/useProfile";
import type { LoggedMeal, TodayLog } from "../../../types";

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

const getRemainingMessage = (remaining: number) => {
  const hour = new Date().getHours();
  if (remaining < 0) return "You've gone over today. Easy tomorrow morning.";
  if (remaining < 200) return "Nearly there — a light snack at most.";
  if (remaining > 800 && hour >= 18) {
    return "You've got room for a solid dinner.";
  }
  return "You're on track. Keep it steady.";
};

export default function LogPage() {
  const { data: profile } = useProfile();
  const { data: log, isLoading } = useTodayLog();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [quickName, setQuickName] = useState("");
  const [quickCalories, setQuickCalories] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFat, setQuickFat] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcodeStatus, setBarcodeStatus] = useState<
    "idle" | "loading" | "found" | "missing" | "error"
  >("idle");
  const [barcodeMessage, setBarcodeMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<
    "idle" | "starting" | "scanning" | "found" | "error"
  >("idle");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const targets = profile ?? {
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
  };

  const current = log ?? {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meals: [],
  };

  const remainingCalories = targets.targetCalories - current.calories;
  const remainingMessage = useMemo(
    () => getRemainingMessage(remainingCalories),
    [remainingCalories],
  );

  const toNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };

  const submitQuickAdd = async () => {
    setQuickError(null);
    if (quickSubmitting) return;

    const calories = toNumber(quickCalories);
    const protein = toNumber(quickProtein);
    const carbs = toNumber(quickCarbs);
    const fat = toNumber(quickFat);
    const total = calories + protein + carbs + fat;

    if (total <= 0) {
      setQuickError("Add at least one macro or calorie value.");
      return;
    }

    const mealName = quickName.trim() || "Quick add";
    const tempId = `temp-${Date.now()}`;

    setQuickSubmitting(true);
    queryClient.setQueryData<TodayLog>(["log", "today"], (prev) => {
      const base = prev ?? {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: [],
      };
      return {
        ...base,
        calories: base.calories + calories,
        protein: base.protein + protein,
        carbs: base.carbs + carbs,
        fat: base.fat + fat,
        meals: [
          {
            id: tempId,
            mealId: null,
            mealName,
            calories,
            protein,
            carbs,
            fat,
            loggedAt: new Date().toISOString(),
          },
          ...base.meals,
        ],
      };
    });

    try {
      const response = await fetch("/api/meals/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName,
          calories,
          protein,
          carbs,
          fat,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to log meal.");
      }

      setQuickName("");
      setQuickCalories("");
      setQuickProtein("");
      setQuickCarbs("");
      setQuickFat("");
    } catch {
      setQuickError("We couldn't log that entry. Please try again.");
    } finally {
      setQuickSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["log", "today"] });
    }
  };

  const lookupBarcode = async (value?: string) => {
    const trimmed = (value ?? barcode).trim();
    if (!trimmed) {
      setBarcodeStatus("error");
      setBarcodeMessage("Enter a barcode to look up.");
      return;
    }

    setBarcodeStatus("loading");
    setBarcodeMessage("");

    try {
      const response = await fetch(
        `/api/foods/lookup?barcode=${encodeURIComponent(trimmed)}`,
      );

      if (response.status === 404) {
        setBarcodeStatus("missing");
        setBarcodeMessage("No match yet. You can still log manually.");
        return;
      }

      if (!response.ok) {
        throw new Error("Lookup failed.");
      }

      const item = (await response.json()) as {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };

      setBarcode(trimmed);
      setQuickName(item.name ?? "Barcode item");
      setQuickCalories(String(item.calories ?? ""));
      setQuickProtein(String(item.protein ?? ""));
      setQuickCarbs(String(item.carbs ?? ""));
      setQuickFat(String(item.fat ?? ""));
      setBarcodeStatus("found");
      setBarcodeMessage("Filled from barcode data.");
    } catch {
      setBarcodeStatus("error");
      setBarcodeMessage("We couldn't look that up right now.");
    }
  };

  const stopScanner = () => {
    scanningRef.current = false;
    setScannerStatus("idle");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanner = async () => {
    setScannerError(null);

    const Detector = window.BarcodeDetector;
    if (!Detector) {
      setScannerStatus("error");
      setScannerError(
        "Barcode scanning is not supported on this device. Use manual entry instead.",
      );
      return;
    }

    if (scannerStatus === "starting" || scannerStatus === "scanning") return;

    setScannerStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });

      scanningRef.current = true;
      setScannerStatus("scanning");

      const scanLoop = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results.length && results[0]?.rawValue) {
            const value = results[0].rawValue;
            setScannerStatus("found");
            setScannerOpen(false);
            stopScanner();
            await lookupBarcode(value);
            return;
          }
        } catch {
          setScannerStatus("error");
          setScannerError("Scanning failed. Try manual entry.");
          stopScanner();
          return;
        }
        requestAnimationFrame(scanLoop);
      };

      requestAnimationFrame(scanLoop);
    } catch {
      setScannerStatus("error");
      setScannerError("Camera access failed. Check permissions.");
      stopScanner();
    }
  };

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner();
    }

    return () => stopScanner();
  }, [scannerOpen]);

  const deleteMeal = async (meal: LoggedMeal) => {
    if (!meal.id) return;
    setDeleting(meal.id);

    queryClient.setQueryData<TodayLog>(["log", "today"], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        calories: Math.max(0, prev.calories - meal.calories),
        protein: Math.max(0, prev.protein - meal.protein),
        carbs: Math.max(0, prev.carbs - meal.carbs),
        fat: Math.max(0, prev.fat - meal.fat),
        meals: prev.meals.filter((item) => item.id !== meal.id),
      };
    });

    try {
      await fetch(`/api/meals/log?id=${meal.id}`, { method: "DELETE" });
    } finally {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["log", "today"] });
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-24 pt-8">
      <h1 className="font-display text-3xl text-text-primary">Today&apos;s log</h1>

      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex items-center gap-6">
          <MacroRing
            label="Calories"
            value={current.calories}
            target={targets.targetCalories}
            color="var(--accent)"
            unit="kcal"
            size={128}
            stroke={10}
          />
          <div className="flex-1 space-y-3">
            <ProgressBar
              label="Protein"
              value={current.protein}
              target={targets.targetProtein}
              color="var(--accent)"
              unit="g"
            />
            <ProgressBar
              label="Carbs"
              value={current.carbs}
              target={targets.targetCarbs}
              color="#4A90D9"
              unit="g"
            />
            <ProgressBar
              label="Fat"
              value={current.fat}
              target={targets.targetFat}
              color="#F5A623"
              unit="g"
            />
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              Quick add
            </p>
            <p className="text-sm text-text-secondary">
              Log something you already ate.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                const next = !scannerOpen;
                setScannerOpen(next);
                if (next) {
                  void startScanner();
                }
              }}
              className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text-secondary"
            >
              {scannerOpen ? "Stop scan" : "Scan barcode"}
            </button>
            {scannerOpen ? (
              <div className="overflow-hidden rounded-md border border-border bg-black">
                <video
                  ref={videoRef}
                  className="h-48 w-full object-cover"
                  muted
                  playsInline
                />
              </div>
            ) : null}
            {scannerError ? (
              <p className="text-xs text-accent-text">{scannerError}</p>
            ) : scannerStatus === "scanning" ? (
              <p className="text-xs text-text-secondary">
                Point the camera at a barcode.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Enter barcode"
              inputMode="numeric"
              className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            <button
              type="button"
              onClick={() => {
                void lookupBarcode();
              }}
              disabled={barcodeStatus === "loading"}
              className="rounded-md border border-border px-4 py-3 text-sm text-text-secondary disabled:opacity-60"
            >
              {barcodeStatus === "loading" ? "Checking..." : "Lookup"}
            </button>
          </div>
          {barcodeMessage ? (
            <p
              className={`text-xs ${
                barcodeStatus === "found"
                  ? "text-green-text"
                  : barcodeStatus === "missing"
                    ? "text-text-secondary"
                    : "text-accent-text"
              }`}
            >
              {barcodeMessage}
            </p>
          ) : null}
          <input
            value={quickName}
            onChange={(event) => setQuickName(event.target.value)}
            placeholder="Meal name (optional)"
            className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={quickCalories}
              onChange={(event) => setQuickCalories(event.target.value)}
              placeholder="Calories"
              inputMode="numeric"
              className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            <input
              value={quickProtein}
              onChange={(event) => setQuickProtein(event.target.value)}
              placeholder="Protein (g)"
              inputMode="numeric"
              className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            <input
              value={quickCarbs}
              onChange={(event) => setQuickCarbs(event.target.value)}
              placeholder="Carbs (g)"
              inputMode="numeric"
              className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            <input
              value={quickFat}
              onChange={(event) => setQuickFat(event.target.value)}
              placeholder="Fat (g)"
              inputMode="numeric"
              className="w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
          </div>
          {quickError ? (
            <p className="text-xs text-accent-text">{quickError}</p>
          ) : null}
          <button
            type="button"
            onClick={submitQuickAdd}
            disabled={quickSubmitting}
            className="w-full rounded-md bg-accent px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {quickSubmitting ? "Logging..." : "Add to log"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-primary">Meals logged</h2>
        {isLoading ? (
          <div className="rounded-card border border-border bg-surface-2 p-4 text-sm text-text-tertiary">
            Loading today&apos;s log...
          </div>
        ) : current.meals.length ? (
          <div className="space-y-3">
            {current.meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-card border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent-text">
                    {meal.mealName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {meal.mealName}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(meal.loggedAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-text-secondary">
                    {meal.calories} kcal
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMeal(meal)}
                    disabled={deleting === meal.id}
                    className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border bg-surface-2 p-4 text-sm text-text-tertiary">
            No meals logged yet. Swipe right to add one.
          </div>
        )}
      </section>

      <section className="rounded-card border border-border bg-surface-2 p-4 text-sm text-text-secondary">
        {remainingMessage}
      </section>
    </main>
  );
}
