import type {
  BodyScan,
  Database,
  NutritionEntry,
  StackItem,
  WeightEntry,
  WorkoutLog,
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
export function workoutLogFromRow(row: WorkoutLogRow): WorkoutLog {
  return {
    id: row.id,
    date: row.date,
    split: (row.split ?? "Full Body") as WorkoutLog["split"],
    day: row.day ?? "A",
    exercises: (row.exercises as unknown as WorkoutLog["exercises"]) ?? [],
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
