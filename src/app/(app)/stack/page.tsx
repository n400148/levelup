"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { stackItemFromRow, stackItemToRow } from "@/lib/mapping";
import type { StackItem, StackKind } from "@/lib/types";
import { PEPTIDE_PRESETS, SUPPLEMENT_PRESETS, DOSE_UNITS, FREQUENCIES } from "@/lib/stack-data";
import { todayISO } from "@/lib/date";
import { Card, CardTitle } from "@/components/ui/Card";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { VialIcon } from "@/components/ui/EmptyStateIcons";
import { Skeleton } from "@/components/ui/Skeleton";
import { StackGroup, type PastEntryInput } from "@/components/stack/StackGroup";

export default function StackPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [kind, setKind] = useState<StackKind>("peptide");
  const [items, setItems] = useState<StackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [customName, setCustomName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState(DOSE_UNITS[0]);
  const [freq, setFreq] = useState(FREQUENCIES[0]);
  const [startDate, setStartDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  const table = kind === "peptide" ? "peptides" : "supplements";
  const presets = kind === "peptide" ? PEPTIDE_PRESETS : SUPPLEMENT_PRESETS;

  async function load() {
    setLoading(true);
    const { data } = await supabase.from(table).select("*").order("start_date", { ascending: false });
    if (data) setItems(data.map(stackItemFromRow));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const finalName = name === "__custom__" ? customName.trim() : name;
    if (!finalName) return;

    setSaving(true);
    const item: StackItem = {
      name: finalName,
      dose: dose ? parseFloat(dose) : null,
      unit,
      freq,
      startDate,
      endDate: null,
      notes: notes.trim() || null,
    };
    await supabase.from(table).insert(stackItemToRow(user.id, item));
    await load();
    setName("");
    setCustomName("");
    setDose("");
    setNotes("");
    setSaving(false);
  }

  async function handleEnd(id?: number) {
    if (!id) return;
    await supabase.from(table).update({ end_date: todayISO() }).eq("id", id);
    await load();
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    await supabase.from(table).delete().eq("id", id);
    await load();
  }

  async function handleEdit(id: number | undefined, patch: Partial<StackItem>) {
    if (!id || !user) return;
    const merged = { ...items.find((i) => i.id === id)!, ...patch };
    await supabase.from(table).update(stackItemToRow(user.id, merged)).eq("id", id);
    await load();
  }

  // Ends the current entry today and opens a new one with the new dose, so
  // the change is preserved as history (visible in "Past" and fed to the AI
  // Coach) instead of silently overwriting the old dose in place.
  async function handleChangeDose(
    item: StackItem,
    next: { dose: number | null; unit: string | null; freq: string | null; note: string | null },
  ) {
    if (!item.id || !user) return;
    const today = todayISO();
    await supabase.from(table).update({ end_date: today }).eq("id", item.id);
    const changeNote = `Changed from ${item.dose ?? "–"}${item.unit ?? ""} to ${next.dose ?? "–"}${next.unit ?? ""}${
      next.note ? ` — ${next.note}` : ""
    }`;
    const newItem: StackItem = {
      name: item.name,
      dose: next.dose,
      unit: next.unit,
      freq: next.freq,
      startDate: today,
      endDate: null,
      notes: changeNote,
    };
    await supabase.from(table).insert(stackItemToRow(user.id, newItem));
    await load();
  }

  // Lets a dose from before this substance was first logged (or a change
  // that was never recorded at the time) be inserted directly, with its own
  // start/end date range, instead of only ever being able to split off from
  // today.
  async function handleAddPastEntry(name: string, entry: PastEntryInput) {
    if (!user) return;
    const item: StackItem = {
      name,
      dose: entry.dose,
      unit: entry.unit,
      freq: entry.freq,
      startDate: entry.startDate,
      endDate: entry.endDate,
      notes: entry.notes,
    };
    await supabase.from(table).insert(stackItemToRow(user.id, item));
    await load();
  }

  const today = todayISO();

  // Group every entry (active + past) by substance name so the history for
  // one peptide collapses into a single expandable row instead of one card
  // per dose change.
  const groups = new Map<string, StackItem[]>();
  for (const item of items) {
    const group = groups.get(item.name) ?? [];
    group.push(item);
    groups.set(item.name, group);
  }
  const activeGroups: [string, StackItem[]][] = [];
  const pastGroups: [string, StackItem[]][] = [];
  for (const entry of groups) {
    const [, group] = entry;
    const hasActive = group.some((i) => !i.endDate || i.endDate >= today);
    (hasActive ? activeGroups : pastGroups).push(entry);
  }

  return (
    <div className="animate-rise">
      <Card>
        <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
          <b className="text-[var(--text)]">Research &amp; tracking purposes only — not medical advice.</b> Consult a
          licensed healthcare provider before starting anything logged here. Some substances may be
          prescription-only or restricted in your region.
        </p>
      </Card>

      <SegmentedToggle
        value={kind}
        onChange={setKind}
        options={[
          { value: "peptide", label: "Peptides" },
          { value: "supplement", label: "Supplements" },
        ]}
      />

      <Card>
        <CardTitle>Add {kind === "peptide" ? "Peptide" : "Supplement"}</CardTitle>
        <form onSubmit={handleAdd}>
          <Label>Name</Label>
          <Select value={name} onChange={(e) => setName(e.target.value)} required>
            <option value="" disabled>
              Select…
            </option>
            {presets.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value="__custom__">Custom…</option>
          </Select>
          {name === "__custom__" && (
            <Input
              className="mt-2"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter name"
              required
            />
          )}

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

          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Source, protocol, observations…" />

          <Button type="submit" variant="primary" full className="mt-3.5" disabled={saving}>
            {saving ? "Saving…" : "Add"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Active</CardTitle>
        {loading ? (
          <>
            <Skeleton className="h-14 w-full mb-2" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : activeGroups.length === 0 ? (
          <EmptyState icon={<VialIcon />} text={`No active ${kind}s. Add one above to start tracking.`} />
        ) : (
          activeGroups.map(([n, group]) => (
            <StackGroup
              key={n}
              name={n}
              items={group}
              onEnd={handleEnd}
              onDelete={handleDelete}
              onSave={handleEdit}
              onChangeDose={handleChangeDose}
              onAddPast={(entry) => handleAddPastEntry(n, entry)}
            />
          ))
        )}
      </Card>

      {pastGroups.length > 0 && (
        <Card>
          <CardTitle>Past</CardTitle>
          {pastGroups.map(([n, group]) => (
            <StackGroup
              key={n}
              name={n}
              items={group}
              onEnd={handleEnd}
              onDelete={handleDelete}
              onSave={handleEdit}
              onChangeDose={handleChangeDose}
              onAddPast={(entry) => handleAddPastEntry(n, entry)}
            />
          ))}
        </Card>
      )}

      <Disclaimer>
        Tracking tool only. Not a recommendation to use any substance, and not a substitute for professional medical
        guidance.
      </Disclaimer>
    </div>
  );
}
