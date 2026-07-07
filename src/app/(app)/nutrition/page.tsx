"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { nutritionFromRow, nutritionToRow } from "@/lib/mapping";
import type { NutritionEntry, UserGoals } from "@/lib/types";
import { calculateMacros } from "@/lib/macros";
import { todayISO, formatShortDate } from "@/lib/date";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Skeleton } from "@/components/ui/Skeleton";
import { MacroBar } from "@/components/nutrition/MacroBar";
import { CalorieChart } from "@/components/nutrition/CalorieChart";

export default function NutritionPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [bodyweight, setBodyweight] = useState<number | null>(null);
  const [leanMass, setLeanMass] = useState<number | null>(null);
  const [goal, setGoal] = useState<UserGoals["primaryGoal"]>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState({ calories: "", protein: "", carbs: "", fats: "", water: "" });

  async function loadAll() {
    const [nutritionRes, weightRes, scanRes, goalsRes] = await Promise.all([
      supabase.from("nutrition").select("*").order("date", { ascending: true }),
      supabase.from("weights").select("*").order("date", { ascending: false }).limit(1),
      supabase.from("body_scans").select("*").order("date", { ascending: false }).limit(1),
      supabase.from("user_goals").select("goals").maybeSingle(),
    ]);
    if (nutritionRes.data) setEntries(nutritionRes.data.map(nutritionFromRow));
    if (weightRes.data?.[0]) setBodyweight(Number(weightRes.data[0].weight));
    if (scanRes.data?.[0]?.lmm) setLeanMass(Number(scanRes.data[0].lmm));
    const goalsData = goalsRes.data?.goals as unknown as UserGoals | undefined;
    setGoal(goalsData?.primaryGoal ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const existing = entries.find((e) => e.date === date);
    setForm({
      calories: existing?.calories?.toString() ?? "",
      protein: existing?.protein?.toString() ?? "",
      carbs: existing?.carbs?.toString() ?? "",
      fats: existing?.fats?.toString() ?? "",
      water: existing?.water?.toString() ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, entries.length]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const entry: NutritionEntry = {
      date,
      calories: form.calories ? parseInt(form.calories, 10) : null,
      protein: form.protein ? parseInt(form.protein, 10) : null,
      carbs: form.carbs ? parseInt(form.carbs, 10) : null,
      fats: form.fats ? parseInt(form.fats, 10) : null,
      water: form.water ? parseInt(form.water, 10) : null,
    };
    await supabase.from("nutrition").upsert(nutritionToRow(user.id, entry), { onConflict: "user_id,date" });
    await loadAll();
    setSaving(false);
  }

  const macros = bodyweight ? calculateMacros(bodyweight, goal, leanMass) : null;
  const todayEntry = entries.find((e) => e.date === date);
  const history = [...entries].reverse().slice(0, 30);

  return (
    <div className="animate-rise">
      <Card>
        <CardTitle>Log Intake · Targets</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <form onSubmit={handleSave}>
            <Label>Date</Label>
            <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            <Label>Calories</Label>
            <Input type="number" inputMode="numeric" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="0" />
            <Label>Protein (g)</Label>
            <Input type="number" inputMode="numeric" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} placeholder="0" />
            <Label>Carbs (g)</Label>
            <Input type="number" inputMode="numeric" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} placeholder="0" />
            <Label>Fats (g)</Label>
            <Input type="number" inputMode="numeric" value={form.fats} onChange={(e) => setForm({ ...form, fats: e.target.value })} placeholder="0" />
            <Label>Water (oz)</Label>
            <Input type="number" inputMode="numeric" value={form.water} onChange={(e) => setForm({ ...form, water: e.target.value })} placeholder="0" />
            <Button type="submit" variant="primary" full className="mt-3.5" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>

          <div>
            <div className="eyebrow mb-1">Recommended</div>
            {!loading && !bodyweight && (
              <p className="text-[11px] text-[var(--text-faint)] leading-relaxed">
                Log a weight entry on the Weight tab to see your targets here.
              </p>
            )}
            {macros && (
              <>
                <p className="text-[10px] text-[var(--text-faint)] leading-relaxed mb-2">
                  {macros.isScanBased
                    ? `Scan-based · ${macros.leanMassLb} lb lean mass`
                    : "General estimate based only on your entered weight — log a body scan for targets based on your real lean mass."}
                </p>
                <div className="space-y-1.5 text-[13px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-mute)] font-body">Calories</span>
                    <span className="font-bold text-[#a996ff]">{macros.calories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-mute)] font-body">Protein</span>
                    <span className="font-bold">{macros.proteinG}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-mute)] font-body">Carbs</span>
                    <span className="font-bold">{macros.carbsG}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-mute)] font-body">Fats</span>
                    <span className="font-bold">{macros.fatG}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-mute)] font-body">Water</span>
                    <span className="font-bold">{macros.waterOz}oz</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-20 w-full" />
        </Card>
      )}

      {macros && (
        <Card>
          <CardTitle>Today vs Target</CardTitle>
          <MacroBar label="Calories" current={todayEntry?.calories ?? 0} target={macros.calories} unit="" />
          <MacroBar label="Protein" current={todayEntry?.protein ?? 0} target={macros.proteinG} unit="g" />
          <MacroBar label="Carbs" current={todayEntry?.carbs ?? 0} target={macros.carbsG} unit="g" />
          <MacroBar label="Fats" current={todayEntry?.fats ?? 0} target={macros.fatG} unit="g" />
          <MacroBar label="Water" current={todayEntry?.water ?? 0} target={macros.waterOz} unit="oz" />
        </Card>
      )}

      {entries.length >= 2 && (
        <Card>
          <CardTitle>Calorie Trend</CardTitle>
          <CalorieChart entries={entries.slice(-30)} />
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardTitle>History</CardTitle>
          {history.map((e) => (
            <div key={e.date} className="flex items-center justify-between bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg px-3 py-2 mb-2 last:mb-0">
              <span className="text-[11px] text-[var(--text-mute)] uppercase font-semibold">{formatShortDate(e.date)}</span>
              <span className="font-mono text-[12.5px] text-[var(--text-dim)]">
                {e.calories ?? "–"} kcal · P{e.protein ?? "–"} C{e.carbs ?? "–"} F{e.fats ?? "–"}
              </span>
            </div>
          ))}
        </Card>
      )}

      <Disclaimer>
        General nutrition information only, not dietary or medical advice. Targets are estimates — consult a
        registered dietitian or physician for individualized guidance.
      </Disclaimer>
    </div>
  );
}
