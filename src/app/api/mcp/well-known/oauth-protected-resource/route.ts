import { NextResponse } from "next/server";
import { corsPreflight, debugLog, publicOrigin, withCors } from "@/lib/mcp/http";

// Mounted at /.well-known/oauth-protected-resource (and the path-suffixed
// /api/mcp variant) via rewrites in next.config.ts (RFC 9728) — a client
// that hits /api/mcp without a token gets a 401 whose WWW-Authenticate
// header points back here.
export async function GET(req: Request) {
  const origin = publicOrigin(req);
  await debugLog(req, "resource-metadata", 200);
  return withCors(
    NextResponse.json({
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: ["liftcipher:read"],
      bearer_methods_supported: ["header"],
    }),
  );
}

export function OPTIONS() {
  return corsPreflight();
}
