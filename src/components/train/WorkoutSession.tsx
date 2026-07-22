"use client";

import { useEffect, useState } from "react";
import type { LoggedExercise, LoggedSet, PlanExercise } from "@/lib/types";
import type { ProgressionResult } from "@/lib/progression";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ProgressionCard } from "@/components/train/ProgressionCard";

interface Progress {
  exIndex: number;
  setIndex: number;
  subIndex: 0 | 1;
  collected: LoggedExercise[];
  restEndAt: number | null;
}

interface HistoryEntry {
  exIndex: number;
  setIndex: number;
  subIndex: 0 | 1;
  loggedSet: LoggedSet | null;
}

interface Props {
  exercises: PlanExercise[];
  previousSetsFor: (name: string) => LoggedSet[] | null;
  progressionFor?: (name: string, currentSets: LoggedSet[]) => ProgressionResult;
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

export function WorkoutSession({
  exercises,
  previousSetsFor,
  progressionFor,
  onFinish,
  onCancel,
  initial,
  onProgress,
}: Props) {
  const [exIndex, setExIndex] = useState(initial?.exIndex ?? 0);
  const [setIndex, setSetIndex] = useState(initial?.setIndex ?? 0);
  // Which half of a superset pair is currently up: 0 is the first exercise
  // (or the only one, when not a superset), 1 is the partner that's done
  // immediately after, before the round's rest.
  const [subIndex, setSubIndex] = useState<0 | 1>(initial?.subIndex ?? 0);
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
  const isSuperset = !!ex?.pairedWith;
  const currentName = subIndex === 1 ? (ex?.pairedWith ?? ex?.name ?? "") : ex?.name ?? "";
  const warmupCount = ex?.warmupSets ?? 0;
  const workingCount = ex?.targetSets ?? 3;
  const totalCount = warmupCount + workingCount;
  const isWarmup = setIndex < warmupCount;
  const setNumberInPhase = isWarmup ? setIndex + 1 : setIndex - warmupCount + 1;
  const previousSets = ex ? previousSetsFor(currentName) : null;
  const currentSetsSoFar = collected.find((e) => e.name === currentName)?.sets ?? [];
  const progression = ex && progressionFor ? progressionFor(currentName, currentSetsSoFar) : null;
  const previousForThisSet = previousSets?.[setIndex] ?? null;
  const restRemaining = restEndAt ? Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000)) : 0;
  const resting = restRemaining > 0;

  const isLastSetOfWorkout =
    exIndex === exercises.length - 1 && setIndex === totalCount - 1 && (!isSuperset || subIndex === 1);

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
    onProgress?.({ exIndex, setIndex, subIndex, collected, restEndAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIndex, setIndex, subIndex, collected, restEndAt]);

  function startRest(seconds: number) {
    setRestEndAt(Date.now() + seconds * 1000);
  }

  function skipRest() {
    setRestEndAt(null);
  }

  // collectedForFinish lets logSet() pass the just-computed array through
  // for the case where this call finishes the workout — setCollected()
  // only queues a state update, so reading the `collected` closure variable
  // in that same synchronous call would silently drop whatever was just
  // logged from the saved workout.
  function advance(justLoggedRest: boolean, collectedForFinish: LoggedExercise[] = collected) {
    setWeight("");
    setReps("");
    setEffort("");
    setFailed(false);

    // Superset: go straight to the paired exercise for this same round —
    // no rest until both halves of the round are done.
    if (isSuperset && subIndex === 0) {
      setSubIndex(1);
      return;
    }

    if (justLoggedRest && ex?.restSeconds && !isLastSetOfWorkout) {
      startRest(ex.restSeconds);
    }

    if (setIndex + 1 < totalCount) {
      setSubIndex(0);
      setSetIndex(setIndex + 1);
      return;
    }
    if (exIndex + 1 < exercises.length) {
      setSubIndex(0);
      setExIndex(exIndex + 1);
      setSetIndex(0);
      return;
    }
    // workout complete — leave exIndex/setIndex/subIndex as-is; nothing
    // downstream depends on them once onFinish has been called, and
    // resetting them here could flash a stale earlier screen while the
    // parent's finish handler (which may be async) is still in flight.
    finish(collectedForFinish);
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
    const idx = collected.findIndex((e) => e.name === currentName);
    const nextCollected =
      idx === -1
        ? [...collected, { name: currentName, sets: [newSet] }]
        : collected.map((e, i) => (i === idx ? { ...e, sets: [...e.sets, newSet] } : e));
    setCollected(nextCollected);
    setHistory((prev) => [...prev, { exIndex, setIndex, subIndex, loggedSet: newSet }]);
    advance(true, nextCollected);
  }

  function skipSet() {
    setHistory((prev) => [...prev, { exIndex, setIndex, subIndex, loggedSet: null }]);
    advance(false);
  }

  function goBack() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRestEndAt(null);
    setExIndex(last.exIndex);
    setSetIndex(last.setIndex);
    setSubIndex(last.subIndex);

    if (last.loggedSet) {
      const lastEx = exercises[last.exIndex];
      const exName = last.subIndex === 1 ? (lastEx.pairedWith ?? lastEx.name) : lastEx.name;
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
        {isSuperset && (
          <div className="eyebrow mb-1.5">
            Superset · {subIndex === 0 ? "1 of 2" : "2 of 2"}
          </div>
        )}
        <div className="font-display text-[19px] font-semibold mb-1">{currentName}</div>
        {isSuperset && !resting && (
          <div className="text-[11.5px] text-[var(--text-faint)] mb-1">
            {subIndex === 0 ? `Then: ${ex.pairedWith}` : `After: ${ex.name}`}
          </div>
        )}
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
            {progression && progression.status !== "no_data" && <ProgressionCard result={progression} />}
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
              <span className="text-[12px] font-semibold text-[var(--text-dim)]">Trained to failure</span>
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
                {isLastSetOfWorkout ? "Finish" : isSuperset && subIndex === 0 ? "Log & Next Exercise" : "Log Set"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
