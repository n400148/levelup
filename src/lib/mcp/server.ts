import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bodyScanFromRow,
  nutritionFromRow,
  sanitizeWorkoutPlans,
  stackItemFromRow,
  weightFromRow,
  workoutLogFromRow,
  workoutLogToRow,
} from "@/lib/mapping";
import { getProgressionForExercise, repRangeFor } from "@/lib/progression";
import { getProgram, UNIVERSAL_SPLITS } from "@/lib/train-data";
import { WRITE_SCOPE } from "@/lib/mcp/scopes";
import { SPLITS, type PlanExercise, type Split, type UserGoals, type WorkoutPlans } from "@/lib/types";


function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

// Connections approved before write access existed only hold the read
// scope; they must re-approve rather than silently gaining write access.
function lacksWrite(authInfo: AuthInfo | undefined): boolean {
  return !authInfo?.scopes.includes(WRITE_SCOPE);
}
const NEEDS_WRITE =
  "This LiftCipher connection only has read access. Ask the user to disconnect and reconnect the LiftCipher connector in Claude's settings, then approve the new edit permission.";

const dateRangeShape = {
  startDate: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive lower bound."),
  endDate: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive upper bound."),
  limit: z.number().int().positive().max(500).optional().describe("Max rows to return, most recent first. Default varies by tool."),
};

const splitSchema = z.enum(SPLITS as [Split, ...Split[]]).describe("Training day type, e.g. Push, Pull, Legs, Upper, Lower.");
const dayLabelSchema = z
  .string()
  .regex(/^[A-Z0-9]{1,3}$/)
  .default("A")
  .describe('Day variant within the split: "A" unless the user has several variants (A, B, C...).');
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("ISO date YYYY-MM-DD.");

const planExerciseSchema = z.object({
  name: z.string().min(1).max(120),
  targetSets: z.number().int().min(1).max(20).optional().describe("Working sets (app default 3)."),
  warmupSets: z.number().int().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0).max(900).optional().describe("Rest between sets in the guided workout. Omit for no timer."),
  pairedWith: z.string().min(1).max(120).optional().describe("Superset partner done right after this exercise each round."),
  repRangeLo: z.number().int().min(1).max(50).optional(),
  repRangeHi: z.number().int().min(1).max(50).optional().describe("Omit both rep range bounds to let the app auto-pick by exercise type."),
});

const loggedSetSchema = z.object({
  weight: z.number().min(0).max(2000).describe("Load in lb (0 for bodyweight)."),
  reps: z.number().int().min(0).max(200),
  effort: z.number().int().min(1).max(10).optional().describe("RPE 1-10."),
  warmup: z.boolean().optional(),
  failed: z.boolean().optional().describe("Set taken to failure."),
});

function cleanPlanExercise(e: z.infer<typeof planExerciseSchema>): PlanExercise {
  const out: PlanExercise = { name: e.name.trim() };
  if (e.targetSets !== undefined) out.targetSets = e.targetSets;
  if (e.warmupSets) out.warmupSets = e.warmupSets;
  if (e.restSeconds) out.restSeconds = e.restSeconds;
  if (e.pairedWith?.trim()) out.pairedWith = e.pairedWith.trim();
  if (e.repRangeLo && e.repRangeHi) {
    out.repRangeLo = Math.min(e.repRangeLo, e.repRangeHi);
    out.repRangeHi = Math.max(e.repRangeLo, e.repRangeHi);
  }
  return out;
}

/**
 * Builds a fresh McpServer scoped to one authenticated LiftCipher user.
 * Every query is explicitly user_id-scoped (the admin client bypasses RLS)
 * and mapped through the same lib/mapping.ts functions the app's UI uses,
 * so what Claude reads and writes matches what the app shows.
 */
