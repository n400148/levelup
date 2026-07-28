"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  bodyScanFromRow,
  nutritionFromRow,
  stackItemFromRow,
  weightFromRow,
  workoutLogFromRow,
} from "@/lib/mapping";
import type { BodyScan, NutritionEntry, StackItem, UserGoals, WeightEntry, WorkoutLog } from "@/lib/types";
import {
  goalSummaryInsight,
  latestScanInsight,
  nutritionCalibrationInsight,
  stackSummaryInsight,
  trainingFrequencyInsight,
  weightTrendInsight,
} from "@/lib/insights";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Skeleton } from "@/components/ui/Skeleton";

const EMPTY_GOALS: UserGoals = {
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
};

export default function InsightsPage() {
  const supabase = createClient();

  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [nutrition, setNutrition] = useState<NutritionEntry[]>([]);
  const [scans, setScans] = useState<BodyScan[]>([]);
  const [peptides, setPeptides] = useState<StackItem[]>([]);
  const [supplements, setSupplements] = useState<StackItem[]>([]);
  const [goals, setGoals] = useState<UserGoals>(EMPTY_GOALS);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    async function load() {
      const [w, l, n, s, p, sup, g] = await Promise.all([
        supabase.from("weights").select("*").order("date", { ascending: true }),
        supabase.from("workout_logs").select("*").order("date", { ascending: true }),
        supabase.from("nutrition").select("*").order("date", { ascending: true }),
        supabase.from("body_scans").select("*").order("date", { ascending: true }),
        supabase.from("peptides").select("*"),
        supabase.from("supplements").select("*"),
        supabase.from("user_goals").select("goals").maybeSingle(),
      ]);
      if (w.data) setWeights(w.data.map(weightFromRow));
      if (l.data) setLogs(l.data.map(workoutLogFromRow));
      if (n.data) setNutrition(n.data.map(nutritionFromRow));
      if (s.data) setScans(s.data.map(bodyScanFromRow));
      if (p.data) setPeptides(p.data.map(stackItemFromRow));
      if (sup.data) setSupplements(sup.data.map(stackItemFromRow));
      if (g.data?.goals) setGoals({ ...EMPTY_GOALS, ...(g.data.goals as unknown as UserGoals) });
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bodyweight = weights[weights.length - 1]?.weight ?? null;
  const leanMass = scans[scans.length - 1]?.lmm ?? null;

  const rows = [
    weightTrendInsight(weights),
    trainingFrequencyInsight(logs),
    nutritionCalibrationInsight(nutrition, bodyweight, goals.primaryGoal, leanMass),
    stackSummaryInsight(peptides, supplements),
    goalSummaryInsight(goals),
  ];

  function buildSummary(): string {
    const latestScan = scans[scans.length - 1];

    // Every peptide/supplement entry, oldest first, so a dose change (which
    // ends the old entry and opens a new one — see Stack tab) shows up as a
    // date-ranged timeline the model can line up against the weight log below.
    const stackHistory = [...peptides, ...supplements]
      .slice()
      .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
      .map((item) => {
        const range = `${item.startDate ?? "unknown"} to ${item.endDate ?? "ongoing"}`;
        const dose = item.dose != null ? `${item.dose}${item.unit ?? ""}` : "no dose logged";
        return `${item.name}: ${dose}${item.freq ? ` ${item.freq}` : ""} — ${range}${item.notes ? ` (${item.notes})` : ""}`;
      });

    const recentWeights = weights.slice(-30).map((w) => `${w.date}: ${w.weight}lb`);

    // A full chronological log rather than a single averaged number, so the
    // model can line specific days up against the weigh-in log above and
    // actually spot things like "calories dropped the week weight stalled".
    const recentNutrition = nutrition.slice(-30).map((e) => {
      const parts = [];
      if (e.calories != null) parts.push(`${e.calories}kcal`);
      if (e.protein != null) parts.push(`P${e.protein}`);
      if (e.carbs != null) parts.push(`C${e.carbs}`);
      if (e.fats != null) parts.push(`F${e.fats}`);
      if (e.water != null) parts.push(`W${e.water}oz`);
      return `${e.date}: ${parts.length ? parts.join(" ") : "no macros logged"}`;
    });

    const mp = goals.mealPlan;
    const hasMealPlan = !!mp && [mp.calories, mp.protein, mp.carbs, mp.fats, mp.water].some((v) => v != null);
    const mealPlanLine = hasMealPlan
      ? `Standing meal plan target${mp!.updatedAt ? ` (set ${mp!.updatedAt})` : ""}: ${mp!.calories ?? "–"}kcal, P${mp!.protein ?? "–"} C${mp!.carbs ?? "–"} F${mp!.fats ?? "–"}, W${mp!.water ?? "–"}oz.`
      : "No standing meal plan target set (user logs day-by-day instead).";

    return [
      `Bodyweight: ${bodyweight ?? "unknown"} lb (${weights.length} entries logged).`,
      weightTrendInsight(weights).value,
      recentWeights.length ? `Weigh-ins, oldest to newest: ${recentWeights.join(", ")}.` : "No recent weigh-ins.",
      trainingFrequencyInsight(logs).value,
      mealPlanLine,
      recentNutrition.length
        ? `Daily nutrition log, oldest to newest (compare these dates against the weigh-in log above to see how intake tracks with the weight trend):\n${recentNutrition.join("\n")}`
        : "No nutrition logged.",
      latestScan ? latestScanInsight(scans).value : "No body scans logged.",
      stackHistory.length
        ? `Peptide/supplement dose history, oldest to newest (a name appearing more than once means the dose changed):\n${stackHistory.join("\n")}`
        : "No peptides or supplements logged.",
      `Primary goal: ${goals.primaryGoal ?? "not set"}.`,
      goals.liftGoals.length
        ? `Lift goals: ${goals.liftGoals.map((g) => `${g.exercise} ${g.currentMax}->${g.targetMax}${g.unit}`).join(", ")}.`
        : "No lift goals set.",
    ].join("\n");
  }

  async function handleGetBrief() {
    setBriefLoading(true);
    setBriefError(null);
    setBrief(null);
    setFollowUp("");
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: buildSummary(), question: question.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setBrief(data.result);
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : String(e));
    } finally {
      setBriefLoading(false);
    }
  }

  async function handleRefine() {
    if (!brief || !followUp.trim()) return;
    setRefining(true);
    setBriefError(null);
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: buildSummary(), priorResponse: brief, context: followUp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setBrief(data.result);
      setFollowUp("");
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="animate-rise">
      <Card>
        <CardTitle>Auto Insights</CardTitle>
        {loading && (
          <>
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <Skeleton className="h-4 w-1/3" />
          </>
        )}
        {!loading &&
          rows.map((row) => (
            <div key={row.label} className="mb-3 last:mb-0">
              <div className="eyebrow mb-0.5">{row.label}</div>
              <div className="text-[13px] text-[var(--text-dim)] leading-snug">{row.value}</div>
            </div>
          ))}
      </Card>

      <Card>
        <CardTitle>AI Coach</CardTitle>
        <p className="text-[11px] text-[var(--text-faint)] mb-3">
          Ask a specific question, or leave it blank for a general brief. Either way it&apos;s grounded in your
          weight, training, nutrition, latest scan, stack, and goals — e.g. &ldquo;why have my lifts stalled the
          last 2 weeks?&rdquo;
        </p>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question (optional)…"
          className="mb-3"
        />
        <Button variant="primary" full onClick={handleGetBrief} disabled={briefLoading}>
          {briefLoading ? "Thinking…" : question.trim() ? "Ask Coach" : "Get General Brief"}
        </Button>
        {briefError && <p className="text-[var(--danger)] text-[12px] mt-3">{briefError}</p>}
        {brief && (
          <div className="mt-3 bg-gradient-to-br from-[rgba(4,55,242,0.08)] to-[rgba(111,141,255,0.05)] border border-[rgba(4,55,242,0.3)] rounded-lg p-3.5">
            <div className="eyebrow mb-2">◈ Coach Brief</div>
            <div className="text-[13px] text-[var(--text-dim)] leading-relaxed whitespace-pre-line">{brief}</div>
          </div>
        )}
        {brief && (
          <div className="mt-3">
            <p className="text-[11px] text-[var(--text-faint)] mb-2">
              If it asked a question or you have more context, add it here to get a sharper answer.
            </p>
            <Textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="e.g. yes, I ate a lot of restaurant food yesterday…"
              className="mb-2"
            />
            <Button variant="secondary" full onClick={handleRefine} disabled={refining || !followUp.trim()}>
              {refining ? "Refining…" : "Refine With This Context"}
            </Button>
          </div>
        )}
      </Card>

      <Disclaimer>
        AI output is automated, may be inaccurate, and is not professional medical or fitness advice. Always use your
        own judgment and consult qualified professionals for individualized guidance.
      </Disclaimer>
    </div>
  );
}
