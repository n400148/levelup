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
          <XAxis dataKey="label" tick={{ fill: "#8791b8", fontSize: 9, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: "#2a3660" }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#8791b8", fontSize: 9, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} width={34} />
          <Tooltip
            contentStyle={{ background: "#10162a", border: "1px solid #2a3660", borderRadius: 10, fontSize: 12, fontFamily: "var(--font-mono)" }}
            labelStyle={{ color: "#b6bfe0" }}
            formatter={(v) => [`${Number(v ?? 0)} kcal`, "Calories"]}
          />
          <Line type="monotone" dataKey="calories" stroke="#6f8dff" strokeWidth={2.5} dot={{ r: 2.5, fill: "#0437f2", strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
