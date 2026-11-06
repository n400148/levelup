export const READ_SCOPE = "liftcipher:read";
export const WRITE_SCOPE = "liftcipher:write";
export const ALL_SCOPES = [READ_SCOPE, WRITE_SCOPE];

/**
 * What every approval grants, regardless of the `scope` the client asked
 * for (RFC 6749 lets the server issue a different scope and report it in
 * the token response). Claude kept asking for read-only from metadata it
 * cached before write access existed, so honoring the request left every
 * reconnect read-only. The consent screen lists both.
 */
export const GRANTED_SCOPE = ALL_SCOPES.join(" ");

/** Connections approved before write access existed; they must re-approve. */
export function isLegacyReadOnly(scope: string | null | undefined): boolean {
  return !(scope ?? "").split(" ").includes(WRITE_SCOPE);
}
