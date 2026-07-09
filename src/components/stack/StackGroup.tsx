"use client";

import { useState } from "react";
import type { StackItem } from "@/lib/types";
import { formatShortDate, todayISO } from "@/lib/date";
import { Tag } from "@/components/ui/Chip";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DOSE_UNITS, FREQUENCIES } from "@/lib/stack-data";
import { StackCard } from "@/components/stack/StackCard";

export interface PastEntryInput {
  dose: number | null;
  unit: string | null;
  freq: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}

function AddPastEntryForm({ onCancel, onSave }: { onCancel: () => void; onSave: (entry: PastEntryInput) => void }) {
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState(DOSE_UNITS[0]);
  const [freq, setFreq] = useState(FREQUENCIES[0]);
  const [entryStart, setEntryStart] = useState(todayISO());
  const [entryEnd, setEntryEnd] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="bg-[var(--bg-inset-2)] border border-[var(--border)] rounded-lg p-3 mt-2">
      <p className="text-[11px] text-[var(--text-faint)] mb-2.5 leading-snug">
        Reconstruct a dose you already ran in the past — e.g. what you were actually taking before your first
        logged entry, or a change you forgot to record at the time.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Dose</Label>
          <Input type="number" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="250" />
        </div>
        <div>
          <Label>Unit</Label>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {DOSE_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Label>Frequency</Label>
      <Select value={freq} onChange={(e) => setFreq(e.target.value)}>
        {FREQUENCIES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={entryStart} max={todayISO()} onChange={(e) => setEntryStart(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={entryEnd}
            max={todayISO()}
            onChange={(e) => setEntryEnd(e.target.value)}
            placeholder="Leave blank if still ongoing"
          />
        </div>
      </div>
      <Label>Notes (optional)</Label>
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. what I was actually taking" />
      <div className="flex gap-2 mt-3.5">
        <Button
          variant="primary"
          full
          onClick={() =>
            onSave({
              dose: dose ? parseFloat(dose) : null,
              unit,
              freq,
              startDate: entryStart,
              endDate: entryEnd || null,
              notes: notes.trim() || null,
            })
          }
        >
          Save
        </Button>
        <Button variant="secondary" full onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function StackGroup({
  name,
  items,
  onEnd,
  onDelete,
  onSave,
  onChangeDose,
  onAddPast,
}: {
  name: string;
  items: StackItem[];
  onEnd: (id?: number) => void;
  onDelete: (id?: number) => void;
  onSave: (id: number | undefined, patch: Partial<StackItem>) => void;
  onChangeDose: (
    item: StackItem,
    next: { dose: number | null; unit: string | null; freq: string | null; note: string | null },
  ) => void;
  onAddPast: (entry: PastEntryInput) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingPast, setAddingPast] = useState(false);
  const today = todayISO();
  const sorted = [...items].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
  const activeEntry = sorted.find((i) => !i.endDate || i.endDate >= today);
  const lastEnded = sorted.find((i) => i.endDate);

  return (
    <div className="border border-[var(--border-soft)] rounded-lg mb-2.5 last:mb-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="tap-scale w-full flex items-center justify-between gap-2 p-3 bg-[var(--bg-inset)] text-left"
      >
        <div className="min-w-0">
          <div className="font-bold text-[14px] truncate">{name}</div>
          <div className="font-mono text-[11px] text-[var(--text-mute)] mt-0.5">
            {activeEntry
              ? `${activeEntry.dose ?? "–"} ${activeEntry.unit ?? ""} · ${activeEntry.freq ?? "–"}`
              : lastEnded
                ? `Ended ${formatShortDate(lastEnded.endDate!)}`
                : "No dose logged"}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {items.length > 1 && (
            <span className="text-[10px] font-bold text-[var(--text-faint)]">
              {items.length} {items.length === 1 ? "entry" : "entries"}
            </span>
          )}
          {!activeEntry && <Tag tone="red">Ended</Tag>}
          <span
            className={`text-[var(--text-faint)] text-[14px] leading-none transition-transform ${expanded ? "-rotate-180" : ""}`}
            aria-hidden
          >
            ⌄
          </span>
        </div>
      </button>
      {expanded && (
        <div className="p-2.5 pt-2.5 bg-[var(--bg-raised)]">
          {sorted.map((item) => (
            <StackCard
              key={item.id}
              item={item}
              onEnd={() => onEnd(item.id)}
              onDelete={() => onDelete(item.id)}
              onSave={(patch) => onSave(item.id, patch)}
              onChangeDose={(next) => onChangeDose(item, next)}
            />
          ))}
          {addingPast ? (
            <AddPastEntryForm
              onCancel={() => setAddingPast(false)}
              onSave={(entry) => {
                onAddPast(entry);
                setAddingPast(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingPast(true)}
              className="tap-scale w-full text-[11px] font-bold uppercase tracking-wide text-[var(--accent-2)] border border-dashed border-[var(--border)] rounded-md py-2 mt-1"
            >
              + Add Past Entry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
