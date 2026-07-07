"use client";

import { useEffect, useRef, useState } from "react";
import type { PlanExercise } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardIcon } from "@/components/ui/EmptyStateIcons";

export function PlanEditor({
  exercises,
  presets,
  onAdd,
  onRemove,
  onConfigure,
  onReorder,
}: {
  exercises: PlanExercise[];
  presets: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onConfigure: (name: string, patch: Partial<PlanExercise>) => void;
  onReorder: (next: PlanExercise[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [order, setOrder] = useState<PlanExercise[]>(exercises);
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Stay in sync with the parent's plan data, but don't fight an in-progress drag.
  useEffect(() => {
    if (!draggingName) setOrder(exercises);
  }, [exercises, draggingName]);

  function handleDragStart(e: React.PointerEvent<HTMLButtonElement>, name: string) {
    setDraggingName(name);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDragMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingName) return;
    const currentIndex = order.findIndex((x) => x.name === draggingName);
    for (const [name, el] of itemRefs.current) {
      if (name === draggingName) continue;
      const rect = el.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const targetIndex = order.findIndex((x) => x.name === name);
        if (targetIndex !== -1 && targetIndex !== currentIndex) {
          const next = [...order];
          const [moved] = next.splice(currentIndex, 1);
          next.splice(targetIndex, 0, moved);
          setOrder(next);
        }
        break;
      }
    }
  }

  function handleDragEnd() {
    if (draggingName) onReorder(order);
    setDraggingName(null);
  }

  function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!custom.trim()) return;
    onAdd(custom.trim());
    setCustom("");
  }

  const planned = new Set(order.map((e) => e.name.toLowerCase()));

  return (
    <div>
      {order.length === 0 ? (
        <EmptyState icon={<ClipboardIcon />} text="No exercises planned for this day yet. Add some below." />
      ) : (
        <div className="mb-3">
          {order.map((ex) => {
            const open = expanded === ex.name;
            const dragging = draggingName === ex.name;
            return (
              <div
                key={ex.name}
                ref={(el) => {
                  if (el) itemRefs.current.set(ex.name, el);
                  else itemRefs.current.delete(ex.name);
                }}
                className={`bg-[var(--bg-inset)] border rounded-lg mb-2 overflow-hidden transition-shadow ${
                  dragging ? "border-[var(--accent)] shadow-[0_4px_16px_-4px_rgba(108,92,231,0.5)] z-10 relative" : "border-[var(--border-soft)]"
                }`}
              >
                <div className="flex items-center justify-between pl-1 pr-3 py-2">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <button
                      type="button"
                      onPointerDown={(e) => handleDragStart(e, ex.name)}
                      onPointerMove={handleDragMove}
                      onPointerUp={handleDragEnd}
                      onPointerCancel={handleDragEnd}
                      aria-label="Drag to reorder"
                      className="tap-scale shrink-0 w-8 h-8 flex items-center justify-center text-[var(--text-faint)] text-[16px] touch-none cursor-grab active:cursor-grabbing"
                    >
                      ⠿
                    </button>
                    <span className="font-semibold text-[13.5px] truncate">{ex.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
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
                  <div className="pl-11 pr-3 pb-2.5 -mt-1 font-mono text-[11px] text-[var(--text-faint)]">
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
