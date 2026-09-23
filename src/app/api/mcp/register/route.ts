import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomToken } from "@/lib/mcp/tokens";

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
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((u): u is string => typeof u === "string")
    : [];
  if (redirectUris.length === 0) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "redirect_uris is required and must be a non-empty array." },
      { status: 400 },
    );
  }
  for (const uri of redirectUris) {
    let parsed: URL;
    try {
      parsed = new URL(uri);
    } catch {
      return NextResponse.json(
        { error: "invalid_redirect_uri", error_description: `Malformed redirect URI: ${uri}` },
        { status: 400 },
      );
    }
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !isLocalhost) {
      return NextResponse.json(
        { error: "invalid_redirect_uri", error_description: `Redirect URI must use https: ${uri}` },
        { status: 400 },
      );
    }
  }

  const clientId = `mcp_${randomToken(16)}`;
  const clientName = typeof body.client_name === "string" ? body.client_name.slice(0, 200) : null;

  const admin = createAdminClient();
  const { error } = await admin.from("mcp_oauth_clients").insert({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
  });
  if (error) {
    return NextResponse.json({ error: "server_error", error_description: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201 },
  );
}
