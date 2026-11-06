import type { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyBearerToken } from "@/lib/mcp/auth";
import { buildMcpServer } from "@/lib/mcp/server";
import { corsPreflight, publicOrigin, withCors } from "@/lib/mcp/http";
import { GRANTED_SCOPE } from "@/lib/mcp/scopes";

// The actual MCP resource server. Deployed on Netlify as a serverless
// function, so there's no long-lived process to hold a session across
// requests — each request builds a fresh McpServer bound to the calling
// user and a stateless transport (JSON responses, no SSE stream kept open),
// which is exactly the mode the SDK's Streamable HTTP transport is designed
// for on serverless hosts.
//
// Expected noise: Claude opens each connection with a `server/discover`
// call on protocol 2026-07-28, which this SDK version rejects with a 400;
// Claude then falls back to the classic initialize handshake, which works.
export const dynamic = "force-dynamic";

async function handle(request: NextRequest): Promise<Response> {
  const authInfo = await verifyBearerToken(request.headers.get("authorization"));

  if (!authInfo) {
    return withCors(
      new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${publicOrigin(request)}/.well-known/oauth-protected-resource", scope="${GRANTED_SCOPE}"`,
        },
      }),
    );
  }

  const server = buildMcpServer((authInfo.extra as { userId: string }).userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return withCors(await transport.handleRequest(request, { authInfo }));
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function DELETE(request: NextRequest) {
  return handle(request);
}

export function OPTIONS() {
  return corsPreflight();
}
