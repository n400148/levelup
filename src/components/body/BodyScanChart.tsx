"use client";

import { ComposedChart, ErrorBar, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BodyScan, ScanDevice } from "@/lib/types";
import { getDeviceMeta, errorMargin } from "@/lib/devices";
import { formatShortDate } from "@/lib/date";

export function BodyScanChart({ scans, device }: { scans: BodyScan[]; device: ScanDevice }) {
  const meta = getDeviceMeta(device);
  const margin = errorMargin(device);
  const data = scans
    .filter((s) => s.bf != null)
    .map((s) => ({ label: formatShortDate(s.date), bf: s.bf as number, err: margin }));

  if (data.length === 0) return null;

  return (
    <div className="mb-4 last:mb-0">
      <div className="eyebrow mb-1">
        {meta.shortLabel} <span className="text-[var(--text-faint)] font-normal normal-case tracking-normal">· {meta.errorLabel}</span>
      </div>
      <div className="h-[140px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#8791b8", fontSize: 9, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: "#2a3660" }} tickLine={false} />
            <YAxis tick={{ fill: "#8791b8", fontSize: 9, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} width={34} unit="%" />
            <Tooltip
              contentStyle={{ background: "#10162a", border: "1px solid #2a3660", borderRadius: 10, fontSize: 12, fontFamily: "var(--font-mono)" }}
              labelStyle={{ color: "#b6bfe0" }}
              formatter={(v) => [`${Number(v ?? 0).toFixed(1)}%`, "Body Fat"]}
            />
            <Line type="monotone" dataKey="bf" stroke="#6f8dff" strokeWidth={2.5} dot={{ r: 3, fill: "#0437f2", strokeWidth: 0 }}>
              <ErrorBar dataKey="err" width={4} stroke="rgba(111,141,255,0.5)" strokeWidth={1.5} />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
