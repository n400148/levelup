export const READ_SCOPE = "liftcipher:read";
export const WRITE_SCOPE = "liftcipher:write";
export const ALL_SCOPES = [READ_SCOPE, WRITE_SCOPE];

/** Keeps only scopes this server knows; an empty or missing request gets all of them (RFC 6749 §3.3 default). */
export function normalizeScope(requested: string | null | undefined): string {
  const asked = (requested ?? "").split(/\s+/).filter((s) => ALL_SCOPES.includes(s));
  return (asked.length ? [...new Set(asked)] : ALL_SCOPES).join(" ");
}
