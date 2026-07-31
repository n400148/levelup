import type { LoggedSet, WorkoutLog } from "@/lib/types";

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

export type ExerciseCategory = "compound" | "isolation" | "general";

// Best-effort classification from a free-typed exercise name — there's no
// exercise library backing this app, so this is pattern matching on common
// naming, not a lookup table. Isolation movements are checked first since a
// few (leg extension, calf raise) would otherwise trip the compound pattern.
const ISOLATION_PATTERN =
  /curl|extension|fly(e)?s?\b|raise|pushdown|push-down|kickback|pullover|crunch|preacher|concentration|pec.?deck|cable.?cross|face pull|reverse fly|lateral|delt/i;

const COMPOUND_PATTERN =
  /squat|deadlift|bench press|overhead press|military press|shoulder press|\brow\b|pull-?up|chin-?up|\bdip\b|clean|snatch|hip thrust|lunge|leg press|good morning|thruster|front squat|back squat/i;

export function classifyExercise(exerciseName: string): ExerciseCategory {
  if (ISOLATION_PATTERN.test(exerciseName)) return "isolation";
  if (COMPOUND_PATTERN.test(exerciseName)) return "compound";
  return "general";
}

/**
 * Rep-range targets in the absence of an explicit override, following
 * evidence-based hypertrophy guidance (Jeff Nippard and similar): heavy
 * compounds are kept lower-rep since the absolute loads and joint/CNS
 * fatigue get punishing well before failure at high reps, while isolation
 * work is pushed higher-rep since it's mechanically harder to keep adding
 * weight to and safer to take closer to failure.
 */
export function autoRepRangeFor(exerciseName: string): [number, number] {
  const category = classifyExercise(exerciseName);
  if (category === "compound") return [6, 8];
  if (category === "isolation") return [10, 15];
  return [8, 12];
}

export function repRangeFor(
  exerciseName: string,
  override?: { repRangeLo?: number; repRangeHi?: number },
): [number, number] {
  if (override?.repRangeLo && override?.repRangeHi) return [override.repRangeLo, override.repRangeHi];
  return autoRepRangeFor(exerciseName);
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
  currentSets: LoggedSet[] = [],
  override?: { repRangeLo?: number; repRangeHi?: number },
): ProgressionResult {
  const [lo, hi] = repRangeFor(exerciseName, override);
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
