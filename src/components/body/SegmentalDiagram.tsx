import type { AdvancedScanData } from "@/lib/types";
import { Input, Label } from "@/components/ui/Input";

type Key = keyof AdvancedScanData;
type Point = { x: number; y: number };

const VB_W = 100;
const VB_H = 224;

interface RegionSpec {
  label: string;
  anchor: Point;
  leanKey: Key;
  fatKey: Key;
  leanPos: Point;
  fatPos: Point;
  labelPos: Point;
}

const REGIONS: RegionSpec[] = [
  {
    label: "L ARM",
    anchor: { x: 23, y: 58 },
    leanKey: "leftArmLean",
    fatKey: "leftArmFat",
    leanPos: { x: 9, y: 40 },
    fatPos: { x: 9, y: 78 },
    labelPos: { x: 9, y: 30 },
  },
  {
    label: "R ARM",
    anchor: { x: 77, y: 58 },
    leanKey: "rightArmLean",
    fatKey: "rightArmFat",
    leanPos: { x: 91, y: 40 },
    fatPos: { x: 91, y: 78 },
    labelPos: { x: 91, y: 30 },
  },
  {
    label: "L LEG",
    anchor: { x: 40, y: 145 },
    leanKey: "leftLegLean",
    fatKey: "leftLegFat",
    leanPos: { x: 9, y: 128 },
    fatPos: { x: 9, y: 166 },
    labelPos: { x: 9, y: 118 },
  },
  {
    label: "R LEG",
    anchor: { x: 60, y: 145 },
    leanKey: "rightLegLean",
    fatKey: "rightLegFat",
    leanPos: { x: 91, y: 128 },
    fatPos: { x: 91, y: 166 },
    labelPos: { x: 91, y: 118 },
  },
  {
    label: "TORSO",
    anchor: { x: 50, y: 64 },
    leanKey: "torsoLean",
    fatKey: "torsoFat",
    leanPos: { x: 37, y: 210 },
    fatPos: { x: 63, y: 210 },
    labelPos: { x: 50, y: 200 },
  },
];

function BodySilhouette() {
  return (
    <g fill="var(--bg-inset-2)">
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
    </g>
  );
}

function MiniInput({
  pos,
  fieldKey,
  value,
  onChange,
  tone,
}: {
  pos: Point;
  fieldKey: Key;
  value: AdvancedScanData;
  onChange: (patch: Partial<AdvancedScanData>) => void;
  tone: "Lean" | "Fat";
}) {
  return (
    <div
      className="absolute w-9 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pos.x}%`, top: `${(pos.y / VB_H) * 100}%` }}
    >
      <div className="text-[6.5px] font-bold uppercase tracking-wide text-center text-[var(--text-faint)] leading-none mb-0.5">
        {tone}
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={fieldKey ? (value[fieldKey] ?? "") : ""}
        placeholder="0"
        onChange={(e) => onChange({ [fieldKey]: e.target.value ? parseFloat(e.target.value) : null })}
        className="w-full bg-[var(--bg-inset)] border border-[var(--border)] rounded px-0.5 py-1 text-[10px] font-mono text-center text-[var(--text)] outline-none focus:border-[var(--accent)]"
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
      <div className="relative w-full max-w-[260px] mx-auto" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 w-full h-full">
          <BodySilhouette />
          {REGIONS.map((r) => (
            <g key={r.label} stroke="var(--border)" strokeWidth="0.6">
              <line x1={r.anchor.x} y1={r.anchor.y} x2={r.leanPos.x} y2={r.leanPos.y} />
              <line x1={r.anchor.x} y1={r.anchor.y} x2={r.fatPos.x} y2={r.fatPos.y} />
            </g>
          ))}
          {REGIONS.map((r) => (
            <text
              key={`${r.label}-label`}
              x={r.labelPos.x}
              y={r.labelPos.y}
              fontSize="5.5"
              fontWeight="700"
              textAnchor="middle"
              fill="var(--text-mute)"
              style={{ letterSpacing: "0.05em" }}
            >
              {r.label}
            </text>
          ))}
        </svg>
        {REGIONS.map((r) => (
          <div key={r.label}>
            <MiniInput pos={r.leanPos} fieldKey={r.leanKey} value={value} onChange={onChange} tone="Lean" />
            <MiniInput pos={r.fatPos} fieldKey={r.fatKey} value={value} onChange={onChange} tone="Fat" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
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
