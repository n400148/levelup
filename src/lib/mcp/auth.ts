import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/mcp/tokens";
import { isLegacyReadOnly } from "@/lib/mcp/scopes";

/** Validates a `Bearer <token>` header against mcp_oauth_tokens and resolves the LiftCipher user it belongs to. */
export async function verifyBearerToken(authHeader: string | null): Promise<AuthInfo | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mcp_oauth_tokens")
    .select("user_id, client_id, scope, access_expires_at, revoked")
    .eq("access_token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data || data.revoked) return null;
  if (new Date(data.access_expires_at).getTime() <= Date.now()) return null;
  // Rejected so the client is forced through a fresh approval, which
  // grants edit access; otherwise it keeps refreshing a read-only token.
  if (isLegacyReadOnly(data.scope)) return null;

  return {
    token,
    clientId: data.client_id,
    scopes: data.scope ? data.scope.split(" ") : [],
    expiresAt: Math.floor(new Date(data.access_expires_at).getTime() / 1000),
    extra: { userId: data.user_id },
  };
}
