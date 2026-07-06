"use client";

import { useState } from "react";
import type { PlanExercise } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function PlanEditor({
  exercises,
  presets,
  onAdd,
  onRemove,
  onConfigure,
}: {
  exercises: PlanExercise[];
  presets: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onConfigure: (name: string, patch: Partial<PlanExercise>) => void;
}) {
  const [custom, setCustom] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

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
          {exercises.map((ex) => {
            const open = expanded === ex.name;
            return (
              <div
                key={ex.name}
                className="bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg mb-2 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="font-semibold text-[13.5px]">{ex.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpanded(open ? null : ex.name)}
                      className="tap-scale text-[var(--accent-2)] text-[10px] font-bold uppercase"
                    >
                      {open ? "Done" : "Configure"}
                    </button>
                    <button
                      onClick={() => onRemove(ex.name)}
                      className="tap-scale text-[var(--danger)] text-[10px] font-bold uppercase"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {!open && (ex.targetSets || ex.warmupSets || ex.restSeconds) && (
                  <div className="px-3 pb-2.5 -mt-1 text-[11px] text-[var(--text-faint)]">
                    {ex.warmupSets ? `${ex.warmupSets} warmup · ` : ""}
                    {ex.targetSets ?? 3} working sets
                    {ex.restSeconds ? ` · ${ex.restSeconds}s rest` : ""}
                  </div>
                )}
                {open && (
                  <div className="px-3 pb-3 border-t border-[var(--border-soft)] pt-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Warmup sets</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={ex.warmupSets ?? ""}
                          placeholder="0"
                          onChange={(e) =>
                            onConfigure(ex.name, { warmupSets: e.target.value ? parseInt(e.target.value, 10) : undefined })
                          }
                        />
                      </div>
                      <div>
                        <Label>Working sets</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={ex.targetSets ?? ""}
                          placeholder="3"
                          onChange={(e) =>
                            onConfigure(ex.name, { targetSets: e.target.value ? parseInt(e.target.value, 10) : undefined })
                          }
                        />
                      </div>
                      <div>
                        <Label>Rest (sec)</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={ex.restSeconds ?? ""}
                          placeholder="Off"
                          onChange={(e) =>
                            onConfigure(ex.name, { restSeconds: e.target.value ? parseInt(e.target.value, 10) : undefined })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
