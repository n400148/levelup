import type {
  AdvancedScanData,
  BodyScan,
  Database,
  LoggedExercise,
  LoggedSet,
  NutritionEntry,
  PlanExercise,
  StackItem,
  WeightEntry,
  WorkoutLog,
  WorkoutPlans,
} from "@/lib/types";

// Every read/write of these 8 tables MUST go through the functions in this
// file. Components never construct a row object by hand — this is the one
// place that knows the DB column names, so a camelCase/snake_case typo can't
// silently drift into a lost write again.

type BodyScanRow = Database["public"]["Tables"]["body_scans"]["Row"];
type BodyScanInsert = Database["public"]["Tables"]["body_scans"]["Insert"];
type NutritionRow = Database["public"]["Tables"]["nutrition"]["Row"];
type PeptideRow = Database["public"]["Tables"]["peptides"]["Row"];
type PeptideInsert = Database["public"]["Tables"]["peptides"]["Insert"];
type WeightRow = Database["public"]["Tables"]["weights"]["Row"];
type WorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];
type WorkoutLogInsert = Database["public"]["Tables"]["workout_logs"]["Insert"];

// ---------- weights ----------
export function weightFromRow(row: WeightRow): WeightEntry {
  return { date: row.date, weight: Number(row.weight) };
}
export function weightToRow(userId: string, entry: WeightEntry): Database["public"]["Tables"]["weights"]["Insert"] {
  return { user_id: userId, date: entry.date, weight: entry.weight };
}

// ---------- nutrition ----------
export function nutritionFromRow(row: NutritionRow): NutritionEntry {
  return {
    date: row.date,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fats: row.fats,
    water: row.water,
  };
}
export function nutritionToRow(
  userId: string,
  entry: NutritionEntry,
): Database["public"]["Tables"]["nutrition"]["Insert"] {
  return {
    user_id: userId,
    date: entry.date,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fats: entry.fats,
    water: entry.water,
  };
}

// ---------- body_scans ----------
const ADVANCED_SCAN_KEYS: (keyof AdvancedScanData)[] = [
  "skeletalMuscleMass",
  "proteinMass",
  "mineralMass",
  "totalBodyWater",
  "bodyFatMass",
  "subcutaneousFatMass",
  "visceralFatMass",
  "visceralFatLevel",
  "visceralFatArea",
  "icf",
  "ecf",
  "bmr",
  "tee",
  "bioAge",
  "bwiScore",
  "waistToHipRatio",
  "abdominalCircumference",
  "leftArmLean",
  "leftArmFat",
  "rightArmLean",
  "rightArmFat",
  "torsoLean",
  "torsoFat",
  "leftLegLean",
  "leftLegFat",
  "rightLegLean",
  "rightLegFat",
];

function sanitizeAdvancedScanData(raw: unknown): AdvancedScanData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;
  const result: AdvancedScanData = {};
  let hasAny = false;
  for (const key of ADVANCED_SCAN_KEYS) {
    const value = Number(src[key]);
    if (src[key] !== undefined && src[key] !== null && Number.isFinite(value)) {
      result[key] = value;
      hasAny = true;
    }
  }
  return hasAny ? result : null;
}

export function bodyScanFromRow(row: BodyScanRow): BodyScan {
  return {
    id: row.id,
    date: row.date,
    weight: row.weight,
    bf: row.bf,
    lmm: row.lmm,
    height: row.height,
    goalBf: row.goal_bf,
    device: row.device as BodyScan["device"],
    deviceLabel: row.device_label,
    advanced: sanitizeAdvancedScanData(row.advanced),
  };
}
export function bodyScanToRow(userId: string, scan: BodyScan): BodyScanInsert {
  return {
    user_id: userId,
    date: scan.date,
    weight: scan.weight,
    bf: scan.bf,
    lmm: scan.lmm,
    height: scan.height,
    goal_bf: scan.goalBf,
    device: scan.device,
    device_label: scan.deviceLabel,
    advanced: scan.advanced as never,
  };
}

