import type { LoggedSet, PrimaryGoal, WorkoutLog } from "@/lib/types";

export type ProgressionStatus = "add_weight" | "beat_reps" | "on_track" | "no_data";

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
 *
 * `currentSets` is whatever has already been logged for this exercise in the
 * session that's currently in progress (manual or guided) — without it, the
 * card only ever describes the *last* session, which reads as flatly wrong
 * once the lifter has already acted on it this time (e.g. it says "you hit
 * 12 reps, add weight" while the sets right below it show a heavier weight
 * for fewer reps, because that's exactly what following the advice looks
 * like). When the current session's top weight already exceeds last
 * session's, this returns an "on_track" confirmation instead of repeating
 * stale advice.
 */
export function getProgressionForExercise(
  allLogs: WorkoutLog[],
  exerciseName: string,
  goal: PrimaryGoal | null,
  currentSets: LoggedSet[] = [],
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

  const loggedThisSession = currentSets.filter((s) => s.weight > 0 && s.reps > 0);
  const currentTopWeight = loggedThisSession.length ? Math.max(...loggedThisSession.map((s) => s.weight)) : 0;
  const alreadyIncreased = currentTopWeight > topWeight;

  if (allHitTop) {
    let increment = Math.max(flatIncrement, Math.round((topWeight * pctIncrement) / 2.5) * 2.5);
    const weeklyCap = topWeight * 0.1;
    if (increment > weeklyCap) increment = Math.round(weeklyCap / 2.5) * 2.5;
    const suggestedWeight = topWeight + Math.max(2.5, increment);

    if (alreadyIncreased) {
      return {
        status: "on_track",
        repRangeLabel,
        lastSessionDate: last.date,
        lastWeight: topWeight,
        suggestedWeight,
        message: `Already up to ${currentTopWeight} lb this session (last time was ${topWeight} lb for ${hi}+ reps) — work back toward ${hi} reps here.`,
      };
    }

    return {
      status: "add_weight",
      repRangeLabel,
      lastSessionDate: last.date,
      lastWeight: topWeight,
      suggestedWeight,
      message: `Last session you hit ${hi}+ reps on every set at ${topWeight} lb — try ~${suggestedWeight} lb today.`,
    };
  }

  if (alreadyIncreased) {
    return {
      status: "on_track",
      repRangeLabel,
      lastSessionDate: last.date,
      lastWeight: topWeight,
      message: `Already up to ${currentTopWeight} lb this session, up from ${topWeight} lb last time — focus on working toward ${hi} reps per set.`,
    };
  }

  return {
    status: "beat_reps",
    repRangeLabel,
    lastSessionDate: last.date,
    lastWeight: topWeight,
    message: `Last session you stayed at ${topWeight} lb — beat your reps first, working toward ${hi} on every set before adding load.`,
  };
}

export const PROGRESSION_DISCLAIMER =
  "General double-progression guidance based on your logged sets — not a substitute for individualized coaching. Adjust for your own recovery and form.";
