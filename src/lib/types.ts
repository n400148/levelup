export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      body_scans: {
        Row: {
          advanced: Json | null;
          bf: number | null;
          date: string;
          device: string;
          device_label: string | null;
          goal_bf: number | null;
          height: number | null;
          id: number;
          lmm: number | null;
          user_id: string;
          weight: number | null;
        };
        Insert: {
          advanced?: Json | null;
          bf?: number | null;
          date: string;
          device?: string;
          device_label?: string | null;
          goal_bf?: number | null;
          height?: number | null;
          id?: never;
          lmm?: number | null;
          user_id: string;
          weight?: number | null;
        };
        Update: {
          advanced?: Json | null;
          bf?: number | null;
          date?: string;
          device?: string;
          device_label?: string | null;
          goal_bf?: number | null;
          height?: number | null;
          id?: never;
          lmm?: number | null;
          user_id?: string;
          weight?: number | null;
        };
        Relationships: [];
      };
      nutrition: {
        Row: {
          calories: number | null;
          carbs: number | null;
          date: string;
          fats: number | null;
          protein: number | null;
          user_id: string;
          water: number | null;
        };
        Insert: {
          calories?: number | null;
          carbs?: number | null;
          date: string;
          fats?: number | null;
          protein?: number | null;
          user_id: string;
          water?: number | null;
        };
        Update: {
          calories?: number | null;
          carbs?: number | null;
          date?: string;
          fats?: number | null;
          protein?: number | null;
          user_id?: string;
          water?: number | null;
        };
        Relationships: [];
      };
      peptides: {
        Row: {
          dose: number | null;
          end_date: string | null;
          freq: string | null;
          id: number;
          name: string;
          notes: string | null;
          start_date: string | null;
          unit: string | null;
          user_id: string;
        };
        Insert: {
          dose?: number | null;
          end_date?: string | null;
          freq?: string | null;
          id?: never;
          name: string;
          notes?: string | null;
          start_date?: string | null;
          unit?: string | null;
          user_id: string;
        };
        Update: {
          dose?: number | null;
          end_date?: string | null;
          freq?: string | null;
          id?: never;
          name?: string;
          notes?: string | null;
          start_date?: string | null;
          unit?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      supplements: {
        Row: {
          dose: number | null;
          end_date: string | null;
          freq: string | null;
          id: number;
          name: string;
          notes: string | null;
          start_date: string | null;
          unit: string | null;
          user_id: string;
        };
        Insert: {
          dose?: number | null;
          end_date?: string | null;
          freq?: string | null;
          id?: never;
          name: string;
          notes?: string | null;
          start_date?: string | null;
          unit?: string | null;
          user_id: string;
        };
        Update: {
          dose?: number | null;
          end_date?: string | null;
          freq?: string | null;
          id?: never;
          name?: string;
          notes?: string | null;
          start_date?: string | null;
          unit?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_goals: {
        Row: {
          goals: Json | null;
          user_id: string;
        };
        Insert: {
          goals?: Json | null;
          user_id: string;
        };
        Update: {
          goals?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      weights: {
        Row: {
          date: string;
          user_id: string;
          weight: number;
        };
        Insert: {
          date: string;
          user_id: string;
          weight: number;
        };
        Update: {
          date?: string;
          user_id?: string;
          weight?: number;
        };
        Relationships: [];
      };
      workout_logs: {
        Row: {
          date: string;
          day: string | null;
          exercises: Json | null;
          id: number;
          split: string | null;
          user_id: string;
        };
        Insert: {
          date: string;
          day?: string | null;
          exercises?: Json | null;
          id?: never;
          split?: string | null;
          user_id: string;
        };
        Update: {
          date?: string;
          day?: string | null;
          exercises?: Json | null;
          id?: never;
          split?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_plans: {
        Row: {
          plans: Json | null;
          user_id: string;
        };
        Insert: {
          plans?: Json | null;
          user_id: string;
        };
        Update: {
          plans?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// ============================================================================
// App-level domain types (camelCase). These are what components work with.
// The mapping layer (lib/mapping.ts) is the ONLY place that translates
// between these and the snake_case DB rows above.
// ============================================================================

export type Split =
  | "Push"
  | "Pull"
  | "Legs"
  | "Core"
  | "Cardio"
  | "Full Body"
  | "Upper"
  | "Lower"
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Arms"
  | "Chest & Back"
  | "Shoulders & Arms";

export const SPLITS: Split[] = [
  "Push",
  "Pull",
  "Legs",
  "Core",
  "Cardio",
  "Full Body",
  "Upper",
  "Lower",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Chest & Back",
  "Shoulders & Arms",
];

export type SplitProgram = "PPL" | "UPPER_LOWER" | "BRO_SPLIT" | "ARNOLD" | "FULL_BODY" | "CUSTOM";

export interface CustomSplit {
  name: string;
  days: Split[];
}

export type RotationSlot = "cycle" | "rest";

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface LoggedSet {
  weight: number;
  reps: number;
  effort?: number;
  warmup?: boolean;
  failed?: boolean;
}

export interface LoggedExercise {
  name: string;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  id?: number;
  date: string;
  split: Split;
  day: string;
  exercises: LoggedExercise[];
}

export interface PlanExercise {
  name: string;
  /** Working sets planned for a guided session (default 3 if unset). */
  targetSets?: number;
  /** Warmup sets before the working sets (default 0 if unset). */
  warmupSets?: number;
  /** Rest between sets in a guided session, in seconds. Omit for no timer. */
  restSeconds?: number;
  /** Superset partner — done immediately after this exercise each round,
   * with the round's rest only taken after both are done. */
  pairedWith?: string;
}

export type DayPlan = Record<string, PlanExercise[]>; // dayLabel -> exercises
export type WorkoutPlans = Partial<Record<Split, DayPlan>>;

export interface NutritionEntry {
  date: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  water: number | null;
}

export type ScanDevice =
  | "DEXA"
  | "HYDROSTATIC"
  | "HUME"
  | "BODPOD"
  | "CALIPERS"
  | "NAVY_TAPE"
  | "INBODY"
  | "EVOLT"
  | "BIA_SCALE"
  | "OTHER";

// Optional multi-frequency BIA / advanced scan readout fields (Evolt 360,
// InBody, and similar devices report some subset of these). All optional
// since no two devices report the same set. Values are stored as entered —
// only bf/waistToHipRatio/visceralFatLevel/bmr have a defensible reference
// range to rate against (see lib/health-ranges.ts); the rest are logged
// as plain numbers with no fabricated "normal range".
export interface AdvancedScanData {
  skeletalMuscleMass?: number | null;
  proteinMass?: number | null;
  mineralMass?: number | null;
  totalBodyWater?: number | null;
  bodyFatMass?: number | null;
  subcutaneousFatMass?: number | null;
  visceralFatMass?: number | null;
  visceralFatLevel?: number | null;
  visceralFatArea?: number | null;
  icf?: number | null;
  ecf?: number | null;
  bmr?: number | null;
  tee?: number | null;
  bioAge?: number | null;
  bwiScore?: number | null;
  waistToHipRatio?: number | null;
  abdominalCircumference?: number | null;
  leftArmLean?: number | null;
  leftArmFat?: number | null;
  rightArmLean?: number | null;
  rightArmFat?: number | null;
  torsoLean?: number | null;
  torsoFat?: number | null;
  leftLegLean?: number | null;
  leftLegFat?: number | null;
  rightLegLean?: number | null;
  rightLegFat?: number | null;
}

export interface BodyScan {
  id?: number;
  date: string;
  weight: number | null;
  bf: number | null;
  lmm: number | null;
  height: number | null;
  goalBf: number | null;
  device: ScanDevice;
  deviceLabel: string | null;
  advanced: AdvancedScanData | null;
}

export type StackKind = "peptide" | "supplement";

export interface StackItem {
  id?: number;
  name: string;
  dose: number | null;
  unit: string | null;
  freq: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
}

export type PrimaryGoal =
  | "Fat Loss"
  | "Muscle Gain"
  | "Recomp"
  | "Strength"
  | "Endurance"
  | "Maintain";

export interface LiftGoal {
  id: string;
  exercise: string;
  currentMax: number;
  targetMax: number;
  unit: "lb" | "kg";
  deadline?: string;
}

export type Sex = "male" | "female";

export interface UserGoals {
  primaryGoal: PrimaryGoal | null;
  targetBf: number | null;
  targetLeanMass: number | null;
  targetBodyweight: number | null;
  liftGoals: LiftGoal[];
  sex: Sex | null;
  birthYear: number | null;
  splitProgram: SplitProgram | null;
  customSplit: CustomSplit | null;
  /**
   * For PPL/Upper-Lower: the rotation pattern as a sequence of cycle/rest
   * slots, e.g. ["cycle","rest","cycle","rest"] for "UL Rest UL Rest", or
   * ["cycle","cycle","rest"] for "PPL PPL Rest". Each "cycle" expands to
   * the program's full day list (e.g. Upper, Lower) when displayed.
   */
  rotation: RotationSlot[] | null;
}
