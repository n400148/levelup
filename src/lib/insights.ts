import type { BodyScan, NutritionEntry, StackItem, UserGoals, WeightEntry, WorkoutLog } from "@/lib/types";
import { calculateMacros } from "@/lib/macros";
import { daysBetween, todayISO } from "@/lib/date";

export interface InsightRow {
  label: string;
  value: string;
}

export function weightTrendInsight(weights: WeightEntry[]): InsightRow {
  if (weights.length < 2) {
    return { label: "Weight Trend", value: "Log a few more weigh-ins to see a trend." };
  }
  const recent = weights.slice(-30);
  const delta = recent[recent.length - 1].weight - recent[0].weight;
  const days = daysBetween(recent[0].date, recent[recent.length - 1].date) || 1;
  const direction = delta === 0 ? "holding steady" : delta > 0 ? "up" : "down";
  return {
    label: "Weight Trend",
    value:
      delta === 0
        ? `Holding steady over the last ${days} days.`
        : `${direction === "up" ? "Up" : "Down"} ${Math.abs(delta).toFixed(1)} lb over the last ${days} days.`,
  };
}

export function trainingFrequencyInsight(logs: WorkoutLog[]): InsightRow {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const distinctDates = new Set(logs.filter((l) => l.date >= cutoffIso).map((l) => l.date));
  const count = distinctDates.size;
  return {
    label: "Training Frequency",
    value: `${count} session${count === 1 ? "" : "s"} logged in the last 7 days.`,
  };
}

export function nutritionCalibrationInsight(
  entries: NutritionEntry[],
  bodyweight: number | null,
  goal: UserGoals["primaryGoal"],
  leanMass: number | null,
): InsightRow {
  const recent = entries.slice(-7).filter((e) => e.calories != null);
  if (recent.length === 0 || !bodyweight) {
    return { label: "Nutrition Calibration", value: "Log a few days of intake to see how you compare to target." };
  }
  const avg = Math.round(recent.reduce((sum, e) => sum + (e.calories ?? 0), 0) / recent.length);
  const target = calculateMacros(bodyweight, goal, leanMass).calories;
  const diff = avg - target;
  const pct = Math.abs(diff) / target;
  const calibration = pct < 0.05 ? "on target" : diff > 0 ? "above target" : "below target";
  return {
    label: "Nutrition Calibration",
    value: `Averaging ~${avg} kcal over the last ${recent.length} logged days vs a ${target} kcal target — ${calibration}.`,
  };
}

export function stackSummaryInsight(peptides: StackItem[], supplements: StackItem[]): InsightRow {
  const today = todayISO();
  const activeP = peptides.filter((p) => !p.endDate || p.endDate >= today).length;
  const activeS = supplements.filter((s) => !s.endDate || s.endDate >= today).length;
  if (activeP === 0 && activeS === 0) {
    return { label: "Active Stack", value: "No active peptides or supplements logged." };
  }
  return {
    label: "Active Stack",
    value: `${activeP} peptide${activeP === 1 ? "" : "s"}, ${activeS} supplement${activeS === 1 ? "" : "s"} active.`,
  };
}

export function goalSummaryInsight(goals: UserGoals): InsightRow {
  if (!goals.primaryGoal && goals.liftGoals.length === 0) {
    return { label: "Goal Summary", value: "No goals set yet — visit the Goals tab to set one." };
  }
  const parts: string[] = [];
  if (goals.primaryGoal) parts.push(`Primary goal: ${goals.primaryGoal}`);
  if (goals.liftGoals.length) parts.push(`${goals.liftGoals.length} lift goal${goals.liftGoals.length === 1 ? "" : "s"} tracked`);
  return { label: "Goal Summary", value: parts.join(" · ") };
}

export function latestScanInsight(scans: BodyScan[]): InsightRow {
  const latest = scans[scans.length - 1];
  if (!latest) return { label: "Latest Scan", value: "No body scans logged yet." };
  return {
    label: "Latest Scan",
    value: `${latest.bf?.toFixed(1) ?? "–"}% body fat via ${latest.device} on ${latest.date}.`,
  };
}
