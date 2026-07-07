import type { AdvancedScanData, Sex } from "@/lib/types";
import { bodyFatRating, estimateBMR, visceralFatRating, waistToHipRating } from "@/lib/health-ranges";
import { RatingBadge } from "@/components/body/RatingBadge";
import { ADVANCED_FIELD_GROUPS } from "@/components/body/AdvancedScanFields";

export function AdvancedScanSummary({
  advanced,
  bf,
  weight,
  height,
  sex,
  birthYear,
}: {
  advanced: AdvancedScanData | null;
  bf: number | null;
  weight: number | null;
  height: number | null;
  sex: Sex | null;
  birthYear: number | null;
}) {
  const bfRating = bf != null ? bodyFatRating(bf, birthYear, sex) : null;
  const whrRating = advanced?.waistToHipRatio != null ? waistToHipRating(advanced.waistToHipRatio, sex) : null;
  const vfRating = advanced?.visceralFatLevel != null ? visceralFatRating(advanced.visceralFatLevel) : null;
  const bmrEstimate =
    advanced?.bmr != null && weight != null && height != null ? estimateBMR(weight, height, birthYear, sex) : null;

  const hasAnyRating = bfRating || whrRating || vfRating || bmrEstimate != null;
  const rows = ADVANCED_FIELD_GROUPS.flatMap((g) =>
    g.fields.filter((f) => advanced?.[f.key] != null).map((f) => ({ ...f, value: advanced![f.key]! })),
  );

  if (!hasAnyRating && rows.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border-soft)]">
      {hasAnyRating && (
        <div className="space-y-2 mb-3">
          {bfRating && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--text-dim)]">Body Fat %</span>
              <RatingBadge rating={bfRating} />
            </div>
          )}
          {whrRating && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--text-dim)]">Waist-to-Hip Ratio</span>
              <RatingBadge rating={whrRating} />
            </div>
          )}
          {vfRating && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--text-dim)]">Visceral Fat Level</span>
              <RatingBadge rating={vfRating} />
            </div>
          )}
          {bmrEstimate != null && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--text-dim)]">BMR vs. Mifflin-St Jeor Estimate</span>
              <span className="font-mono text-[11px] text-[var(--text-mute)]">
                {advanced!.bmr} logged · {bmrEstimate} est.
              </span>
            </div>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {rows.map((row) => (
            <div key={row.key} className="flex justify-between text-[11px]">
              <span className="text-[var(--text-faint)]">{row.label}</span>
              <span className="font-mono text-[var(--text-dim)]">
                {row.value}
                {row.unit ? ` ${row.unit}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-[var(--text-faint)] mt-3 leading-relaxed">
        Ratings use general published reference ranges (body fat: age/sex-adjusted; waist-to-hip: WHO; visceral fat:
        common consumer-BIA scale) — not a personalized medical assessment. Other advanced fields are logged as
        entered with no reference range applied.
      </p>
    </div>
  );
}
