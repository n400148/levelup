"use client";

import type { LoggedExercise, LoggedSet } from "@/lib/types";
import type { ProgressionResult } from "@/lib/progression";
import { ProgressionCard } from "@/components/train/ProgressionCard";

interface Props {
  exercise: LoggedExercise;
  previousSets: LoggedSet[] | null;
  progression: ProgressionResult;
  onChange: (sets: LoggedSet[]) => void;
  onRemoveExercise: () => void;
}

export function SetLogger({ exercise, previousSets, progression, onChange, onRemoveExercise }: Props) {
  const sets = exercise.sets;

  function updateSet(i: number, field: keyof LoggedSet, value: number | undefined) {
    const next = sets.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    onChange(next);
  }

  function addSet() {
    const last = sets[sets.length - 1];
    onChange([...sets, { weight: last?.weight ?? 0, reps: 0 }]);
  }

  function removeSet(i: number) {
    onChange(sets.filter((_, idx) => idx !== i));
  }

  return (
    <div className="bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg mb-2.5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
        <span className="font-bold text-[14px]">{exercise.name}</span>
        <button onClick={onRemoveExercise} className="tap-scale text-[var(--danger)] text-[10px] font-bold uppercase">
          Remove
        </button>
      </div>

      <div className="p-3">
        <ProgressionCard result={progression} />

        <div className="grid grid-cols-[20px_1fr_1fr_1fr_44px] gap-1.5 items-center mb-1.5 px-0.5">
          <span className="text-[8px] text-[var(--text-mute)] uppercase font-bold">Set</span>
          <span className="text-[8px] text-[var(--text-mute)] uppercase font-bold">Previous</span>
          <span className="text-[8px] text-[var(--accent-2)] uppercase font-bold">Lbs</span>
          <span className="text-[8px] text-[var(--accent-2)] uppercase font-bold">Reps</span>
          <span className="text-[8px] text-[var(--text-mute)] uppercase font-bold text-center">RPE</span>
        </div>

        {sets.map((set, i) => {
          const prev = previousSets?.[i];
          return (
            <div key={i} className="grid grid-cols-[20px_1fr_1fr_1fr_44px] gap-1.5 items-center mb-1.5">
              <span className="font-display text-[10px] text-[var(--text-mute)] text-center">{i + 1}</span>
              <span className="text-[12px] text-[var(--text-faint)]">
                {prev ? `${prev.weight}×${prev.reps}` : "—"}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={set.weight || ""}
                onChange={(e) => updateSet(i, "weight", parseFloat(e.target.value) || 0)}
                placeholder={prev ? String(prev.weight) : "0"}
                className="w-full bg-[var(--bg-inset-2)] border border-[var(--border)] rounded-md px-1.5 py-2 text-[14px] font-bold text-center text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
              <input
                type="number"
                inputMode="numeric"
                value={set.reps || ""}
                onChange={(e) => updateSet(i, "reps", parseInt(e.target.value, 10) || 0)}
                placeholder={prev ? String(prev.reps) : "0"}
                className="w-full bg-[var(--bg-inset-2)] border border-[var(--border)] rounded-md px-1.5 py-2 text-[14px] font-bold text-center text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={10}
                  inputMode="numeric"
                  value={set.effort ?? ""}
                  onChange={(e) => updateSet(i, "effort", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="-"
                  className="w-full bg-transparent border border-[var(--border-soft)] rounded-md px-1 py-2 text-[11px] text-center text-[var(--text-dim)] outline-none"
                />
                <button onClick={() => removeSet(i)} className="tap-scale text-[var(--text-faint)] text-[13px]">
                  ×
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={addSet}
          className="tap-scale w-full mt-1 text-[11px] font-bold uppercase tracking-wide text-[var(--accent-2)] border border-dashed border-[rgba(0,194,255,0.3)] rounded-md py-1.5"
        >
          + Add Set
        </button>
      </div>
    </div>
  );
}
