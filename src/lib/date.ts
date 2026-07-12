// Fixed to Eastern Time rather than the device's own timezone/clock — PWAs
// can end up running with a stale or incorrect device timezone (or a
// service-worker-cached shell computed at an earlier moment), which showed
// up as "today" being off by a day for date inputs' max bound.
const APP_TIMEZONE = "America/New_York";

function partsInAppTimezone(d: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayISO(): string {
  const { year, month, day } = partsInAppTimezone(new Date());
  return toISO(year, month, day);
}

export function isoDaysAgo(days: number): string {
  const { year, month, day } = partsInAppTimezone(new Date());
  // Treat the Eastern-local calendar date as a date-only UTC instant so day
  // subtraction can't drift from the device's own timezone or DST changes.
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - days);
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso + "T00:00:00").getTime();
  const end = new Date(endIso + "T00:00:00").getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function dayCounter(startIso: string): number {
  return daysBetween(startIso, todayISO()) + 1;
}
