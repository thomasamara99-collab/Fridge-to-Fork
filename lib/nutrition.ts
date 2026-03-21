export function calculateTDEE(profile: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: string;
  activityLevel: string;
}): number {
  const bmr =
    profile.sex === "male"
      ? 10 * profile.weightKg +
        6.25 * profile.heightCm -
        5 * profile.age +
        5
      : 10 * profile.weightKg +
        6.25 * profile.heightCm -
        5 * profile.age -
        161;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * (multipliers[profile.activityLevel] ?? 1.2));
}

export function suggestMacros(tdee: number, goal: string, weightKg: number) {
  const goalCalories =
    {
      cut: tdee - 400,
      maintain: tdee,
      bulk: tdee + 300,
    }[goal] ?? tdee;

  const protein = Math.round(weightKg * 2.2);
  const fat = Math.round((goalCalories * 0.25) / 9);
  const carbs = Math.round((goalCalories - protein * 4 - fat * 9) / 4);

  return { calories: goalCalories, protein, carbs, fat };
}

export function macroCalories(p: number, c: number, f: number): number {
  return p * 4 + c * 4 + f * 9;
}
