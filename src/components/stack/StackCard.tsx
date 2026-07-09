"use client";

import { useState } from "react";
import type { StackItem } from "@/lib/types";
import { dayCounter, formatShortDate, todayISO } from "@/lib/date";
import { Tag } from "@/components/ui/Chip";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DOSE_UNITS, FREQUENCIES } from "@/lib/stack-data";

export function StackCard({
  item,
  onEnd,
  onDelete,
  onSave,
  onChangeDose,
}: {
  item: StackItem;
  onEnd: () => void;
  onDelete: () => void;
  onSave: (patch: Partial<StackItem>) => void;
  onChangeDose: (next: { dose: number | null; unit: string | null; freq: string | null; note: string | null }) => void;
}) {
  const active = !item.endDate || item.endDate >= todayISO();
  const [editing, setEditing] = useState(false);
  const [changingDose, setChangingDose] = useState(false);
  const [draft, setDraft] = useState(item);
  const [newDose, setNewDose] = useState(item.dose?.toString() ?? "");
  const [newUnit, setNewUnit] = useState(item.unit ?? DOSE_UNITS[0]);
  const [newFreq, setNewFreq] = useState(item.freq ?? FREQUENCIES[0]);
  const [doseNote, setDoseNote] = useState("");

  if (changingDose) {
    return (
      <div className="bg-[var(--bg-inset)] border border-[var(--border)] rounded-lg p-3 mb-2.5 last:mb-0">
        <p className="text-[11px] text-[var(--text-faint)] mb-2.5 leading-snug">
          Closes out the current dose (ends today) and starts a new entry — so the change shows up in your history
          and the AI Coach can line it up against your weight and training data.
        </p>
        <div className="font-mono text-[11px] text-[var(--text-mute)] mb-2.5">
          Current: {item.dose ?? "–"} {item.unit ?? ""} · {item.freq ?? "–"}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>New Dose</Label>
            <Input type="number" inputMode="decimal" value={newDose} onChange={(e) => setNewDose(e.target.value)} />
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
              {DOSE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Label>Frequency</Label>
        <Select value={newFreq} onChange={(e) => setNewFreq(e.target.value)}>
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        <Label>Note (optional)</Label>
        <Input value={doseNote} onChange={(e) => setDoseNote(e.target.value)} placeholder="e.g. increased for plateau" />
        <div className="flex gap-2 mt-3.5">
          <Button
            variant="primary"
            full
            onClick={() => {
              onChangeDose({
                dose: newDose ? parseFloat(newDose) : null,
                unit: newUnit,
                freq: newFreq,
                note: doseNote.trim() || null,
              });
              setChangingDose(false);
            }}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            full
            onClick={() => {
              setNewDose(item.dose?.toString() ?? "");
              setNewUnit(item.unit ?? DOSE_UNITS[0]);
              setNewFreq(item.freq ?? FREQUENCIES[0]);
              setDoseNote("");
              setChangingDose(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="bg-[var(--bg-inset)] border border-[var(--border)] rounded-lg p-3 mb-2.5 last:mb-0">
        <Label>Name</Label>
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Dose</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={draft.dose ?? ""}
              onChange={(e) => setDraft({ ...draft, dose: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={draft.unit ?? ""} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>
              {DOSE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Label>Frequency</Label>
        <Select value={draft.freq ?? ""} onChange={(e) => setDraft({ ...draft, freq: e.target.value })}>
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={draft.startDate ?? ""}
              onChange={(e) => setDraft({ ...draft, startDate: e.target.value || null })}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={draft.endDate ?? ""}
              onChange={(e) => setDraft({ ...draft, endDate: e.target.value || null })}
            />
          </div>
        </div>
        <Label>Notes</Label>
        <Input value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <div className="flex gap-2 mt-3.5">
          <Button
            variant="primary"
            full
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            full
            onClick={() => {
              setDraft(item);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg p-3 mb-2.5 last:mb-0">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <div className="font-bold text-[14px]">{item.name}</div>
          <div className="font-mono text-[11px] text-[var(--text-mute)] mt-0.5">
            {item.dose ?? "–"} {item.unit ?? ""} · {item.freq ?? "–"}
          </div>
        </div>
        {active && item.startDate ? (
          <Tag tone="teal">
            Day <span className="font-mono">{dayCounter(item.startDate)}</span>
          </Tag>
        ) : (
          <Tag tone="red">Ended</Tag>
        )}
      </div>
      <div className="font-mono text-[10.5px] text-[var(--text-faint)] mb-2">
        {item.startDate ? formatShortDate(item.startDate) : "–"}
        {item.endDate ? ` → ${formatShortDate(item.endDate)}` : active ? " → ongoing" : ""}
      </div>
      {item.notes && <div className="text-[12px] text-[var(--text-dim)] mb-2 leading-snug">{item.notes}</div>}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setDraft(item);
            setEditing(true);
          }}
          className="tap-scale text-[10px] font-bold uppercase text-[var(--accent-2)]"
        >
          Edit
        </button>
        {active && (
          <button
            onClick={() => setChangingDose(true)}
            className="tap-scale text-[10px] font-bold uppercase text-[var(--accent-2)]"
          >
            Change Dose
          </button>
        )}
        {active && (
          <button onClick={onEnd} className="tap-scale text-[10px] font-bold uppercase text-[var(--accent-2)]">
            End
          </button>
        )}
        <button onClick={onDelete} className="tap-scale text-[10px] font-bold uppercase text-[var(--danger)]">
          Delete
        </button>
      </div>
    </div>
  );
}
