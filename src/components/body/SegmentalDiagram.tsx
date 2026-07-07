import type { AdvancedScanData } from "@/lib/types";
import { Input, Label } from "@/components/ui/Input";

type Key = keyof AdvancedScanData;

function BodySilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 200" className={className} aria-hidden fill="var(--bg-inset-2)">
      <circle cx="50" cy="16" r="11" />
      <rect x="45" y="25" width="10" height="9" rx="3" />
      <path d="M 30 40 Q 50 34 70 40 L 74 96 Q 50 104 26 96 Z" />
      <ellipse cx="27" cy="41" r="8" />
      <ellipse cx="73" cy="41" r="8" />
      <ellipse cx="20" cy="60" rx="6.5" ry="14" />
      <ellipse cx="80" cy="60" rx="6.5" ry="14" />
      <ellipse cx="17" cy="86" rx="5" ry="11" />
      <ellipse cx="83" cy="86" rx="5" ry="11" />
      <path d="M 32 96 Q 50 102 68 96 L 66 108 Q 50 112 34 108 Z" />
      <ellipse cx="40" cy="140" rx="9" ry="28" />
      <ellipse cx="60" cy="140" rx="9" ry="28" />
      <ellipse cx="40" cy="176" rx="6.5" ry="15" />
      <ellipse cx="60" cy="176" rx="6.5" ry="15" />
    </svg>
  );
}

function RegionInputs({
  label,
  leanKey,
  fatKey,
  value,
  onChange,
}: {
  label: string;
  leanKey: Key;
  fatKey: Key;
  value: AdvancedScanData;
  onChange: (patch: Partial<AdvancedScanData>) => void;
}) {
  return (
    <div>
      <div className="text-[9.5px] font-bold uppercase tracking-wide text-[var(--text-mute)] mb-1 text-center">
        {label}
      </div>
      <Label>Lean</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value[leanKey] ?? ""}
        placeholder="lb"
        className="text-center !px-1.5 !py-2 text-[13px]"
        onChange={(e) => onChange({ [leanKey]: e.target.value ? parseFloat(e.target.value) : null })}
      />
      <Label>Fat</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value[fatKey] ?? ""}
        placeholder="lb"
        className="text-center !px-1.5 !py-2 text-[13px]"
        onChange={(e) => onChange({ [fatKey]: e.target.value ? parseFloat(e.target.value) : null })}
      />
    </div>
  );
}

function pct(a: number, b: number): [number, number] {
  const total = a + b;
  if (total <= 0) return [50, 50];
  return [Math.round((a / total) * 100), Math.round((b / total) * 100)];
}

export function SegmentalDiagram({
  value,
  onChange,
}: {
  value: AdvancedScanData;
  onChange: (patch: Partial<AdvancedScanData>) => void;
}) {
  const { leftArmLean, rightArmLean, leftLegLean, rightLegLean, torsoLean } = value;
  const hasLimbs = [leftArmLean, rightArmLean, leftLegLean, rightLegLean].every(
    (v) => v != null && v > 0,
  );
  const leftRight = hasLimbs
    ? pct((leftArmLean ?? 0) + (leftLegLean ?? 0), (rightArmLean ?? 0) + (rightLegLean ?? 0))
    : null;
  const upperLower = hasLimbs
    ? pct((leftArmLean ?? 0) + (rightArmLean ?? 0) + (torsoLean ?? 0), (leftLegLean ?? 0) + (rightLegLean ?? 0))
    : null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col justify-between gap-6">
          <RegionInputs label="L. Arm" leanKey="leftArmLean" fatKey="leftArmFat" value={value} onChange={onChange} />
          <RegionInputs label="L. Leg" leanKey="leftLegLean" fatKey="leftLegFat" value={value} onChange={onChange} />
        </div>
        <div className="flex flex-col items-center">
          <BodySilhouette className="w-16 h-32 mb-2" />
          <RegionInputs label="Torso" leanKey="torsoLean" fatKey="torsoFat" value={value} onChange={onChange} />
        </div>
        <div className="flex flex-col justify-between gap-6">
          <RegionInputs label="R. Arm" leanKey="rightArmLean" fatKey="rightArmFat" value={value} onChange={onChange} />
          <RegionInputs label="R. Leg" leanKey="rightLegLean" fatKey="rightLegFat" value={value} onChange={onChange} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div>
          <Label>Waist-to-Hip Ratio</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.waistToHipRatio ?? ""}
            placeholder="0.85"
            onChange={(e) => onChange({ waistToHipRatio: e.target.value ? parseFloat(e.target.value) : null })}
          />
        </div>
        <div>
          <Label>Abdominal Circumference (in)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={value.abdominalCircumference ?? ""}
            placeholder="34"
            onChange={(e) =>
              onChange({ abdominalCircumference: e.target.value ? parseFloat(e.target.value) : null })
            }
          />
        </div>
      </div>

      {leftRight && upperLower && (
        <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[12px] text-[var(--text-dim)]">
          <div className="bg-[var(--bg-inset)] rounded-lg px-2.5 py-2 text-center">
            <div className="text-[9px] text-[var(--text-faint)] uppercase tracking-wide font-body mb-0.5">
              L / R Balance
            </div>
            {leftRight[0]}% / {leftRight[1]}%
          </div>
          <div className="bg-[var(--bg-inset)] rounded-lg px-2.5 py-2 text-center">
            <div className="text-[9px] text-[var(--text-faint)] uppercase tracking-wide font-body mb-0.5">
              Upper / Lower
            </div>
            {upperLower[0]}% / {upperLower[1]}%
          </div>
        </div>
      )}

      <p className="text-[10px] text-[var(--text-faint)] mt-2.5">
        Left/right and upper/lower balance are derived from the lean-mass entries above rather than asked for
        separately, to avoid double-entry drift from your printout.
      </p>
    </div>
  );
}
