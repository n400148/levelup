import { NextResponse } from "next/server";
import { corsPreflight, debugLog, publicOrigin, withCors } from "@/lib/mcp/http";

// Mounted at /.well-known/oauth-authorization-server (and
// /.well-known/openid-configuration) via rewrites in next.config.ts — MCP
// clients (including Claude's connector) fetch this to discover how to
// register and authenticate before ever calling /api/mcp.
export async function GET(req: Request) {
  const origin = publicOrigin(req);
  await debugLog(req, "as-metadata", 200);
  return withCors(
    NextResponse.json({
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/api/mcp/token`,
      registration_endpoint: `${origin}/api/mcp/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["liftcipher:read"],
    }),
  );
}

export function OPTIONS() {
  return corsPreflight();
}
