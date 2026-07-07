"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeightEntry } from "@/lib/types";
import { formatShortDate } from "@/lib/date";

export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const data = entries.map((e) => ({ date: e.date, weight: e.weight, label: formatShortDate(e.date) }));
  const values = data.map((d) => d.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(1, (max - min) * 0.15);

  return (
    <div className="h-[180px] -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#96897a", fontSize: 9, fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "#413830" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fill: "#96897a", fontSize: 9, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            contentStyle={{
              background: "#26211a",
              border: "1px solid #413830",
              borderRadius: 10,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            labelStyle={{ color: "#bdb3a6" }}
            itemStyle={{ color: "#dda06b" }}
            formatter={(v) => [`${Number(v ?? 0).toFixed(1)} lb`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#c97c4a"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: "#dda06b", strokeWidth: 0 }}
            activeDot={{ r: 4.5, fill: "#dda06b" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
