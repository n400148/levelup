import type { PrimaryGoal } from "@/lib/types";

export interface MacroTargets {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  waterOz: number;
  leanMassLb: number;
  isScanBased: boolean;
}

// kcal per lb of total bodyweight, by goal — Nippard/Ethier/Helms-style
// maintenance-multiplier heuristics, tuned toward the middle of published
// ranges rather than any one individual's exact TDEE.
function goalCalorieFactor(goal: PrimaryGoal | null): number {
  switch (goal) {
    case "Fat Loss":
      return 11.5;
    case "Recomp":
    case "Maintain":
    case "Endurance":
      return 14;
    case "Strength":
      return 15;
    case "Muscle Gain":
      return 16.5;
    default:
      return 14;
  }
}

// Used only when no body-scan lean-mass reading exists yet.
const ASSUMED_LEAN_FRACTION = 0.8;

export function calculateMacros(
  bodyweightLb: number,
  goal: PrimaryGoal | null,
  scanLeanMassLb: number | null,
): MacroTargets {
  const isScanBased = !!scanLeanMassLb && scanLeanMassLb > 0;
  const leanMassLb = isScanBased ? (scanLeanMassLb as number) : bodyweightLb * ASSUMED_LEAN_FRACTION;

  const calories = Math.round(bodyweightLb * goalCalorieFactor(goal));
  const proteinG = Math.round(leanMassLb * 1);
  const fatG = Math.round(bodyweightLb * 0.35);
  const remaining = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remaining / 4));
  const waterOz = Math.round(bodyweightLb * 1);

  return {
    calories,
    proteinG,
    fatG,
    carbsG,
    waterOz,
    leanMassLb: Math.round(leanMassLb),
    isScanBased,
  };
}
