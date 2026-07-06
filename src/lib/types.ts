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
  | "Lower";

export const SPLITS: Split[] = [
  "Push",
  "Pull",
  "Legs",
  "Core",
  "Cardio",
  "Full Body",
  "Upper",
  "Lower",
];

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface LoggedSet {
  weight: number;
  reps: number;
  effort?: number;
  warmup?: boolean;
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

export interface UserGoals {
  primaryGoal: PrimaryGoal | null;
  targetBf: number | null;
  targetLeanMass: number | null;
  targetBodyweight: number | null;
  liftGoals: LiftGoal[];
}
