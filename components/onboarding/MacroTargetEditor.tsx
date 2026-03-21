"use client";

import MacroSlider from "../ui/MacroSlider";
import { macroCalories } from "../../lib/nutrition";

type MacroTargetEditorProps = {
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  onCaloriesChange: (value: number) => void;
  onProteinChange: (value: number) => void;
  onCarbsChange: (value: number) => void;
  onFatChange: (value: number) => void;
  disabled?: boolean;
};

export default function MacroTargetEditor({
  targetCalories,
  protein,
  carbs,
  fat,
  onCaloriesChange,
  onProteinChange,
  onCarbsChange,
  onFatChange,
  disabled,
}: MacroTargetEditorProps) {
  const totalMacroCalories = macroCalories(protein, carbs, fat);
  const delta = Math.abs(totalMacroCalories - targetCalories);
  const withinRange = delta <= 50;

  return (
    <div className="space-y-5 rounded-card border border-border bg-surface p-5">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Target calories
        </p>
        <input
          type="number"
          disabled={disabled}
          value={targetCalories}
          onChange={(event) => onCaloriesChange(Number(event.target.value))}
          className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-center text-2xl font-display text-text-primary outline-none focus:border-accent focus:bg-white"
        />
        <p className="text-xs text-text-tertiary">kcal per day</p>
      </div>

      <MacroSlider
        label="Protein"
        value={protein}
        min={40}
        max={240}
        onChange={onProteinChange}
      />
      <MacroSlider
        label="Carbs"
        value={carbs}
        min={40}
        max={320}
        onChange={onCarbsChange}
      />
      <MacroSlider
        label="Fat"
        value={fat}
        min={20}
        max={140}
        onChange={onFatChange}
      />

      <div
        className={`rounded-md px-3 py-2 text-xs ${
          withinRange
            ? "bg-green-light text-green-text"
            : "bg-yellow-light text-text-secondary"
        }`}
      >
        Macro total: {totalMacroCalories} kcal
        {withinRange ? " · Looks aligned" : " · Adjust macros to match"}
      </div>
    </div>
  );
}
