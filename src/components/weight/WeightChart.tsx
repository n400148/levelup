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
            tick={{ fill: "#4a6080", fontSize: 9 }}
            axisLine={{ stroke: "#1a2a44" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fill: "#4a6080", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            contentStyle={{
              background: "#0d1424",
              border: "1px solid #1a2a44",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#8090a8" }}
            itemStyle={{ color: "#3d8bff" }}
            formatter={(v) => [`${Number(v ?? 0).toFixed(1)} lb`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#1e6bff"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: "#00c2ff", strokeWidth: 0 }}
            activeDot={{ r: 4.5, fill: "#00c2ff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
