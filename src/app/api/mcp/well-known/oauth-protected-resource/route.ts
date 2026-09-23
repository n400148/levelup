import { NextResponse } from "next/server";

// Mounted at /.well-known/oauth-protected-resource via a rewrite in
// next.config.ts (RFC 9728) — a client that hits /api/mcp without a token
// gets a 401 whose WWW-Authenticate header points back here.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: ["liftcipher:read"],
    bearer_methods_supported: ["header"],
  });
}
