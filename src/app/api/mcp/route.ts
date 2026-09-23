import type { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyBearerToken } from "@/lib/mcp/auth";
import { buildMcpServer } from "@/lib/mcp/server";

// The actual MCP resource server. Deployed on Netlify as a serverless
// function, so there's no long-lived process to hold a session across
// requests — each request builds a fresh McpServer bound to the calling
// user and a stateless transport (JSON responses, no SSE stream kept open),
// which is exactly the mode the SDK's Streamable HTTP transport is designed
// for on serverless hosts.
export const dynamic = "force-dynamic";

async function handle(request: NextRequest): Promise<Response> {
  const origin = new URL(request.url).origin;
  const authInfo = await verifyBearerToken(request.headers.get("authorization"));

  if (!authInfo) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
      },
    });
  }

  const server = buildMcpServer((authInfo.extra as { userId: string }).userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request, { authInfo });
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
