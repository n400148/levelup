"use client";

import { useEffect, useRef, useState } from "react";
import type { LoggedExercise, LoggedSet, PlanExercise } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

interface Props {
  exercises: PlanExercise[];
  previousSetsFor: (name: string) => LoggedSet[] | null;
  onFinish: (exercises: LoggedExercise[]) => void;
  onCancel: () => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WorkoutSession({ exercises, previousSetsFor, onFinish, onCancel }: Props) {
  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [collected, setCollected] = useState<LoggedExercise[]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [effort, setEffort] = useState("");
  const [restRemaining, setRestRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ex = exercises[exIndex];
  const warmupCount = ex?.warmupSets ?? 0;
  const workingCount = ex?.targetSets ?? 3;
  const totalCount = warmupCount + workingCount;
  const isWarmup = setIndex < warmupCount;
  const setNumberInPhase = isWarmup ? setIndex + 1 : setIndex - warmupCount + 1;
  const previousSets = ex ? previousSetsFor(ex.name) : null;
  const previousForThisSet = previousSets?.[setIndex] ?? null;
  const resting = restRemaining > 0;

  const isLastSetOfWorkout = exIndex === exercises.length - 1 && setIndex === totalCount - 1;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startRest(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestRemaining(0);
  }

  function advance(justLoggedRest: boolean) {
    setWeight("");
    setReps("");
    setEffort("");

    if (justLoggedRest && ex?.restSeconds && !isLastSetOfWorkout) {
      startRest(ex.restSeconds);
    }

    if (setIndex + 1 < totalCount) {
      setSetIndex(setIndex + 1);
      return;
    }
    if (exIndex + 1 < exercises.length) {
      setExIndex(exIndex + 1);
      setSetIndex(0);
      return;
    }
    // workout complete
    finish(collected);
  }

  function finish(finalCollected: LoggedExercise[]) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onFinish(finalCollected);
  }

  function logSet() {
    const newSet: LoggedSet = {
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps, 10) || 0,
      effort: effort ? parseInt(effort, 10) : undefined,
      warmup: isWarmup,
    };
    setCollected((prev) => {
      const idx = prev.findIndex((e) => e.name === ex.name);
      if (idx === -1) return [...prev, { name: ex.name, sets: [newSet] }];
      const next = [...prev];
      next[idx] = { ...next[idx], sets: [...next[idx].sets, newSet] };
      return next;
    });
    advance(true);
  }

  function skipSet() {
    advance(false);
  }

  function endEarly() {
    finish(collected);
  }

  if (!ex) {
    return (
      <div className="card p-5 text-center">
        <p className="text-[13px] text-[var(--text-dim)]">No exercises to run through.</p>
        <Button variant="secondary" full className="mt-3" onClick={onCancel}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10.5px] text-[var(--text-mute)] font-semibold uppercase tracking-wide">
          Exercise <span className="font-mono">{exIndex + 1}</span> of{" "}
          <span className="font-mono">{exercises.length}</span>
        </div>
        <button onClick={endEarly} className="tap-scale text-[11px] font-semibold text-[var(--danger)]">
          End Workout
        </button>
      </div>

      <div className="h-1 rounded-full bg-[var(--bg-inset-2)] mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${((exIndex + (setIndex + 1) / totalCount) / exercises.length) * 100}%` }}
        />
      </div>

      <div className="card p-5">
        <div className="font-display text-[19px] font-semibold mb-1">{ex.name}</div>
        <div className="font-mono text-[12.5px] text-[var(--text-mute)] mb-5">
          {isWarmup ? `Warmup set ${setNumberInPhase} of ${warmupCount}` : `Set ${setNumberInPhase} of ${workingCount}`}
        </div>

        {resting ? (
          <div className="text-center py-6">
            <div className="eyebrow mb-2">Rest</div>
            <div className="font-mono text-[48px] font-bold text-gradient mb-5">
              {formatClock(restRemaining)}
            </div>
            <Button variant="secondary" full onClick={skipRest}>
              Skip Rest
            </Button>
          </div>
        ) : (
          <>
            <div className="font-mono text-[11px] text-[var(--text-faint)] mb-3">
              {previousForThisSet ? `Previous: ${previousForThisSet.weight} × ${previousForThisSet.reps}` : "No previous data"}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lbs</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={previousForThisSet ? String(previousForThisSet.weight) : "0"}
                  className="text-center text-[20px] font-semibold"
                />
              </div>
              <div>
                <Label>Reps</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder={previousForThisSet ? String(previousForThisSet.reps) : "0"}
                  className="text-center text-[20px] font-semibold"
                />
              </div>
            </div>
            <Label>Effort (1-10, optional)</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
              placeholder="-"
            />

            <div className="flex gap-2.5 mt-5">
              <Button variant="secondary" full onClick={skipSet}>
                Skip Set
              </Button>
              <Button variant="primary" full onClick={logSet}>
                {isLastSetOfWorkout ? "Finish" : "Log Set"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