// ---------- peptides / supplements (identical shape) ----------
export function stackItemFromRow(row: PeptideRow): StackItem {
  return {
    id: row.id,
    name: row.name,
    dose: row.dose,
    unit: row.unit,
    freq: row.freq,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
  };
}
export function stackItemToRow(userId: string, item: StackItem): PeptideInsert {
  return {
    user_id: userId,
    name: item.name,
    dose: item.dose,
    unit: item.unit,
    freq: item.freq,
    start_date: item.startDate,
    end_date: item.endDate,
    notes: item.notes,
  };
}

// ---------- workout_logs ----------
// Sanitizers below are defensive: this app previously stored looser shapes
// (plain-string exercise lists, string-typed set numbers). Rather than trust
// whatever is in the JSONB blob, normalize/drop anything malformed here so a
// stray legacy or partially-written row can never crash a page downstream.
function sanitizeSet(raw: unknown): LoggedSet | null {
  if (typeof raw !== "object" || raw === null) return null;
  const s = raw as Record<string, unknown>;
  const weight = Number(s.weight);
  const reps = Number(s.reps);
  const effort = s.effort !== undefined && s.effort !== "" ? Number(s.effort) : undefined;
  return {
    weight: Number.isFinite(weight) ? weight : 0,
    reps: Number.isFinite(reps) ? reps : 0,
    effort: effort !== undefined && Number.isFinite(effort) ? effort : undefined,
    warmup: s.warmup === true,
  };
}

function sanitizeExercises(raw: unknown): LoggedExercise[] {
  if (!Array.isArray(raw)) return [];
  const result: LoggedExercise[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const name = (entry as Record<string, unknown>).name;
    if (typeof name !== "string" || name.length === 0) continue;
    const sets = Array.isArray((entry as Record<string, unknown>).sets)
      ? ((entry as Record<string, unknown>).sets as unknown[]).map(sanitizeSet).filter((s): s is LoggedSet => s !== null)
      : [];
    result.push({ name, sets });
  }
  return result;
}

export function workoutLogFromRow(row: WorkoutLogRow): WorkoutLog {
  return {
    id: row.id,
    date: row.date,
    split: (row.split ?? "Full Body") as WorkoutLog["split"],
    day: row.day ?? "A",
    exercises: sanitizeExercises(row.exercises),
  };
}
export function workoutLogToRow(userId: string, log: WorkoutLog): WorkoutLogInsert {
  return {
    user_id: userId,
    date: log.date,
    split: log.split,
    day: log.day,
    exercises: log.exercises as unknown as WorkoutLogInsert["exercises"],
  };
}

// ---------- workout_plans ----------
// Older data stored each day's exercises as plain strings ("Bench Press")
// instead of { name: "Bench Press" } objects. Migrate that shape on read
// instead of crashing on it.
function sanitizePlanExercise(raw: unknown): PlanExercise | null {
  if (typeof raw === "string" && raw.length > 0) return { name: raw };
  if (typeof raw === "object" && raw !== null) {
    const r = raw as Record<string, unknown>;
    if (typeof r.name !== "string" || r.name.length === 0) return null;
    const targetSets = Number(r.targetSets);
    const warmupSets = Number(r.warmupSets);
    const restSeconds = Number(r.restSeconds);
    return {
      name: r.name,
      targetSets: Number.isFinite(targetSets) && targetSets > 0 ? targetSets : undefined,
      warmupSets: Number.isFinite(warmupSets) && warmupSets > 0 ? warmupSets : undefined,
      restSeconds: Number.isFinite(restSeconds) && restSeconds > 0 ? restSeconds : undefined,
    };
  }
  return null;
}

export function sanitizeWorkoutPlans(raw: unknown): WorkoutPlans {
  if (typeof raw !== "object" || raw === null) return {};
  const plans: WorkoutPlans = {};
  for (const [split, dayPlan] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof dayPlan !== "object" || dayPlan === null) continue;
    const days: Record<string, PlanExercise[]> = {};
    for (const [day, exercises] of Object.entries(dayPlan as Record<string, unknown>)) {
      if (!Array.isArray(exercises)) continue;
      days[day] = exercises.map(sanitizePlanExercise).filter((e): e is PlanExercise => e !== null);
    }
    (plans as Record<string, unknown>)[split] = days;
  }
  return plans;
}
