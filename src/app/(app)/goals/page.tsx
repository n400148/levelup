"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { workoutLogFromRow } from "@/lib/mapping";
import type { LiftGoal, PrimaryGoal, Sex, UserGoals, WorkoutLog } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { TargetIcon } from "@/components/ui/EmptyStateIcons";
import { Skeleton } from "@/components/ui/Skeleton";
import { LiftGoalCard } from "@/components/goals/LiftGoalCard";

const PRIMARY_GOALS: PrimaryGoal[] = ["Fat Loss", "Muscle Gain", "Recomp", "Strength", "Endurance", "Maintain"];

const EMPTY_GOALS: UserGoals = {
  primaryGoal: null,
  targetBf: null,
  targetLeanMass: null,
  targetBodyweight: null,
  liftGoals: [],
  sex: null,
  birthYear: null,
};

const CURRENT_YEAR = new Date().getFullYear();

export default function GoalsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [goals, setGoals] = useState<UserGoals>(EMPTY_GOALS);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [exercise, setExercise] = useState("");
  const [currentMax, setCurrentMax] = useState("");
  const [targetMax, setTargetMax] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [deadline, setDeadline] = useState("");

  async function loadAll() {
    const [goalsRes, logsRes] = await Promise.all([
      supabase.from("user_goals").select("goals").maybeSingle(),
      supabase.from("workout_logs").select("*"),
    ]);
    if (goalsRes.data?.goals) setGoals({ ...EMPTY_GOALS, ...(goalsRes.data.goals as unknown as UserGoals) });
    if (logsRes.data) setLogs(logsRes.data.map(workoutLogFromRow));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist(next: UserGoals) {
    if (!user) return;
    setGoals(next);
    await supabase.from("user_goals").upsert({ user_id: user.id, goals: next as never }, { onConflict: "user_id" });
  }

  async function handleSaveTargets(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await persist(goals);
    setSaving(false);
  }

  async function handleAddLiftGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim() || !currentMax || !targetMax) return;
    const goal: LiftGoal = {
      id: crypto.randomUUID(),
      exercise: exercise.trim(),
      currentMax: parseFloat(currentMax),
      targetMax: parseFloat(targetMax),
      unit,
      deadline: deadline || undefined,
    };
    await persist({ ...goals, liftGoals: [...goals.liftGoals, goal] });
    setExercise("");
    setCurrentMax("");
    setTargetMax("");
    setDeadline("");
  }

  async function handleDeleteLiftGoal(id: string) {
    await persist({ ...goals, liftGoals: goals.liftGoals.filter((g) => g.id !== id) });
  }

  const bestWeights = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of logs) {
      for (const ex of log.exercises) {
        const best = Math.max(0, ...ex.sets.filter((s) => s.reps > 0).map((s) => s.weight));
        const key = ex.name.toLowerCase();
        map.set(key, Math.max(map.get(key) ?? 0, best));
      }
    }
    return map;
  }, [logs]);

  return (
    <div className="animate-rise">
      <Card>
        <CardTitle>Primary Goal</CardTitle>
        <div className="flex flex-wrap">
          {PRIMARY_GOALS.map((g) => (
            <Chip key={g} selected={goals.primaryGoal === g} onClick={() => persist({ ...goals, primaryGoal: g })}>
              {g}
            </Chip>
          ))}
        </div>
        <p className="text-[10.5px] text-[var(--text-faint)] mt-2">
          Drives your Nutrition macro targets and Train rep-range guidance.
        </p>
      </Card>

      <Card>
        <CardTitle>Body Targets</CardTitle>
        <form onSubmit={handleSaveTargets}>
          <Label>Target Body Fat %</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={goals.targetBf ?? ""}
            onChange={(e) => setGoals({ ...goals, targetBf: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="15.0"
          />
          <Label>Target Lean Mass (lb)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={goals.targetLeanMass ?? ""}
            onChange={(e) => setGoals({ ...goals, targetLeanMass: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="160"
          />
          <Label>Target Bodyweight (lb)</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={goals.targetBodyweight ?? ""}
            onChange={(e) => setGoals({ ...goals, targetBodyweight: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="185"
          />

          <Label>Sex</Label>
          <Select
            value={goals.sex ?? ""}
            onChange={(e) => setGoals({ ...goals, sex: (e.target.value || null) as Sex | null })}
          >
            <option value="">Not set</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
          <Label>Birth Year</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={1900}
            max={CURRENT_YEAR}
            value={goals.birthYear ?? ""}
            onChange={(e) => setGoals({ ...goals, birthYear: e.target.value ? parseInt(e.target.value, 10) : null })}
            placeholder="1998"
          />
          <p className="text-[10.5px] text-[var(--text-faint)] mt-1.5">
            Used only to show age/sex-adjusted reference ranges on the Scan tab (body fat %, waist-to-hip ratio,
            visceral fat level). Optional.
          </p>

          <Button type="submit" variant="primary" full className="mt-3.5" disabled={saving}>
            {saving ? "Saving…" : "Save Targets"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Add Lift Goal</CardTitle>
        <form onSubmit={handleAddLiftGoal}>
          <Label>Exercise</Label>
          <Input value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="Bench Press" required />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Current Max</Label>
              <Input type="number" inputMode="decimal" value={currentMax} onChange={(e) => setCurrentMax(e.target.value)} placeholder="185" required />
            </div>
            <div>
              <Label>Target Max</Label>
              <Input type="number" inputMode="decimal" value={targetMax} onChange={(e) => setTargetMax(e.target.value)} placeholder="225" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Unit</Label>
              <Select value={unit} onChange={(e) => setUnit(e.target.value as "lb" | "kg")}>
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </Select>
            </div>
            <div>
              <Label>Deadline (optional)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <Button type="submit" variant="primary" full className="mt-3.5">
            Add Lift Goal
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Lift Goals</CardTitle>
        {loading ? (
          <Skeleton className="h-14 w-full" />
        ) : goals.liftGoals.length === 0 ? (
          <EmptyState icon={<TargetIcon />} text="No lift goals yet. Add one above — progress auto-tracks from your Train logs." />
        ) : (
          goals.liftGoals.map((g) => (
            <LiftGoalCard
              key={g.id}
              goal={g}
              bestWeight={bestWeights.get(g.exercise.toLowerCase()) ?? null}
              onDelete={() => handleDeleteLiftGoal(g.id)}
            />
          ))
        )}
      </Card>

      <Disclaimer>
        General fitness guidance only. Adjust targets for your own recovery, experience level, and any medical
        considerations.
      </Disclaimer>
    </div>
  );
}
