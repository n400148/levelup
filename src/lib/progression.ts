import type { PrimaryGoal, WorkoutLog } from "@/lib/types";

export type ProgressionStatus = "add_weight" | "beat_reps" | "no_data";

export interface ProgressionResult {
  status: ProgressionStatus;
  repRangeLabel: string;
  lastSessionDate?: string;
  lastWeight?: number;
  suggestedWeight?: number;
  message: string;
}

const LOWER_BODY_PATTERN =
  /squat|deadlift|leg press|lunge|hip thrust|calf|leg curl|leg extension|glute|rdl|romanian|good morning/i;

export function repRangeFor(goal: PrimaryGoal | null): [number, number] {
  return goal === "Strength" ? [4, 6] : [8, 12];
}

/**
 * Evidence-based double progression: climb reps to the top of the range at a
 * given weight before adding load. Increment size scales with whether the
 * lift is lower-body (bigger muscles tolerate bigger jumps) and is capped
 * under a 10% week-over-week jump.
 */
export function getProgressionForExercise(
  allLogs: WorkoutLog[],
  exerciseName: string,
  goal: PrimaryGoal | null,
): ProgressionResult {
  const [lo, hi] = repRangeFor(goal);
  const repRangeLabel = `${lo}-${hi} reps`;

  const sessions = allLogs
    .filter((log) => log.exercises.some((e) => e.name.toLowerCase() === exerciseName.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sessions.length === 0) {
    return {
      status: "no_data",
      repRangeLabel,
      message: "Log this exercise once to start getting progression reminders.",
    };
  }

  const last = sessions[sessions.length - 1];
  const exercise = last.exercises.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase())!;
  const sets = exercise.sets.filter((s) => s.weight > 0 && s.reps > 0);

  if (sets.length === 0) {
    return {
      status: "no_data",
      repRangeLabel,
      message: "Log full sets (weight + reps) to get a progression reminder.",
    };
  }

  const topWeight = Math.max(...sets.map((s) => s.weight));
  const setsAtTopWeight = sets.filter((s) => s.weight === topWeight);
  const allHitTop = setsAtTopWeight.every((s) => s.reps >= hi);
  const lowerBody = LOWER_BODY_PATTERN.test(exerciseName);
  const pctIncrement = lowerBody ? 0.05 : 0.025;
  const flatIncrement = lowerBody ? 10 : 5;

  if (allHitTop) {
    let increment = Math.max(flatIncrement, Math.round((topWeight * pctIncrement) / 2.5) * 2.5);
    const weeklyCap = topWeight * 0.1;
    if (increment > weeklyCap) increment = Math.round(weeklyCap / 2.5) * 2.5;
    const suggestedWeight = topWeight + Math.max(2.5, increment);

    return {
      status: "add_weight",
      repRangeLabel,
      lastSessionDate: last.date,
      lastWeight: topWeight,
      suggestedWeight,
      message: `You hit ${hi}+ reps on every set at ${topWeight} lb — time to add weight. Try ~${suggestedWeight} lb next session.`,
    };
  }

  return {
    status: "beat_reps",
    repRangeLabel,
    lastSessionDate: last.date,
    lastWeight: topWeight,
    message: `Stay at ${topWeight} lb and beat your reps first — work toward ${hi} reps on every set before adding load.`,
  };
}

export const PROGRESSION_DISCLAIMER =
  "General double-progression guidance based on your logged sets — not a substitute for individualized coaching. Adjust for your own recovery and form.";
