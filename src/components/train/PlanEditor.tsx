"use client";

import { useState } from "react";
import type { PlanExercise } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function PlanEditor({
  exercises,
  presets,
  onAdd,
  onRemove,
}: {
  exercises: PlanExercise[];
  presets: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [custom, setCustom] = useState("");

  function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!custom.trim()) return;
    onAdd(custom.trim());
    setCustom("");
  }

  const planned = new Set(exercises.map((e) => e.name.toLowerCase()));

  return (
    <div>
      {exercises.length === 0 ? (
        <EmptyState icon="📋" text="No exercises planned for this day yet. Add some below." />
      ) : (
        <div className="mb-3">
          {exercises.map((ex) => (
            <div
              key={ex.name}
              className="flex items-center justify-between bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg px-3 py-2.5 mb-2"
            >
              <span className="font-semibold text-[13.5px]">{ex.name}</span>
              <button
                onClick={() => onRemove(ex.name)}
                className="tap-scale text-[var(--danger)] text-[10px] font-bold uppercase"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submitCustom} className="flex gap-2 mb-3">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Type any exercise…"
          className="flex-1"
        />
        <Button type="submit" variant="primary">
          Add
        </Button>
      </form>

      <div className="text-[10px] text-[var(--text-mute)] uppercase font-bold tracking-wide mb-1.5">
        Quick Add
      </div>
      <div className="flex flex-wrap">
        {presets
          .filter((p) => !planned.has(p.toLowerCase()))
          .map((p) => (
            <Chip key={p} onClick={() => onAdd(p)}>
              + {p}
            </Chip>
          ))}
      </div>
    </div>
  );
}
