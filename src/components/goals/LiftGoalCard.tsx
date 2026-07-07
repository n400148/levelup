import type { LiftGoal } from "@/lib/types";

export function LiftGoalCard({
  goal,
  bestWeight,
  onDelete,
}: {
  goal: LiftGoal;
  bestWeight: number | null;
  onDelete: () => void;
}) {
  const current = bestWeight ?? goal.currentMax;
  const span = goal.targetMax - goal.currentMax;
  const pct = span === 0 ? 100 : Math.max(0, Math.min(100, ((current - goal.currentMax) / span) * 100));
  const reached = span >= 0 ? current >= goal.targetMax : current <= goal.targetMax;

  return (
    <div className="bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg p-3 mb-2.5 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-[14px]">{goal.exercise}</span>
        <button onClick={onDelete} className="tap-scale text-[var(--danger)] text-[10px] font-bold uppercase">
          Delete
        </button>
      </div>
      <div className="flex justify-between font-mono text-[11px] text-[var(--text-mute)] mb-1.5">
        <span>
          {goal.currentMax} → {goal.targetMax} {goal.unit}
        </span>
        <span className={reached ? "text-[var(--success)] font-bold" : "text-[var(--text-dim)]"}>
          {reached ? "Goal Reached" : `${pct.toFixed(0)}% there`}
        </span>
      </div>
      <div className="h-[6px] rounded-full bg-[var(--bg-inset-2)] overflow-hidden">
        <div
          className={`h-full rounded-full ${reached ? "bg-[var(--success)]" : "bg-gradient-to-r from-[#6c5ce7] to-[#9b8cff]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {bestWeight != null && (
        <div className="font-mono text-[10.5px] text-[var(--text-faint)] mt-1.5">
          Best logged: {bestWeight} {goal.unit}
          {goal.deadline ? ` · Target date ${goal.deadline}` : ""}
        </div>
      )}
    </div>
  );
}
