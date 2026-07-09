"use client";

import { useEffect, useState } from "react";
import type { LoggedExercise, LoggedSet, PlanExercise } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

interface Progress {
  exIndex: number;
  setIndex: number;
  collected: LoggedExercise[];
  restEndAt: number | null;
}

interface HistoryEntry {
  exIndex: number;
  setIndex: number;
  loggedSet: LoggedSet | null;
}

interface Props {
  exercises: PlanExercise[];
  previousSetsFor: (name: string) => LoggedSet[] | null;
  onFinish: (exercises: LoggedExercise[]) => void;
  onCancel: () => void;
  initial?: Progress;
  onProgress?: (progress: Progress) => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WorkoutSession({ exercises, previousSetsFor, onFinish, onCancel, initial, onProgress }: Props) {
  const [exIndex, setExIndex] = useState(initial?.exIndex ?? 0);
  const [setIndex, setSetIndex] = useState(initial?.setIndex ?? 0);
  const [collected, setCollected] = useState<LoggedExercise[]>(initial?.collected ?? []);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [effort, setEffort] = useState("");
  const [failed, setFailed] = useState(false);
  // Rest is tracked as a target end timestamp rather than a decrementing
  // counter, so it keeps counting real elapsed time (and can be persisted
  // and restored) instead of drifting or resetting when the tab is
  // backgrounded or the workout is resumed later.
  const [restEndAt, setRestEndAt] = useState<number | null>(initial?.restEndAt ?? null);
  const [, forceTick] = useState(0);

  const ex = exercises[exIndex];
  const warmupCount = ex?.warmupSets ?? 0;
  const workingCount = ex?.targetSets ?? 3;
  const totalCount = warmupCount + workingCount;
  const isWarmup = setIndex < warmupCount;
  const setNumberInPhase = isWarmup ? setIndex + 1 : setIndex - warmupCount + 1;
  const previousSets = ex ? previousSetsFor(ex.name) : null;
  const previousForThisSet = previousSets?.[setIndex] ?? null;
  const restRemaining = restEndAt ? Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000)) : 0;
  const resting = restRemaining > 0;

  const isLastSetOfWorkout = exIndex === exercises.length - 1 && setIndex === totalCount - 1;

  useEffect(() => {
    if (restEndAt === null) return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [restEndAt]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") forceTick((t) => t + 1);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    onProgress?.({ exIndex, setIndex, collected, restEndAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIndex, setIndex, collected, restEndAt]);

  function startRest(seconds: number) {
    setRestEndAt(Date.now() + seconds * 1000);
  }

  function skipRest() {
    setRestEndAt(null);
  }

  function advance(justLoggedRest: boolean) {
    setWeight("");
    setReps("");
    setEffort("");
    setFailed(false);

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
    onFinish(finalCollected);
  }

  function logSet() {
    const newSet: LoggedSet = {
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps, 10) || 0,
      effort: effort ? parseInt(effort, 10) : undefined,
      warmup: isWarmup,
      failed: failed || undefined,
    };
    setCollected((prev) => {
      const idx = prev.findIndex((e) => e.name === ex.name);
      if (idx === -1) return [...prev, { name: ex.name, sets: [newSet] }];
      const next = [...prev];
      next[idx] = { ...next[idx], sets: [...next[idx].sets, newSet] };
      return next;
    });
    setHistory((prev) => [...prev, { exIndex, setIndex, loggedSet: newSet }]);
    advance(true);
  }

  function skipSet() {
    setHistory((prev) => [...prev, { exIndex, setIndex, loggedSet: null }]);
    advance(false);
  }

  function goBack() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRestEndAt(null);
    setExIndex(last.exIndex);
    setSetIndex(last.setIndex);

    if (last.loggedSet) {
      const exName = exercises[last.exIndex].name;
      setCollected((prev) => {
        const idx = prev.findIndex((e) => e.name === exName);
        if (idx === -1) return prev;
        const sets = prev[idx].sets.slice(0, -1);
        const next = [...prev];
        if (sets.length === 0) {
          next.splice(idx, 1);
        } else {
          next[idx] = { ...next[idx], sets };
        }
        return next;
      });
      setWeight(last.loggedSet.weight ? String(last.loggedSet.weight) : "");
      setReps(last.loggedSet.reps ? String(last.loggedSet.reps) : "");
      setEffort(last.loggedSet.effort ? String(last.loggedSet.effort) : "");
      setFailed(last.loggedSet.failed ?? false);
    } else {
      setWeight("");
      setReps("");
      setEffort("");
      setFailed(false);
    }
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
            {history.length > 0 && (
              <button
                onClick={goBack}
                className="tap-scale w-full mt-3 text-[11px] font-semibold text-[var(--accent-2)]"
              >
                ‹ Undo Last Set
              </button>
            )}
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

            <label className="flex items-center gap-2 mt-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={failed}
                onChange={(e) => setFailed(e.target.checked)}
                className="w-4 h-4 shrink-0 accent-[var(--danger)]"
              />
              <span className="text-[12px] font-semibold text-[var(--text-dim)]">Failed set (missed target reps)</span>
            </label>

            <div className="flex gap-2 mt-5">
              {history.length > 0 && (
                <Button variant="secondary" onClick={goBack} className="!px-3.5 whitespace-nowrap">
                  ‹ Back
                </Button>
              )}
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
