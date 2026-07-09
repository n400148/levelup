"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { RotationSlot, Split, SplitProgram, UserGoals, WorkoutPlans } from "@/lib/types";
import { sanitizeWorkoutPlans } from "@/lib/mapping";
import {
  SPLIT_MUSCLES,
  PROGRAMS,
  UNIVERSAL_SPLITS,
  CUSTOMIZABLE_SPLITS,
  PROGRAMS_WITH_ROTATION,
  DEFAULT_ROTATION,
  expandRotation,
  getProgram,
} from "@/lib/train-data";
import { MuscleFigure, PulseFigure } from "@/components/train/MuscleFigure";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface DraftSlot {
  id: string;
  slot: RotationSlot;
}

function toDraftSlots(slots: RotationSlot[]): DraftSlot[] {
  return slots.map((slot) => ({ id: crypto.randomUUID(), slot }));
}

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
  rotation: null,
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
  const [rotationProgram, setRotationProgram] = useState<SplitProgram | null>(null);
  const [rotationDraft, setRotationDraft] = useState<DraftSlot[]>(toDraftSlots(DEFAULT_ROTATION));
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  function startRotationBuilder(id: SplitProgram) {
    const existing = goals.splitProgram === id ? goals.rotation : null;
    setRotationDraft(toDraftSlots(existing && existing.length > 0 ? existing : DEFAULT_ROTATION));
    setRotationProgram(id);
  }

  function addRotationSlot(slot: RotationSlot) {
    setRotationDraft((prev) => [...prev, { id: crypto.randomUUID(), slot }]);
  }

  function removeRotationSlot(id: string) {
    setRotationDraft((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSlotDragStart(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    setDraggingSlotId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleSlotDragMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingSlotId) return;
    const currentIndex = rotationDraft.findIndex((s) => s.id === draggingSlotId);
    for (const [id, el] of slotRefs.current) {
      if (id === draggingSlotId) continue;
      const rect = el.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const targetIndex = rotationDraft.findIndex((s) => s.id === id);
        if (targetIndex !== -1 && targetIndex !== currentIndex) {
          const next = [...rotationDraft];
          const [moved] = next.splice(currentIndex, 1);
          next.splice(targetIndex, 0, moved);
          setRotationDraft(next);
        }
        break;
      }
    }
  }

  function handleSlotDragEnd() {
    setDraggingSlotId(null);
  }

  async function saveRotation() {
    if (!user || !rotationProgram || !rotationDraft.some((s) => s.slot === "cycle")) return;
    const next: UserGoals = {
      ...goals,
      splitProgram: rotationProgram,
      rotation: rotationDraft.map((s) => s.slot),
    };
    setGoals(next);
    setRotationProgram(null);
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
  const hasRotation = !!program && PROGRAMS_WITH_ROTATION.includes(program.id);

  if (rotationProgram) {
    const draftDays = getProgram(rotationProgram)?.days ?? [];
    return (
      <div className="animate-rise">
        <Card>
          <CardTitle>Set Your Rotation</CardTitle>
          <p className="text-[11px] text-[var(--text-faint)] mb-3">
            Build the pattern one block at a time — e.g. Cycle, Rest, Cycle, Rest for &ldquo;{draftDays.join("/")}{" "}
            Rest {draftDays.join("/")} Rest&rdquo;.
          </p>
          {rotationDraft.map((draft) => {
            const dragging = draggingSlotId === draft.id;
            return (
              <div
                key={draft.id}
                ref={(el) => {
                  if (el) slotRefs.current.set(draft.id, el);
                  else slotRefs.current.delete(draft.id);
                }}
                className={`flex items-center gap-1 bg-[var(--bg-inset)] border rounded-lg pl-1 pr-3 py-2 mb-2 transition-shadow ${
                  dragging
                    ? "border-[var(--accent)] shadow-[0_4px_16px_-4px_rgba(201,124,74,0.5)] z-10 relative"
                    : "border-[var(--border-soft)]"
                }`}
              >
                <button
                  type="button"
                  onPointerDown={(e) => handleSlotDragStart(e, draft.id)}
                  onPointerMove={handleSlotDragMove}
                  onPointerUp={handleSlotDragEnd}
                  onPointerCancel={handleSlotDragEnd}
                  aria-label="Drag to reorder"
                  className="tap-scale shrink-0 w-8 h-8 flex items-center justify-center text-[var(--text-faint)] text-[16px] touch-none cursor-grab active:cursor-grabbing"
                >
                  ⠿
                </button>
                <span className="flex-1 text-[12.5px] font-semibold">
                  {draft.slot === "rest" ? "Rest Day" : draftDays.join(" · ")}
                </span>
                <button
                  onClick={() => removeRotationSlot(draft.id)}
                  className="tap-scale text-[var(--danger)] text-[16px] leading-none px-1"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            );
          })}
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" full onClick={() => addRotationSlot("cycle")}>
              + Cycle
            </Button>
            <Button variant="secondary" full onClick={() => addRotationSlot("rest")}>
              + Rest
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" full onClick={() => setRotationProgram(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              full
              disabled={!rotationDraft.some((s) => s.slot === "cycle")}
              onClick={saveRotation}
            >
              Save
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
                onClick={() => {
                  if (p.id === "CUSTOM") startCustomBuilder();
                  else if (PROGRAMS_WITH_ROTATION.includes(p.id)) startRotationBuilder(p.id);
                  else chooseProgram(p.id);
                }}
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

      {hasRotation && program && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="mb-0">Your Rotation</CardTitle>
            <button
              onClick={() => startRotationBuilder(program.id)}
              className="tap-scale text-[10.5px] font-bold uppercase tracking-wide text-[var(--accent-2)]"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {expandRotation(program.days, goals.rotation ?? DEFAULT_ROTATION).map((slot, i) => (
              <span
                key={i}
                className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                  slot === "Rest"
                    ? "bg-[var(--bg-inset-2)] text-[var(--text-mute)]"
                    : "bg-[rgba(201,124,74,0.15)] text-[#dda06b]"
                }`}
              >
                {slot}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
