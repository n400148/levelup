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

const EMPTY_GOALS: UserGoals = { primaryGoal: null, targetBf: null, targetLeanMass: null, targetBodyweight: null, liftGoals: [] };

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

  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

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
    const activePeptides = peptides.filter((p) => !p.endDate).map((p) => p.name);
    const activeSupplements = supplements.filter((s) => !s.endDate).map((s) => s.name);
    const recentNutrition = nutrition.slice(-7);
    const avgCalories = recentNutrition.length
      ? Math.round(recentNutrition.reduce((s, e) => s + (e.calories ?? 0), 0) / recentNutrition.length)
      : null;

    return [
      `Bodyweight: ${bodyweight ?? "unknown"} lb (${weights.length} entries logged).`,
      weightTrendInsight(weights).value,
      trainingFrequencyInsight(logs).value,
      avgCalories ? `Averaging ${avgCalories} kcal/day over the last ${recentNutrition.length} logged days.` : "No recent nutrition logs.",
      latestScan ? latestScanInsight(scans).value : "No body scans logged.",
      `Active peptides: ${activePeptides.join(", ") || "none"}.`,
      `Active supplements: ${activeSupplements.join(", ") || "none"}.`,
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

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/test", { method: "POST" });
      const data = await res.json();
      setTestResult(
        data.ok
          ? `Connected · ${data.modelUsed}`
          : `Failed: ${data.error ?? (data.raw ? `model replied "${data.raw}" instead of the expected check string` : "unknown error")}`,
      );
    } catch (e) {
      setTestResult(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="animate-rise">
      <Card>
        <CardTitle>Auto Insights</CardTitle>
        {!loading &&
          rows.map((row) => (
            <div key={row.label} className="mb-3 last:mb-0">
              <div className="text-[9px] uppercase tracking-widest text-[var(--accent-2)] font-bold mb-0.5">
                {row.label}
              </div>
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
          <div className="mt-3 bg-gradient-to-br from-[rgba(108,92,231,0.08)] to-[rgba(155,140,255,0.05)] border border-[rgba(108,92,231,0.3)] rounded-lg p-3.5">
            <div className="text-[9px] tracking-widest uppercase text-[var(--accent-2)] font-bold mb-2">
              ◈ Coach Brief
            </div>
            <div className="text-[13px] text-[var(--text-dim)] leading-relaxed whitespace-pre-line">{brief}</div>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Connection Check</CardTitle>
        <Button variant="secondary" full onClick={handleTestConnection} disabled={testing}>
          {testing ? "Testing…" : "Test AI Connection"}
        </Button>
        {testResult && (
          <p className={`text-[12px] mt-2 ${testResult.startsWith("Connected") ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {testResult}
          </p>
        )}
      </Card>

      <Disclaimer>
        AI output is automated, may be inaccurate, and is not professional medical or fitness advice. Always use your
        own judgment and consult qualified professionals for individualized guidance.
      </Disclaimer>
    </div>
  );
}
