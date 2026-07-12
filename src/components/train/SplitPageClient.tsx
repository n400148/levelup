"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { sanitizeWorkoutPlans, workoutLogFromRow, workoutLogToRow } from "@/lib/mapping";
import type { LoggedExercise, LoggedSet, PlanExercise, Split, UserGoals, WorkoutLog, WorkoutPlans } from "@/lib/types";
import { SPLIT_MUSCLES, SPLIT_PRESETS } from "@/lib/train-data";
import { getProgressionForExercise, PROGRESSION_DISCLAIMER } from "@/lib/progression";
import { todayISO } from "@/lib/date";
import {
  clearSavedSession,
  loadSavedSession,
  saveSession as persistWorkoutProgress,
  type SavedSession,
} from "@/lib/session-storage";
import { Card, CardTitle } from "@/components/ui/Card";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarbellIcon } from "@/components/ui/EmptyStateIcons";
import { Skeleton } from "@/components/ui/Skeleton";
import { MuscleFigure, PulseFigure } from "@/components/train/MuscleFigure";
import { PlanEditor } from "@/components/train/PlanEditor";
import { SetLogger } from "@/components/train/SetLogger";
import { WorkoutSession } from "@/components/train/WorkoutSession";

const DAY_LETTERS = "ABCDEFGH";

