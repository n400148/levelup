import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bodyScanFromRow,
  nutritionFromRow,
  sanitizeWorkoutPlans,
  stackItemFromRow,
  weightFromRow,
  workoutLogFromRow,
} from "@/lib/mapping";
import type { UserGoals } from "@/lib/types";

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const dateRangeShape = {
  startDate: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive lower bound."),
  endDate: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive upper bound."),
  limit: z.number().int().positive().max(500).optional().describe("Max rows to return, most recent first. Default varies by tool."),
};

/**
 * Builds a fresh McpServer scoped to one authenticated LiftCipher user. This
 * app has no exercise/data library shared across users — everything is
 * per-user tracked data — so every tool here is a thin, explicitly
 * user_id-scoped read against the same tables the app's own UI reads,
 * mapped through the same lib/mapping.ts functions the UI uses so the shape
 * Claude sees matches the shape shown in the app.
 */
export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "liftcipher", version: "1.0.0" });
  const admin = createAdminClient();

  server.registerTool(
    "get_weight_log",
    {
      title: "Get weight log",
      description: "Bodyweight entries over time (date + weight in lb), oldest to newest.",
      inputSchema: { ...dateRangeShape },
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
      description: "The currently planned splits/days/exercises (target sets, rep ranges, rest, supersets) — not logged history, the standing plan.",
      inputSchema: {},
    },
    async () => {
      const { data, error } = await admin.from("workout_plans").select("plans").eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      return textResult(sanitizeWorkoutPlans(data?.plans ?? {}));
    },
  );

  server.registerTool(
    "get_body_scans",
    {
      title: "Get body composition scans",
      description: "Body scan readings (weight, body fat %, lean mass, and advanced multi-frequency BIA data when logged), oldest to newest.",
      inputSchema: { ...dateRangeShape },
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
    },
    async () => {
      const { data, error } = await admin.from("user_goals").select("goals").eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      const goals = data?.goals as unknown as UserGoals | null;
      return textResult(
        goals ?? {
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
        },
      );
    },
  );

  return server;
}
