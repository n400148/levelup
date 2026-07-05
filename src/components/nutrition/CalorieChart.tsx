"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NutritionEntry } from "@/lib/types";
import { formatShortDate } from "@/lib/date";

export function CalorieChart({ entries }: { entries: NutritionEntry[] }) {
  const data = entries
    .filter((e) => e.calories != null)
    .map((e) => ({ label: formatShortDate(e.date), calories: e.calories as number }));

  if (data.length < 2) return null;

  return (
    <div className="h-[150px] -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "#86868f", fontSize: 9 }} axisLine={{ stroke: "#35353c" }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#86868f", fontSize: 9 }} axisLine={false} tickLine={false} width={34} />
          <Tooltip
            contentStyle={{ background: "#1e1e23", border: "1px solid #35353c", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#b0b0b8" }}
            formatter={(v) => [`${Number(v ?? 0)} kcal`, "Calories"]}
          />
          <Line type="monotone" dataKey="calories" stroke="#9b8cff" strokeWidth={2.5} dot={{ r: 2.5, fill: "#6c5ce7", strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
