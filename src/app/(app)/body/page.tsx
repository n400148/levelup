"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { bodyScanFromRow, bodyScanToRow } from "@/lib/mapping";
import type { BodyScan, ScanDevice, UserGoals } from "@/lib/types";
import { SCAN_DEVICES, formatErrorRange } from "@/lib/devices";
import { todayISO, formatShortDate } from "@/lib/date";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/ui/EmptyStateIcons";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatRow, StatBlock } from "@/components/ui/StatBlock";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { BodyScanChart } from "@/components/body/BodyScanChart";

export default function BodyPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [scans, setScans] = useState<BodyScan[]>([]);
  const [targetBf, setTargetBf] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [device, setDevice] = useState<ScanDevice>("BIA_SCALE");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [height, setHeight] = useState("");

  async function loadAll() {
    const [scansRes, goalsRes] = await Promise.all([
      supabase.from("body_scans").select("*").order("date", { ascending: true }),
      supabase.from("user_goals").select("goals").maybeSingle(),
    ]);
    if (scansRes.data) setScans(scansRes.data.map(bodyScanFromRow));
    const goalsData = goalsRes.data?.goals as unknown as UserGoals | undefined;
    setTargetBf(goalsData?.targetBf ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const w = weight ? parseFloat(weight) : null;
    const bfVal = bf ? parseFloat(bf) : null;
    const scan: BodyScan = {
      date,
      weight: w,
      bf: bfVal,
      lmm: w && bfVal ? Math.round(w * (1 - bfVal / 100) * 10) / 10 : null,
      height: height ? parseFloat(height) : null,
      goalBf: targetBf,
      device,
      deviceLabel: device === "OTHER" ? deviceLabel || null : null,
    };
    await supabase.from("body_scans").insert(bodyScanToRow(user.id, scan));
    await loadAll();
    setWeight("");
    setBf("");
    setSaving(false);
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    await supabase.from("body_scans").delete().eq("id", id);
    await loadAll();
  }

  const latest = scans[scans.length - 1];
  const first = scans[0];
  const byDevice = useMemo(() => {
    const groups = new Map<ScanDevice, BodyScan[]>();
    for (const s of scans) {
      const list = groups.get(s.device) ?? [];
      list.push(s);
      groups.set(s.device, list);
    }
    return groups;
  }, [scans]);

  const ringPct = (() => {
    if (!latest?.bf || !first?.bf || targetBf == null || targetBf === first.bf) return null;
    const p = ((first.bf - latest.bf) / (first.bf - targetBf)) * 100;
    return Math.max(0, Math.min(100, p));
  })();

  const history = [...scans].reverse();

  return (
    <div className="animate-rise">
      <Card>
        <CardTitle>Log Body Scan</CardTitle>
        <form onSubmit={handleSave}>
          <Label>Date</Label>
          <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          <Label>Method / Device</Label>
          <Select value={device} onChange={(e) => setDevice(e.target.value as ScanDevice)}>
            {SCAN_DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} ({d.errorLabel})
              </option>
            ))}
          </Select>
          {device === "OTHER" && (
            <>
              <Label>Describe Method</Label>
              <Input value={deviceLabel} onChange={(e) => setDeviceLabel(e.target.value)} placeholder="e.g. 3D body scanner" />
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Weight (lb)</Label>
              <Input type="number" inputMode="decimal" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="185.0" />
            </div>
            <div>
              <Label>Body Fat %</Label>
              <Input type="number" inputMode="decimal" step="0.1" value={bf} onChange={(e) => setBf(e.target.value)} placeholder="18.0" />
            </div>
          </div>
          <Label>Height (in, optional)</Label>
          <Input type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="70" />
          {bf && (
            <p className="font-mono text-[11px] text-[var(--text-faint)] mt-2">
              True-value range: {formatErrorRange(parseFloat(bf), device)}
            </p>
          )}
          <Button type="submit" variant="primary" full className="mt-3.5" disabled={saving}>
            {saving ? "Saving…" : "Save Scan"}
          </Button>
        </form>
      </Card>

      {loading && (
        <Card>
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-20 w-full" />
        </Card>
      )}

      {!loading && scans.length === 0 && (
        <Card>
          <EmptyState icon={<ChartIcon />} text="No body scans logged yet. Add your first scan above to start tracking body composition." />
        </Card>
      )}

      {latest && (
        <Card>
          <CardTitle>Latest Reading</CardTitle>
          <div className="flex items-center gap-4">
            {ringPct != null && (
              <ProgressRing pct={ringPct} label={`${ringPct.toFixed(0)}%`} sublabel="To Goal" />
            )}
            <div className="flex-1">
              <StatRow>
                <StatBlock label="Body Fat" value={latest.bf?.toFixed(1) ?? "–"} unit="%" />
                <StatBlock label="Lean Mass" value={latest.lmm?.toFixed(0) ?? "–"} unit="lb" />
                <StatBlock label="Weight" value={latest.weight?.toFixed(1) ?? "–"} unit="lb" />
              </StatRow>
            </div>
          </div>
        </Card>
      )}

      {byDevice.size > 0 && (
        <Card>
          <CardTitle>Trends by Method</CardTitle>
          {Array.from(byDevice.entries()).map(([dev, list]) => (
            <BodyScanChart key={dev} scans={list} device={dev} />
          ))}
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardTitle>History</CardTitle>
          {history.map((s) => (
            <div key={s.id} className="bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg px-3 py-2.5 mb-2 last:mb-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-mute)] uppercase font-semibold">{formatShortDate(s.date)}</span>
                <button onClick={() => handleDelete(s.id)} className="tap-scale text-[var(--danger)] text-[10px] font-bold uppercase">
                  Delete
                </button>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-[15px] font-bold">
                  {s.bf != null ? `${s.bf.toFixed(1)}%` : "–"}{" "}
                  <span className="text-[11px] text-[var(--text-mute)] font-normal">
                    {s.weight ? `· ${s.weight.toFixed(1)} lb` : ""}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-[var(--text-faint)]">
                  {s.deviceLabel || SCAN_DEVICES.find((d) => d.id === s.device)?.shortLabel}
                  {s.bf != null ? ` · ${formatErrorRange(s.bf, s.device)}` : ""}
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Disclaimer>
        Body-composition readings are estimates with method-dependent error margins, not diagnostic measurements.
        Track trends over time rather than single readings, and don&apos;t mix methods when judging progress.
      </Disclaimer>
    </div>
  );
}
