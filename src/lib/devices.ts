import type { ScanDevice } from "@/lib/types";

export interface DeviceMeta {
  id: ScanDevice;
  label: string;
  shortLabel: string;
  errorLabel: string;
  /** Approximate ± body-fat percentage-point error, [low, high]. */
  errorPct: [number, number];
}

// Figures drawn from published DEXA-validation comparisons for each method;
// treat as general guidance, not a lab-grade spec sheet.
export const SCAN_DEVICES: DeviceMeta[] = [
  { id: "DEXA", label: "DEXA / DXA Scan", shortLabel: "DEXA", errorLabel: "±1–2%", errorPct: [1, 2] },
  { id: "HYDROSTATIC", label: "Hydrostatic Weighing", shortLabel: "Hydrostatic", errorLabel: "±2–3%", errorPct: [2, 3] },
  { id: "HUME", label: "Hume Body Pod", shortLabel: "Hume", errorLabel: "±2–3% (vs DEXA)", errorPct: [2, 3] },
  { id: "BODPOD", label: "BodPod (Air Displacement)", shortLabel: "BodPod", errorLabel: "±3%", errorPct: [3, 3] },
  { id: "CALIPERS", label: "Skinfold Calipers", shortLabel: "Calipers", errorLabel: "±3–4% (tester-dependent)", errorPct: [3, 4] },
  { id: "NAVY_TAPE", label: "Navy Tape Method", shortLabel: "Navy Tape", errorLabel: "±3–4%", errorPct: [3, 4] },
  { id: "INBODY", label: "InBody (BIA)", shortLabel: "InBody", errorLabel: "±3–5% (up to ±8% real-world)", errorPct: [3, 5] },
  { id: "EVOLT", label: "Evolt 360", shortLabel: "Evolt 360", errorLabel: "±3–5% (up to ±8% real-world)", errorPct: [3, 5] },
  { id: "BIA_SCALE", label: "Consumer BIA Scale", shortLabel: "BIA Scale", errorLabel: "±5–8%, hydration-sensitive", errorPct: [5, 8] },
  { id: "OTHER", label: "Other / Custom Method", shortLabel: "Other", errorLabel: "Varies by method", errorPct: [4, 6] },
];

export function getDeviceMeta(id: ScanDevice): DeviceMeta {
  return SCAN_DEVICES.find((d) => d.id === id) ?? SCAN_DEVICES[SCAN_DEVICES.length - 1];
}

/** e.g. "16.5–19.5% at ±1.5%" */
export function formatErrorRange(bf: number, device: ScanDevice): string {
  const meta = getDeviceMeta(device);
  const mid = (meta.errorPct[0] + meta.errorPct[1]) / 2;
  const low = (bf - mid).toFixed(1);
  const high = (bf + mid).toFixed(1);
  return `${low}–${high}% at ±${mid.toFixed(1)}%`;
}

export function errorMargin(device: ScanDevice): number {
  const meta = getDeviceMeta(device);
  return (meta.errorPct[0] + meta.errorPct[1]) / 2;
}
