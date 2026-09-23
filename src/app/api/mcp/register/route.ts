import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomToken } from "@/lib/mcp/tokens";
import { corsPreflight, debugLog, withCors } from "@/lib/mcp/http";

function fail(error: string, description: string, status: number) {
  return withCors(NextResponse.json({ error, error_description: description }, { status }));
}

// RFC 7591 Dynamic Client Registration — Claude's connector calls this once,
// on first setup, to register itself and get a client_id back before ever
// showing the user an "Authorize" screen. No auth required to register
// (that's standard for DCR); every registered client is a "public" client
// (no client_secret) that authenticates the user via PKCE instead.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    await debugLog(req, "register", 400, { reason: "non-JSON body" });
    return fail("invalid_client_metadata", "Request body must be JSON.", 400);
  }

  const meta = {
    redirect_uris: body.redirect_uris,
    token_endpoint_auth_method: body.token_endpoint_auth_method,
    grant_types: body.grant_types,
    client_name: body.client_name,
  };

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((u): u is string => typeof u === "string")
    : [];
  if (redirectUris.length === 0) {
    await debugLog(req, "register", 400, { ...meta, reason: "no redirect_uris" });
    return fail("invalid_redirect_uri", "redirect_uris is required and must be a non-empty array.", 400);
  }
  for (const uri of redirectUris) {
    let parsed: URL;
    try {
      parsed = new URL(uri);
    } catch {
      await debugLog(req, "register", 400, { ...meta, reason: `malformed redirect ${uri}` });
      return fail("invalid_redirect_uri", `Malformed redirect URI: ${uri}`, 400);
    }
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !isLocalhost) {
      await debugLog(req, "register", 400, { ...meta, reason: `non-https redirect ${uri}` });
      return fail("invalid_redirect_uri", `Redirect URI must use https: ${uri}`, 400);
    }
  }

  const clientId = `mcp_${randomToken(16)}`;
  const clientName = typeof body.client_name === "string" ? body.client_name.slice(0, 200) : null;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("mcp_oauth_clients").insert({
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await debugLog(req, "register", 500, { ...meta, reason: message });
    return fail("server_error", message, 500);
  }

  await debugLog(req, "register", 201, meta);
  return withCors(
    NextResponse.json(
      {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: clientName,
        redirect_uris: redirectUris,
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      { status: 201 },
    ),
  );
}

export function OPTIONS() {
  return corsPreflight();
}
