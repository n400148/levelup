import type { Sex } from "@/lib/types";

export type RatingTone = "low" | "optimal" | "high";

export interface Rating {
  tone: RatingTone;
  label: string;
  detail: string;
}

function ageFromBirthYear(birthYear: number | null): number | null {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}

// Commonly published age/sex "healthy body fat %" reference bands (the
// convention popularized by Gallagher et al. 2000's BMI-correlated healthy
// body fat ranges). This is a general population reference, not a
// personalized clinical assessment — being outside the band isn't
// automatically "bad" (e.g. lean athletes routinely sit below it).
const BF_RANGES: { maxAge: number; male: [number, number]; female: [number, number] }[] = [
  { maxAge: 39, male: [8, 19], female: [21, 32] },
  { maxAge: 59, male: [11, 21], female: [23, 33] },
  { maxAge: 200, male: [13, 24], female: [24, 35] },
];

export function bodyFatRating(bf: number, birthYear: number | null, sex: Sex | null): Rating | null {
  const age = ageFromBirthYear(birthYear);
  if (age == null || !sex) return null;
  const bracket = BF_RANGES.find((r) => age <= r.maxAge) ?? BF_RANGES[BF_RANGES.length - 1];
  const [low, high] = bracket[sex];
  const who = sex === "male" ? "men" : "women";
  const detail = `Typical reference range for ${who} ~${age}y: ${low}–${high}%`;
  if (bf < low) return { tone: "low", label: "Below Typical Range", detail };
  if (bf > high) return { tone: "high", label: "Above Typical Range", detail };
  return { tone: "optimal", label: "Within Typical Range", detail };
}

// WHO waist-to-hip ratio risk cutoff (single published threshold, not
// age-adjusted): >=0.90 (men) / >=0.85 (women) indicates substantially
// increased risk of metabolic complications.
export function waistToHipRating(ratio: number, sex: Sex | null): Rating | null {
  if (!sex) return null;
  const cutoff = sex === "male" ? 0.9 : 0.85;
  const detail = `WHO threshold for ${sex === "male" ? "men" : "women"}: ${cutoff.toFixed(2)}`;
  return ratio >= cutoff
    ? { tone: "high", label: "Elevated Risk (WHO)", detail }
    : { tone: "optimal", label: "Lower Risk (WHO)", detail };
}

// Visceral fat rating scale used across most consumer multi-frequency BIA
// devices (Evolt, InBody, Omron, Tanita) — an industry convention, not a
// single peer-reviewed medical standard.
export function visceralFatRating(level: number): Rating {
  if (level < 10) return { tone: "optimal", label: "Healthy", detail: "Consumer-BIA scale: 1–9 healthy" };
  if (level < 15) return { tone: "high", label: "Elevated", detail: "Consumer-BIA scale: 10–14 elevated" };
  return { tone: "high", label: "Very High", detail: "Consumer-BIA scale: 15+ very high" };
}

// Mifflin-St Jeor BMR formula — a real, standard estimate to compare
// against a device-reported BMR, not a rating of the device's number.
export function estimateBMR(
  weightLb: number,
  heightIn: number,
  birthYear: number | null,
  sex: Sex | null,
): number | null {
  const age = ageFromBirthYear(birthYear);
  if (age == null || !sex || !weightLb || !heightIn) return null;
  const kg = weightLb * 0.453592;
  const cm = heightIn * 2.54;
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}
