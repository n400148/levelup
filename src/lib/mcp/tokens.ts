import { createHash, randomBytes } from "crypto";

/** A random, URL-safe opaque token — used for client IDs, auth codes, and access/refresh tokens. */
export function randomToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

/** Tokens are stored only as a SHA-256 hash, never in plaintext, so a DB read can't leak a usable credential. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** RFC 7636 PKCE S256 verification — the only challenge method this server accepts. */
export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash("sha256").update(codeVerifier).digest("base64url");
  return computed === codeChallenge;
}
