"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Split, SplitProgram, UserGoals, WorkoutPlans } from "@/lib/types";
import { sanitizeWorkoutPlans } from "@/lib/mapping";
import { SPLIT_MUSCLES, PROGRAMS, UNIVERSAL_SPLITS, CUSTOMIZABLE_SPLITS, getProgram } from "@/lib/train-data";
import { MuscleFigure, PulseFigure } from "@/components/train/MuscleFigure";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
};

export default function TrainPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [plans, setPlans] = useState<WorkoutPlans>({});
  const [goals, setGoals] = useState<UserGoals>(EMPTY_GOALS);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [buildingCustom, setBuildingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDays, setCustomDays] = useState<Split[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("workout_plans").select("plans").maybeSingle(),
      supabase.from("user_goals").select("goals").maybeSingle(),
    ]).then(([plansRes, goalsRes]) => {
      if (plansRes.data?.plans) setPlans(sanitizeWorkoutPlans(plansRes.data.plans));
      if (goalsRes.data?.goals) setGoals({ ...EMPTY_GOALS, ...(goalsRes.data.goals as unknown as UserGoals) });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function chooseProgram(id: SplitProgram) {
    if (!user) return;
    const next = { ...goals, splitProgram: id };
    setGoals(next);
    setChoosing(false);
    await supabase.from("user_goals").upsert({ user_id: user.id, goals: next as never }, { onConflict: "user_id" });
  }

  function startCustomBuilder() {
    setCustomName(goals.customSplit?.name ?? "");
    setCustomDays(goals.customSplit?.days ?? []);
    setBuildingCustom(true);
  }

  function toggleCustomDay(day: Split) {
    setCustomDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function saveCustomSplit() {
    if (!user || !customName.trim() || customDays.length === 0) return;
    const next: UserGoals = {
      ...goals,
      splitProgram: "CUSTOM",
      customSplit: { name: customName.trim(), days: customDays },
    };
    setGoals(next);
    setBuildingCustom(false);
    setChoosing(false);
    await supabase.from("user_goals").upsert({ user_id: user.id, goals: next as never }, { onConflict: "user_id" });
  }

  if (loading) {
    return (
      <Card>
        <Skeleton className="h-5 w-2/3 mb-3" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  const isCustom = goals.splitProgram === "CUSTOM";
  const program = getProgram(goals.splitProgram);
  const activeDays: Split[] = isCustom ? (goals.customSplit?.days ?? []) : (program?.days ?? []);
  const activeLabel = isCustom ? goals.customSplit?.name?.trim() || "Custom Split" : (program?.label ?? "");
  const hasActiveProgram = isCustom ? activeDays.length > 0 : !!program;

  if (buildingCustom) {
    return (
      <div className="animate-rise">
        <Card>
          <CardTitle>Build Your Custom Split</CardTitle>
          <Label>Split Name</Label>
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. PHUL"
          />
          <div className="eyebrow mt-3.5 mb-1.5">Days</div>
          <div className="flex flex-wrap">
            {CUSTOMIZABLE_SPLITS.map((d) => (
              <Chip key={d} selected={customDays.includes(d)} onClick={() => toggleCustomDay(d)}>
                {d}
              </Chip>
            ))}
          </div>
          <p className="text-[10.5px] text-[var(--text-faint)] mt-2">
            Cardio and Core are automatically included for every split.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" full onClick={() => setBuildingCustom(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              full
              disabled={!customName.trim() || customDays.length === 0}
              onClick={saveCustomSplit}
            >
              Save
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!hasActiveProgram || choosing) {
    return (
      <div className="animate-rise">
        <Card>
          <CardTitle>{hasActiveProgram ? "Change Split Program" : "Choose Your Split Program"}</CardTitle>
          {PROGRAMS.map((p) => {
            const label = p.id === "CUSTOM" && goals.customSplit?.name ? goals.customSplit.name : p.label;
            return (
              <button
                key={p.id}
                onClick={() => (p.id === "CUSTOM" ? startCustomBuilder() : chooseProgram(p.id))}
                className="tap-scale w-full text-left bg-[var(--bg-inset)] border border-[var(--border)] rounded-lg px-4 py-3 mb-2 last:mb-0"
              >
                <div className="font-display text-[14px] font-semibold">{label}</div>
                <div className="text-[11px] text-[var(--text-mute)] mt-0.5">{p.blurb}</div>
              </button>
            );
          })}
          {hasActiveProgram && (
            <button
              onClick={() => setChoosing(false)}
              className="tap-scale w-full mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-mute)]"
            >
              Cancel
            </button>
          )}
        </Card>
      </div>
    );
  }

  const displayedSplits: Split[] = [...activeDays, ...UNIVERSAL_SPLITS];

  return (
    <div className="animate-rise">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="mb-0">{activeLabel}</CardTitle>
          <button
            onClick={() => setChoosing(true)}
            className="tap-scale text-[10.5px] font-bold uppercase tracking-wide text-[var(--accent-2)]"
          >
            Change
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {displayedSplits.map((split) => {
            const dayCount = Object.keys(plans[split] ?? {}).length;
            const exerciseCount = Object.values(plans[split] ?? {}).reduce((n, d) => n + d.length, 0);
            return (
              <Link
                key={split}
                href={`/train/${encodeURIComponent(split)}`}
                className="tap-scale bg-[var(--bg-inset)] border border-[var(--border)] rounded-[12px] p-3 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-1.5">
                  {split === "Cardio" ? <PulseFigure /> : <MuscleFigure highlighted={SPLIT_MUSCLES[split]} />}
                </div>
                <div className="font-display text-[10px] tracking-wide text-[var(--accent-2)] uppercase">
                  {split}
                </div>
                <div className="text-[10px] text-[var(--text-faint)] mt-0.5">
                  {exerciseCount > 0 ? `${exerciseCount} exercises · ${dayCount} day${dayCount > 1 ? "s" : ""}` : "No plan yet"}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