export function buildMcpServer(
  userId: string,
  admin: ReturnType<typeof createAdminClient> = createAdminClient(),
): McpServer {
  const server = new McpServer({ name: "liftcipher", version: "1.1.0" });

  async function loadGoals(): Promise<Partial<UserGoals>> {
    const { data, error } = await admin.from("user_goals").select("goals").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.goals as unknown as Partial<UserGoals> | null) ?? {};
  }

  async function loadPlans(): Promise<WorkoutPlans> {
    const { data, error } = await admin.from("workout_plans").select("plans").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return sanitizeWorkoutPlans(data?.plans ?? {});
  }

  async function savePlans(plans: WorkoutPlans) {
    const { error } = await admin
      .from("workout_plans")
      .upsert({ user_id: userId, plans: plans as never }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
  }

  function activeDays(goals: Partial<UserGoals>): Split[] {
    const programDays =
      goals.splitProgram === "CUSTOM" ? goals.customSplit?.days ?? [] : getProgram(goals.splitProgram ?? null)?.days ?? [];
    return [...programDays, ...UNIVERSAL_SPLITS.filter((s) => !programDays.includes(s))];
  }

  // ---------- read tools ----------

  server.registerTool(
    "get_weight_log",
    {
      title: "Get weight log",
      description: "Bodyweight entries over time (date + weight in lb), oldest to newest.",
      inputSchema: { ...dateRangeShape },
      annotations: { readOnlyHint: true },
    },
    async ({ startDate, endDate, limit }) => {
      let query = admin.from("weights").select("*").eq("user_id", userId).order("date", { ascending: false });
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
      const { data, error } = await query.limit(limit ?? 90);
      if (error) throw new Error(error.message);
      return textResult((data ?? []).slice().reverse().map(weightFromRow));
    },
  );

  server.registerTool(
    "get_nutrition_log",
    {
      title: "Get nutrition log",
      description: "Daily logged intake (calories, protein, carbs, fats, water), oldest to newest.",
      inputSchema: { ...dateRangeShape },
      annotations: { readOnlyHint: true },
    },
    async ({ startDate, endDate, limit }) => {
      let query = admin.from("nutrition").select("*").eq("user_id", userId).order("date", { ascending: false });
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
      const { data, error } = await query.limit(limit ?? 60);
      if (error) throw new Error(error.message);
      return textResult((data ?? []).slice().reverse().map(nutritionFromRow));
    },
  );

  server.registerTool(
    "get_workout_logs",
    {
      title: "Get workout logs",
      description: "Logged training sessions (date, split, day, exercises with sets/reps/weight), oldest to newest.",
      inputSchema: {
        ...dateRangeShape,
        split: z.string().optional().describe('Filter to one split, e.g. "Push", "Upper", "Legs".'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ startDate, endDate, limit, split }) => {
      let query = admin.from("workout_logs").select("*").eq("user_id", userId).order("date", { ascending: false });
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
      if (split) query = query.eq("split", split);
      const { data, error } = await query.limit(limit ?? 60);
      if (error) throw new Error(error.message);
      return textResult((data ?? []).slice().reverse().map(workoutLogFromRow));
    },
  );

  server.registerTool(
    "get_workout_plans",
    {
      title: "Get workout plans",
      description:
        "The standing workout plan: for each split and day variant, the planned exercises (sets, rep ranges, rest, supersets). `activeDays` lists the split days the user's current program shows in the app — plans for other splits exist but won't appear on the Train tab.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const [goals, plans] = await Promise.all([loadGoals(), loadPlans()]);
      return textResult({ splitProgram: goals.splitProgram ?? null, activeDays: activeDays(goals), plans });
    },
  );

  server.registerTool(
    "get_progression_suggestions",
    {
      title: "Get progression suggestions",
      description:
        "The app's own double-progression coaching for planned exercises: target rep range, last session's top weight, and whether to add weight (with a suggested load) or beat reps first. Use this as the basis for weight/rep recommendations so they match what the app's Train tab shows.",
      inputSchema: {
        split: splitSchema.optional().describe("Limit to one split's planned exercises. Omit for every active day."),
        exercises: z.array(z.string()).optional().describe("Specific exercise names instead of a whole split."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ split, exercises }) => {
      const [goals, plans, logsRes] = await Promise.all([
        loadGoals(),
        loadPlans(),
        admin.from("workout_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(300),
      ]);
      if (logsRes.error) throw new Error(logsRes.error.message);
      const logs = (logsRes.data ?? []).map(workoutLogFromRow);

      const planned = new Map<string, PlanExercise>();
      const splits = split ? [split] : activeDays(goals);
      for (const s of splits) {
        for (const list of Object.values(plans[s] ?? {})) {
          for (const pe of list) {
            planned.set(pe.name, pe);
            if (pe.pairedWith) planned.set(pe.pairedWith, { name: pe.pairedWith });
          }
        }
      }
      const names = exercises?.length ? exercises : [...planned.keys()];

      return textResult(
        names.map((name) => {
          const override = planned.get(name);
          const [lo, hi] = repRangeFor(name, override);
          const r = getProgressionForExercise(logs, name, [], override);
          return {
            exercise: name,
            repRange: `${lo}-${hi}`,
            status: r.status,
            lastSessionDate: r.lastSessionDate ?? null,
            lastTopWeight: r.lastWeight ?? null,
            suggestedWeight: r.suggestedWeight ?? null,
            advice: r.message,
          };
        }),
      );
    },
  );

  server.registerTool(
    "get_body_scans",
    {
      title: "Get body composition scans",
      description: "Body scan readings (weight, body fat %, lean mass, and advanced multi-frequency BIA data when logged), oldest to newest.",
      inputSchema: { ...dateRangeShape },
      annotations: { readOnlyHint: true },
    },
    async ({ startDate, endDate, limit }) => {
      let query = admin.from("body_scans").select("*").eq("user_id", userId).order("date", { ascending: false });
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
      const { data, error } = await query.limit(limit ?? 30);
      if (error) throw new Error(error.message);
      return textResult((data ?? []).slice().reverse().map(bodyScanFromRow));
    },
  );

  server.registerTool(
    "get_stack_history",
    {
      title: "Get peptide/supplement stack history",
      description:
        "Every peptide and supplement entry (name, dose, unit, frequency, start/end date, notes), oldest to newest. The same name appearing more than once means the dose changed on that date.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const [peptidesRes, supplementsRes] = await Promise.all([
        admin.from("peptides").select("*").eq("user_id", userId),
        admin.from("supplements").select("*").eq("user_id", userId),
      ]);
      if (peptidesRes.error) throw new Error(peptidesRes.error.message);
      if (supplementsRes.error) throw new Error(supplementsRes.error.message);
      const combined = [
        ...(peptidesRes.data ?? []).map((r) => ({ kind: "peptide" as const, ...stackItemFromRow(r) })),
        ...(supplementsRes.data ?? []).map((r) => ({ kind: "supplement" as const, ...stackItemFromRow(r) })),
      ].sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
      return textResult(combined);
    },
  );

  server.registerTool(
    "get_goals",
    {
      title: "Get goals and settings",
      description:
        "Primary goal, target body fat/lean mass/bodyweight, lift goals, sex/birth year, split program, and the standing meal plan macro targets if one is set.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const goals = await loadGoals();
      return textResult({
        primaryGoal: null,
        targetBf: null,
        targetLeanMass: null,
        targetBodyweight: null,
        liftGoals: [],
        sex: null,
        birthYear: null,
        splitProgram: null,
        customSplit: null,
        rotation: null,
        mealPlan: null,
        ...goals,
      });
    },
  );

  // ---------- write tools ----------

  server.registerTool(
    "set_day_plan",
    {
      title: "Replace a day's workout plan",
      description:
        "Replaces the full ordered exercise list for one split day (e.g. Push day A). Use for building or restructuring a day; for a single change prefer upsert_plan_exercise. Confirm the new plan with the user before calling.",
      inputSchema: { split: splitSchema, day: dayLabelSchema, exercises: z.array(planExerciseSchema).max(30) },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ split, day, exercises }, extra) => {
      if (lacksWrite(extra.authInfo)) return errorResult(NEEDS_WRITE);
      const names = exercises.map((e) => e.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) return errorResult("Each exercise can appear only once per day.");
      const plans = await loadPlans();
      const next = exercises.map(cleanPlanExercise);
      plans[split] = { ...(plans[split] ?? {}), [day]: next };
      await savePlans(plans);
      const goals = await loadGoals();
      const shown = activeDays(goals).includes(split);
      return textResult({
        saved: { split, day, exercises: next },
        ...(shown ? {} : { note: `${split} isn't one of the user's active program days, so it won't show on the Train tab until their program includes it.` }),
      });
    },
  );

  server.registerTool(
    "upsert_plan_exercise",
    {
      title: "Add or edit one planned exercise",
      description:
        "Adds an exercise to a split day's plan, or updates it if it's already there (matched by name, case-insensitive). Only the fields you pass change. Set `position` (0-based) to move it.",
      inputSchema: {
        split: splitSchema,
        day: dayLabelSchema,
        exercise: planExerciseSchema.partial().extend({ name: z.string().min(1).max(120) }),
        newName: z.string().min(1).max(120).optional().describe("Rename the exercise."),
        position: z.number().int().min(0).optional(),
        clearRepRange: z.boolean().optional().describe("Remove the custom rep range so the app auto-picks one."),
        clearSuperset: z.boolean().optional(),
      },
    },
    async ({ split, day, exercise, newName, position, clearRepRange, clearSuperset }, extra) => {
      if (lacksWrite(extra.authInfo)) return errorResult(NEEDS_WRITE);
      const plans = await loadPlans();
      const list = [...(plans[split]?.[day] ?? [])];
      const idx = list.findIndex((e) => e.name.toLowerCase() === exercise.name.trim().toLowerCase());
      const base: PlanExercise = idx >= 0 ? list[idx] : { name: exercise.name.trim() };
      const merged = cleanPlanExercise({
        ...base,
        ...Object.fromEntries(Object.entries(exercise).filter(([, v]) => v !== undefined)),
        name: (newName ?? base.name).trim(),
        ...(clearRepRange ? { repRangeLo: undefined, repRangeHi: undefined } : {}),
        ...(clearSuperset ? { pairedWith: undefined } : {}),
      });
      if (idx >= 0) list.splice(idx, 1);
      const at = position ?? (idx >= 0 ? idx : list.length);
      list.splice(Math.min(at, list.length), 0, merged);
      plans[split] = { ...(plans[split] ?? {}), [day]: list };
      await savePlans(plans);
      return textResult({ action: idx >= 0 ? "updated" : "added", split, day, exercises: list });
    },
  );

  server.registerTool(
    "remove_plan_exercise",
    {
      title: "Remove a planned exercise",
      description: "Removes one exercise (by name, case-insensitive) from a split day's plan. Logged history is untouched.",
      inputSchema: { split: splitSchema, day: dayLabelSchema, name: z.string().min(1) },
      annotations: { destructiveHint: true },
    },
    async ({ split, day, name }, extra) => {
      if (lacksWrite(extra.authInfo)) return errorResult(NEEDS_WRITE);
      const plans = await loadPlans();
      const list = plans[split]?.[day] ?? [];
      const next = list.filter((e) => e.name.toLowerCase() !== name.trim().toLowerCase());
      if (next.length === list.length) return errorResult(`No exercise named "${name}" on ${split} day ${day}.`);
      plans[split] = { ...(plans[split] ?? {}), [day]: next };
      await savePlans(plans);
      return textResult({ removed: name, split, day, exercises: next });
    },
  );

  server.registerTool(
    "log_workout",
    {
      title: "Log a workout session",
      description:
        "Saves a completed training session. Like the app, a session already logged for the same date, split, and day is replaced with this one. Only log sessions the user says they actually did.",
      inputSchema: {
        date: isoDateSchema,
        split: splitSchema,
        day: dayLabelSchema,
        exercises: z
          .array(z.object({ name: z.string().min(1).max(120), sets: z.array(loggedSetSchema).min(1).max(30) }))
          .min(1)
          .max(30),
      },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ date, split, day, exercises }, extra) => {
      if (lacksWrite(extra.authInfo)) return errorResult(NEEDS_WRITE);
      const log = {
        date,
        split,
        day,
        exercises: exercises.map((e) => ({
          name: e.name.trim(),
          sets: e.sets.filter((s) => s.weight > 0 || s.reps > 0),
        })),
      };
      const { data: existing, error: findError } = await admin
        .from("workout_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", date)
        .eq("split", split)
        .eq("day", day)
        .maybeSingle();
      if (findError) throw new Error(findError.message);
      const row = workoutLogToRow(userId, log);
      const { error } = existing
        ? await admin.from("workout_logs").update(row).eq("id", existing.id).eq("user_id", userId)
        : await admin.from("workout_logs").insert(row);
      if (error) throw new Error(error.message);
      return textResult({ action: existing ? "replaced" : "logged", ...log });
    },
  );

  return server;
}
