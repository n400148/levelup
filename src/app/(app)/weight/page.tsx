"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { weightFromRow, weightToRow } from "@/lib/mapping";
import type { WeightEntry } from "@/lib/types";
import { todayISO, formatShortDate } from "@/lib/date";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatRow, StatBlock } from "@/components/ui/StatBlock";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { DeltaPill } from "@/components/ui/Chip";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { WeightChart } from "@/components/weight/WeightChart";

export default function WeightPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("weights")
      .select("*")
      .order("date", { ascending: true });
    if (!error && data) {
      setEntries(data.map(weightFromRow));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !weight) return;
    const w = parseFloat(weight);
    if (Number.isNaN(w)) return;

    setSaving(true);
    setError(null);
    const entry: WeightEntry = { date, weight: Math.round(w * 10) / 10 };

    // optimistic
    setEntries((prev) => {
      const without = prev.filter((p) => p.date !== date);
      return [...without, entry].sort((a, b) => a.date.localeCompare(b.date));
    });

    const { error } = await supabase
      .from("weights")
      .upsert(weightToRow(user.id, entry), { onConflict: "user_id,date" });

    if (error) {
      setError(error.message);
    } else {
      setWeight("");
    }
    await load(); // reconcile with server truth
    setSaving(false);
  }

  async function handleDelete(d: string) {
    if (!user) return;
    setEntries((prev) => prev.filter((p) => p.date !== d));
    await supabase.from("weights").delete().eq("user_id", user.id).eq("date", d);
    await load();
  }

  const sorted = entries; // ascending
  const current = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const first = sorted[0];
  const lastChange = current && previous ? current.weight - previous.weight : 0;
  const totalChange = current && first ? current.weight - first.weight : 0;
  const chartEntries = sorted.slice(-60);
  const history = [...sorted].reverse();

  return (
    <div className="animate-rise">
      <Card>
        <CardTitle>Log Weight</CardTitle>
        <form onSubmit={handleLog} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Date</Label>
            <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label>Weight (lb)</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="185.4"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={saving} className="mb-0.5">
            {saving ? "…" : "Log"}
          </Button>
        </form>
        {error && <p className="text-[var(--danger)] text-[12px] mt-2">{error}</p>}
      </Card>

      {loading && (
        <Card>
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-20 w-full" />
        </Card>
      )}

      {!loading && sorted.length === 0 && (
        <Card>
          <EmptyState icon="⚖" text="No weigh-ins yet. Log today's weight above to start your trend line." />
        </Card>
      )}

      {sorted.length > 0 && (
        <>
          <Card>
            <StatRow>
              <StatBlock label="Current" value={current.weight.toFixed(1)} unit="lb" />
              <StatBlock
                label="Last Change"
                value={`${lastChange > 0 ? "+" : ""}${lastChange.toFixed(1)}`}
                unit="lb"
                tone={lastChange === 0 ? "default" : lastChange > 0 ? "danger" : "success"}
              />
              <StatBlock
                label="Total Change"
                value={`${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}`}
                unit="lb"
                tone={totalChange === 0 ? "default" : totalChange > 0 ? "danger" : "success"}
              />
            </StatRow>
          </Card>

          <Card>
            <CardTitle>Trend</CardTitle>
            <WeightChart entries={chartEntries} />
          </Card>

          <Card>
            <CardTitle>History</CardTitle>
            {history.map((entry, i) => {
              const prevEntry = history[i + 1];
              const delta = prevEntry ? entry.weight - prevEntry.weight : 0;
              return (
                <div
                  key={entry.date}
                  className="flex items-center justify-between bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg px-3 py-2.5 mb-2 last:mb-0"
                >
                  <div>
                    <div className="text-[10px] text-[var(--text-mute)] uppercase tracking-wide">
                      {formatShortDate(entry.date)}
                    </div>
                    <div className="font-display text-[16px] font-bold">
                      {entry.weight.toFixed(1)} <span className="text-[11px] text-[var(--text-mute)]">lb</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {prevEntry && <DeltaPill value={delta} suffix=" lb" />}
                    <button
                      onClick={() => handleDelete(entry.date)}
                      className="tap-scale text-[var(--danger)] text-[11px] font-bold uppercase px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      <Disclaimer>
        Weight fluctuates daily from water, food, and hormones — judge your trend over weeks, not single readings.
      </Disclaimer>
    </div>
  );
}
