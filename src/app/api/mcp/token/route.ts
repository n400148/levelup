import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken, randomToken, verifyPkceS256 } from "@/lib/mcp/tokens";
import { corsPreflight, debugLog, withCors } from "@/lib/mcp/http";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

async function parseBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, String(v)]));
  }
  const form = await req.formData().catch(() => null);
  return form ? Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) : {};
}

function errorResponse(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

export async function POST(req: Request) {
  let res: Response;
  let grantType: string | undefined;
  try {
    const body = await parseBody(req);
    grantType = body.grant_type;
    res = await handleToken(body);
  } catch (e) {
    res = errorResponse("server_error", e instanceof Error ? e.message : String(e), 500);
  }
  const detail: Record<string, unknown> = { grantType };
  if (res.status !== 200) detail.error = await res.clone().text();
  await debugLog(req, "token", res.status, detail);
  return withCors(res);
}

export function OPTIONS() {
  return corsPreflight();
}

async function handleToken(body: Record<string, string>): Promise<Response> {
  const admin = createAdminClient();

  if (body.grant_type === "authorization_code") {
    const code = body.code;
    const redirectUri = body.redirect_uri;
    const clientId = body.client_id;
    const codeVerifier = body.code_verifier;
    if (!code || !redirectUri || !codeVerifier) {
      return errorResponse("invalid_request", "code, redirect_uri, and code_verifier are required.");
    }

    const { data: codeRow } = await admin.from("mcp_oauth_codes").select("*").eq("code", code).maybeSingle();

    if (!codeRow || codeRow.used || new Date(codeRow.expires_at).getTime() <= Date.now()) {
      return errorResponse("invalid_grant", "Authorization code is invalid, expired, or already used.");
    }
    if (clientId && codeRow.client_id !== clientId) {
      return errorResponse("invalid_grant", "client_id does not match the authorization code.");
    }
    if (codeRow.redirect_uri !== redirectUri) {
      return errorResponse("invalid_grant", "redirect_uri does not match the authorization code.");
    }
    if (!verifyPkceS256(codeVerifier, codeRow.code_challenge)) {
      return errorResponse("invalid_grant", "PKCE verification failed.");
    }

    // Single-use: mark it spent before issuing tokens so a replay of this
    // same code (e.g. a retried request) can never mint a second token pair.
    await admin.from("mcp_oauth_codes").update({ used: true }).eq("code", code);

    const accessToken = randomToken();
    const refreshToken = randomToken();
    const now = Date.now();
    const { error: insertError } = await admin.from("mcp_oauth_tokens").insert({
      access_token_hash: hashToken(accessToken),
      refresh_token_hash: hashToken(refreshToken),
      client_id: codeRow.client_id,
      user_id: codeRow.user_id,
      scope: codeRow.scope,
      access_expires_at: new Date(now + ACCESS_TOKEN_TTL_MS).toISOString(),
      refresh_expires_at: new Date(now + REFRESH_TOKEN_TTL_MS).toISOString(),
    });
    if (insertError) return errorResponse("server_error", insertError.message, 500);

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
      refresh_token: refreshToken,
      scope: codeRow.scope ?? undefined,
    });
  }

  if (body.grant_type === "refresh_token") {
    const refreshToken = body.refresh_token;
    if (!refreshToken) return errorResponse("invalid_request", "refresh_token is required.");

    const { data: tokenRow } = await admin
      .from("mcp_oauth_tokens")
      .select("*")
      .eq("refresh_token_hash", hashToken(refreshToken))
      .maybeSingle();

    if (
      !tokenRow ||
      tokenRow.revoked ||
      !tokenRow.refresh_expires_at ||
      new Date(tokenRow.refresh_expires_at).getTime() <= Date.now()
    ) {
      return errorResponse("invalid_grant", "Refresh token is invalid, expired, or revoked.");
    }

    // Rotate both tokens on every refresh — overwriting the row's hashes
    // makes the old refresh token unusable immediately, so a leaked-and-later-
    // replayed old token fails rather than silently minting a parallel pair.
    const newAccessToken = randomToken();
    const newRefreshToken = randomToken();
    const now = Date.now();
    const { error: updateError } = await admin
      .from("mcp_oauth_tokens")
      .update({
        access_token_hash: hashToken(newAccessToken),
        refresh_token_hash: hashToken(newRefreshToken),
        access_expires_at: new Date(now + ACCESS_TOKEN_TTL_MS).toISOString(),
        refresh_expires_at: new Date(now + REFRESH_TOKEN_TTL_MS).toISOString(),
      })
      .eq("id", tokenRow.id);
    if (updateError) return errorResponse("server_error", updateError.message, 500);

    return NextResponse.json({
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
      refresh_token: newRefreshToken,
      scope: tokenRow.scope ?? undefined,
    });
  }

  return errorResponse("unsupported_grant_type", `Unsupported grant_type: ${body.grant_type ?? "(none)"}`);
}
