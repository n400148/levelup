"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SPLITS, type WorkoutPlans } from "@/lib/types";
import { sanitizeWorkoutPlans } from "@/lib/mapping";
import { SPLIT_MUSCLES } from "@/lib/train-data";
import { MuscleFigure, PulseFigure } from "@/components/train/MuscleFigure";
import { Card, CardTitle } from "@/components/ui/Card";

export default function TrainPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<WorkoutPlans>({});

  useEffect(() => {
    supabase
      .from("workout_plans")
      .select("plans")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.plans) setPlans(sanitizeWorkoutPlans(data.plans));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-rise">
      <Card>
        <CardTitle>Choose Your Split</CardTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {SPLITS.map((split) => {
            const dayCount = Object.keys(plans[split] ?? {}).length;
            const exerciseCount = Object.values(plans[split] ?? {}).reduce((n, d) => n + d.length, 0);
            return (
              <Link
                key={split}
                href={`/train/${encodeURIComponent(split)}`}
                className="tap-scale bg-[var(--bg-inset)] border border-[var(--border)] rounded-[12px] p-3 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-1.5">
                  {split === "Cardio" ? <PulseFigure /> : <MuscleFigure highlighted={SPLIT_MUSCLES[split]} />}
                </div>
                <div className="font-display text-[10px] tracking-wide text-[var(--accent-2)] uppercase">
                  {split}
                </div>
                <div className="text-[10px] text-[var(--text-faint)] mt-0.5">
                  {exerciseCount > 0 ? `${exerciseCount} exercises · ${dayCount} day${dayCount > 1 ? "s" : ""}` : "No plan yet"}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
