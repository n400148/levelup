import type { StackItem } from "@/lib/types";
import { dayCounter, formatShortDate, todayISO } from "@/lib/date";
import { Tag } from "@/components/ui/Chip";

export function StackCard({
  item,
  onEnd,
  onDelete,
}: {
  item: StackItem;
  onEnd: () => void;
  onDelete: () => void;
}) {
  const active = !item.endDate || item.endDate >= todayISO();

  return (
    <div className="bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg p-3 mb-2.5 last:mb-0">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <div className="font-bold text-[14px]">{item.name}</div>
          <div className="text-[11px] text-[var(--text-mute)] mt-0.5">
            {item.dose ?? "–"} {item.unit ?? ""} · {item.freq ?? "–"}
          </div>
        </div>
        {active && item.startDate ? (
          <Tag tone="teal">Day {dayCounter(item.startDate)}</Tag>
        ) : (
          <Tag tone="red">Ended</Tag>
        )}
      </div>
      <div className="text-[10.5px] text-[var(--text-faint)] mb-2">
        {item.startDate ? formatShortDate(item.startDate) : "–"}
        {item.endDate ? ` → ${formatShortDate(item.endDate)}` : active ? " → ongoing" : ""}
      </div>
      {item.notes && <div className="text-[12px] text-[var(--text-dim)] mb-2 leading-snug">{item.notes}</div>}
      <div className="flex gap-2">
        {active && (
          <button onClick={onEnd} className="tap-scale text-[10px] font-bold uppercase text-[var(--accent-2)]">
            End
          </button>
        )}
        <button onClick={onDelete} className="tap-scale text-[10px] font-bold uppercase text-[var(--danger)]">
          Delete
        </button>
      </div>
    </div>
  );
}
