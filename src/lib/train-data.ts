import { SPLITS, type Split, type SplitProgram } from "@/lib/types";

export type MuscleKey =
  | "chest"
  | "frontDelts"
  | "rearDelts"
  | "triceps"
  | "biceps"
  | "lats"
  | "upperBack"
  | "abs"
  | "obliques"
  | "quads"
  | "hams"
  | "glutes"
  | "calves";

export const SPLIT_MUSCLES: Record<Split, MuscleKey[]> = {
  Push: ["chest", "frontDelts", "triceps"],
  Pull: ["lats", "upperBack", "biceps", "rearDelts"],
  Legs: ["quads", "hams", "glutes", "calves"],
  Core: ["abs", "obliques"],
  Cardio: [],
  "Full Body": [
    "chest",
    "frontDelts",
    "triceps",
    "lats",
    "upperBack",
    "biceps",
    "abs",
    "quads",
    "hams",
    "glutes",
    "calves",
  ],
  Upper: ["chest", "frontDelts", "rearDelts", "triceps", "lats", "upperBack", "biceps"],
  Lower: ["quads", "hams", "glutes", "calves"],
  Chest: ["chest"],
  Back: ["lats", "upperBack"],
  Shoulders: ["frontDelts", "rearDelts"],
  Arms: ["biceps", "triceps"],
  "Chest & Back": ["chest", "lats", "upperBack"],
  "Shoulders & Arms": ["frontDelts", "rearDelts", "biceps", "triceps"],
};

export const SPLIT_PRESETS: Record<Split, string[]> = {
  Push: ["Bench Press", "Overhead Press", "Incline DB Press", "Lateral Raise", "Triceps Pushdown", "Dips"],
  Pull: ["Deadlift", "Pull-Up", "Barbell Row", "Lat Pulldown", "Face Pull", "Barbell Curl"],
  Legs: ["Back Squat", "Romanian Deadlift", "Leg Press", "Walking Lunge", "Leg Curl", "Calf Raise"],
  Core: ["Hanging Leg Raise", "Cable Crunch", "Plank", "Russian Twist", "Ab Wheel Rollout"],
  Cardio: ["Incline Walk", "Rowing Machine", "Assault Bike", "Jump Rope", "Stair Climber"],
  "Full Body": ["Squat", "Bench Press", "Deadlift", "Overhead Press", "Barbell Row"],
  Upper: ["Bench Press", "Barbell Row", "Overhead Press", "Pull-Up", "Barbell Curl", "Triceps Pushdown"],
  Lower: ["Back Squat", "Romanian Deadlift", "Leg Press", "Walking Lunge", "Calf Raise"],
  Chest: ["Bench Press", "Incline DB Press", "Cable Fly", "Dips", "Push-Up"],
  Back: ["Deadlift", "Pull-Up", "Barbell Row", "Lat Pulldown", "Seated Cable Row"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Rear Delt Fly", "Face Pull", "Upright Row"],
  Arms: ["Barbell Curl", "Triceps Pushdown", "Hammer Curl", "Skull Crusher", "Dips"],
  "Chest & Back": ["Bench Press", "Barbell Row", "Pull-Up", "Incline DB Press", "Lat Pulldown"],
  "Shoulders & Arms": ["Overhead Press", "Barbell Curl", "Lateral Raise", "Triceps Pushdown", "Face Pull"],
};

export interface ProgramMeta {
  id: SplitProgram;
  label: string;
  blurb: string;
  days: Split[];
}

// Cardio/Core aren't tied to any one program — always available as an
// add-on day regardless of which split program is active.
export const UNIVERSAL_SPLITS: Split[] = ["Cardio", "Core"];

// The building-block day types a custom split can be assembled from —
// everything except the universal add-ons, which are already included
// automatically.
export const CUSTOMIZABLE_SPLITS: Split[] = SPLITS.filter((s) => !UNIVERSAL_SPLITS.includes(s));

export const PROGRAMS: ProgramMeta[] = [
  { id: "PPL", label: "Push / Pull / Legs", blurb: "3-day rotation by movement pattern", days: ["Push", "Pull", "Legs"] },
  {
    id: "UPPER_LOWER",
    label: "Upper / Lower",
    blurb: "2-day rotation, higher frequency per muscle",
    days: ["Upper", "Lower"],
  },
  {
    id: "BRO_SPLIT",
    label: "Bro Split",
    blurb: "5-day rotation, one muscle group per day",
    days: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  },
  {
    id: "ARNOLD",
    label: "Arnold Split",
    blurb: "6-day rotation popularized by Arnold Schwarzenegger",
    days: ["Chest & Back", "Shoulders & Arms", "Legs"],
  },
  { id: "FULL_BODY", label: "Full Body", blurb: "Train everything each session", days: ["Full Body"] },
  { id: "CUSTOM", label: "Custom Split", blurb: "Name it and pick your own days", days: [] },
];

export function getProgram(id: SplitProgram | null): ProgramMeta | undefined {
  return PROGRAMS.find((p) => p.id === id);
}
