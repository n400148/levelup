export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
