import type { Split } from "@/lib/types";

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
};