export function SplitPageClient({ split }: { split: Split }) {
  const { user } = useAuth();
  const supabase = createClient();

  const [plans, setPlans] = useState<WorkoutPlans>({});
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [goal, setGoal] = useState<UserGoals["primaryGoal"]>(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<"plan" | "log">("log");
  const [selectedDay, setSelectedDay] = useState("A");
  const [logDate, setLogDate] = useState(todayISO());
  const [sessionExercises, setSessionExercises] = useState<LoggedExercise[]>([]);
  const [extraName, setExtraName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionInitial, setSessionInitial] = useState<
    | { exIndex: number; setIndex: number; subIndex: 0 | 1; collected: LoggedExercise[]; restEndAt: number | null }
    | undefined
  >(undefined);
  const [resumable, setResumable] = useState<SavedSession | null>(null);

  useEffect(() => {
    const saved = loadSavedSession();
    if (saved && saved.split === split && saved.date === todayISO()) {
      setResumable(saved);
    }
  }, [split]);

  async function loadAll() {
    const [plansRes, logsRes, goalsRes] = await Promise.all([
      supabase.from("workout_plans").select("plans").maybeSingle(),
      supabase.from("workout_logs").select("*").eq("split", split).order("date", { ascending: false }).limit(200),
      supabase.from("user_goals").select("goals").maybeSingle(),
    ]);
    if (plansRes.data?.plans) setPlans(sanitizeWorkoutPlans(plansRes.data.plans));
    if (logsRes.data) setLogs(logsRes.data.map(workoutLogFromRow));
    const goalsData = goalsRes.data?.goals as unknown as UserGoals | undefined;
    setGoal(goalsData?.primaryGoal ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split]);

  const dayPlan = plans[split] ?? {};
  const dayKeys = Object.keys(dayPlan).length ? Object.keys(dayPlan) : ["A"];

  useEffect(() => {
    if (!dayKeys.includes(selectedDay)) setSelectedDay(dayKeys[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split, loading]);

  useEffect(() => {
    if (mode !== "log") return;
    const existing = logs.find((l) => l.date === logDate && l.day === selectedDay);
    if (existing) {
      setSessionExercises(existing.exercises);
    } else {
      const planExercises = dayPlan[selectedDay] ?? [];
      // A superset is one plan entry with a paired name tucked inside it, so
      // it needs to expand into two rows here — manual logging tracks each
      // exercise's sets independently regardless of how they're paired up
      // in the guided workout.
      setSessionExercises(
        planExercises.flatMap((pe) =>
          pe.pairedWith
            ? [
                { name: pe.name, sets: [{ weight: 0, reps: 0 }] },
                { name: pe.pairedWith, sets: [{ weight: 0, reps: 0 }] },
              ]
            : [{ name: pe.name, sets: [{ weight: 0, reps: 0 }] }],
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedDay, logDate, logs, split]);

  async function savePlan(updated: WorkoutPlans) {
    if (!user) return;
    setPlans(updated);
    await supabase.from("workout_plans").upsert({ user_id: user.id, plans: updated as never }, { onConflict: "user_id" });
  }

  function addExercise(name: string) {
    const existing = dayPlan[selectedDay] ?? [];
    if (existing.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;
    savePlan({ ...plans, [split]: { ...dayPlan, [selectedDay]: [...existing, { name }] } });
  }

  function removeExercise(name: string) {
    const existing = dayPlan[selectedDay] ?? [];
    savePlan({ ...plans, [split]: { ...dayPlan, [selectedDay]: existing.filter((e) => e.name !== name) } });
  }

  function configureExercise(name: string, patch: Partial<PlanExercise>) {
    const existing = dayPlan[selectedDay] ?? [];
    savePlan({
      ...plans,
      [split]: {
        ...dayPlan,
        [selectedDay]: existing.map((e) => (e.name === name ? { ...e, ...patch } : e)),
      },
    });
  }

  function reorderExercises(next: PlanExercise[]) {
    savePlan({ ...plans, [split]: { ...dayPlan, [selectedDay]: next } });
  }

  function addDay() {
    const nextLetter = DAY_LETTERS[Object.keys(dayPlan).length] ?? `${Object.keys(dayPlan).length + 1}`;
    savePlan({ ...plans, [split]: { ...dayPlan, [nextLetter]: [] } });
    setSelectedDay(nextLetter);
  }

  function previousSetsFor(name: string): LoggedSet[] | null {
    const prior = logs
      .filter((l) => l.date !== logDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const log of prior) {
      const ex = log.exercises.find((e) => e.name.toLowerCase() === name.toLowerCase());
      if (ex && ex.sets.length) return ex.sets;
    }
    return null;
  }

  function updateSessionSets(idx: number, sets: LoggedSet[]) {
    setSessionExercises((prev) => prev.map((e, i) => (i === idx ? { ...e, sets } : e)));
  }

  function removeSessionExercise(idx: number) {
    setSessionExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function addExtraExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!extraName.trim()) return;
    setSessionExercises((prev) => [...prev, { name: extraName.trim(), sets: [{ weight: 0, reps: 0 }] }]);
    setExtraName("");
  }

  async function saveSession() {
    if (!user) return;
    setSaving(true);
    const cleaned = sessionExercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.weight > 0 || s.reps > 0) }))
      .filter((e) => e.sets.length > 0);

    const existing = logs.find((l) => l.date === logDate && l.day === selectedDay);
    const row: WorkoutLog = { date: logDate, split, day: selectedDay, exercises: cleaned };

    if (existing?.id) {
      await supabase.from("workout_logs").update(workoutLogToRow(user.id, row)).eq("id", existing.id);
    } else {
      await supabase.from("workout_logs").insert(workoutLogToRow(user.id, row));
    }
    await loadAll();
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  async function handleSessionFinish(finished: LoggedExercise[]) {
    if (!user) return;
    const cleaned = finished
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.weight > 0 || s.reps > 0) }))
      .filter((e) => e.sets.length > 0);
    const today = todayISO();
    const existing = logs.find((l) => l.date === today && l.day === selectedDay);
    const row: WorkoutLog = { date: today, split, day: selectedDay, exercises: cleaned };

    if (existing?.id) {
      await supabase.from("workout_logs").update(workoutLogToRow(user.id, row)).eq("id", existing.id);
    } else {
      await supabase.from("workout_logs").insert(workoutLogToRow(user.id, row));
    }
    await loadAll();
    clearSavedSession();
    setSessionInitial(undefined);
    setSessionActive(false);
    setLogDate(today);
    setMode("log");
  }

  function handleStartWorkout() {
    setSessionInitial(undefined);
    setResumable(null);
    setSessionActive(true);
  }

  function handleResumeSession() {
    if (!resumable) return;
    setSelectedDay(resumable.day);
    setSessionInitial({
      exIndex: resumable.exIndex,
      setIndex: resumable.setIndex,
      subIndex: resumable.subIndex ?? 0,
      collected: resumable.collected,
      restEndAt: resumable.restEndAt ?? null,
    });
    setSessionActive(true);
    setResumable(null);
  }

  function handleDiscardResumable() {
    clearSavedSession();
    setResumable(null);
  }

  function handleSessionProgress(progress: {
    exIndex: number;
    setIndex: number;
    subIndex: 0 | 1;
    collected: LoggedExercise[];
    restEndAt: number | null;
  }) {
    persistWorkoutProgress({ split, day: selectedDay, date: todayISO(), ...progress });
  }

  return (
    <div className="animate-rise">
      <Link href="/train" className="inline-flex items-center gap-1.5 text-[var(--accent)] text-[13px] font-bold uppercase mb-3">
        ← Splits
      </Link>

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 shrink-0">
            {split === "Cardio" ? <PulseFigure /> : <MuscleFigure highlighted={SPLIT_MUSCLES[split]} />}
          </div>
          <div>
            <div className="font-display text-[16px] tracking-wide">{split}</div>
            <div className="text-[11px] text-[var(--text-mute)]">
              {SPLIT_MUSCLES[split].length ? SPLIT_MUSCLES[split].join(", ") : "Cardiovascular conditioning"}
            </div>
          </div>
        </div>

        {sessionActive ? (
          <div className="text-[11px] text-[var(--text-mute)] font-medium">Day {selectedDay} · guided workout</div>
        ) : (
          <>
            <SegmentedToggle
              value={mode}
              onChange={setMode}
              options={[
                { value: "log", label: "Log" },
                { value: "plan", label: "Plan" },
              ]}
            />

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {dayKeys.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`tap-scale shrink-0 rounded-md px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide border ${
                    selectedDay === d
                      ? "bg-[rgba(4,55,242,0.15)] border-[var(--accent)] text-[#6f8dff]"
                      : "bg-[var(--bg-inset)] border-[var(--border)] text-[var(--text-mute)]"
                  }`}
                >
                  Day {d}
                </button>
              ))}
              {mode === "plan" && (
                <button
                  onClick={addDay}
                  className="tap-scale shrink-0 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide border border-dashed border-[var(--border)] text-[var(--text-mute)]"
                >
                  + Day
                </button>
              )}
            </div>
          </>
        )}
      </Card>

      {loading ? (
        <Card>
          <Skeleton className="h-5 w-2/3 mb-3" />
          <Skeleton className="h-24 w-full" />
        </Card>
      ) : sessionActive ? (
        <WorkoutSession
          exercises={dayPlan[selectedDay] ?? []}
          previousSetsFor={previousSetsFor}
          onFinish={handleSessionFinish}
          onCancel={() => setSessionActive(false)}
          initial={sessionInitial}
          onProgress={handleSessionProgress}
        />
      ) : mode === "plan" ? (
        <Card>
          <CardTitle>Day {selectedDay} Plan</CardTitle>
          <PlanEditor
            exercises={dayPlan[selectedDay] ?? []}
            presets={SPLIT_PRESETS[split]}
            onAdd={addExercise}
            onRemove={removeExercise}
            onConfigure={configureExercise}
            onReorder={reorderExercises}
          />
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="mb-0">Session</CardTitle>
              <Input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="!w-auto text-[12px] py-1.5"
              />
            </div>
            {resumable && (
              <div className="bg-[rgba(4,55,242,0.1)] border border-[rgba(4,55,242,0.3)] rounded-lg px-3 py-2.5 mb-3">
                <p className="text-[12px] text-[var(--text-dim)] mb-2">
                  You left an unfinished Day {resumable.day} workout in progress.
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" full onClick={handleResumeSession}>
                    Resume Workout
                  </Button>
                  <Button variant="secondary" onClick={handleDiscardResumable}>
                    Discard
                  </Button>
                </div>
              </div>
            )}
            <Button
              variant="primary"
              full
              disabled={(dayPlan[selectedDay] ?? []).length === 0}
              onClick={handleStartWorkout}
            >
              ▶ Start Workout
            </Button>
          </Card>

          {sessionExercises.length === 0 && (
            <Card>
              <EmptyState icon={<BarbellIcon />} text="No exercises for this day yet. Switch to Plan to add some." />
            </Card>
          )}

          {sessionExercises.map((ex, i) => (
            <SetLogger
              key={`${ex.name}-${i}`}
              exercise={ex}
              previousSets={previousSetsFor(ex.name)}
              progression={getProgressionForExercise(
                logs.filter((l) => l.date !== logDate),
                ex.name,
                goal,
              )}
              onChange={(sets) => updateSessionSets(i, sets)}
              onRemoveExercise={() => removeSessionExercise(i)}
            />
          ))}

          <Card>
            <form onSubmit={addExtraExercise} className="flex gap-2 mb-3">
              <Input
                value={extraName}
                onChange={(e) => setExtraName(e.target.value)}
                placeholder="Add extra exercise for today…"
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                Add
              </Button>
            </form>
            <Button variant="primary" full onClick={saveSession} disabled={saving}>
              {saving ? "Saving…" : savedFlash ? "Saved ✓" : "Save Session"}
            </Button>
          </Card>

          <Disclaimer>{PROGRESSION_DISCLAIMER}</Disclaimer>
        </>
      )}
    </div>
  );
}
