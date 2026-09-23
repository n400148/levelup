import type { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyBearerToken } from "@/lib/mcp/auth";
import { buildMcpServer } from "@/lib/mcp/server";
import { corsPreflight, debugLog, publicOrigin, withCors } from "@/lib/mcp/http";

// The actual MCP resource server. Deployed on Netlify as a serverless
// function, so there's no long-lived process to hold a session across
// requests — each request builds a fresh McpServer bound to the calling
// user and a stateless transport (JSON responses, no SSE stream kept open),
// which is exactly the mode the SDK's Streamable HTTP transport is designed
// for on serverless hosts.
export const dynamic = "force-dynamic";

async function handle(request: NextRequest): Promise<Response> {
  const origin = publicOrigin(request);
  const hadAuthHeader = request.headers.has("authorization");
  const authInfo = await verifyBearerToken(request.headers.get("authorization"));

  if (!authInfo) {
    await debugLog(request, "mcp", 401, { hadAuthHeader });
    return withCors(
      new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
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
  const requestBody = await request.clone().text();
  const res = await transport.handleRequest(request, { authInfo });
  const detail: Record<string, unknown> = { authed: true };
  if (res.status >= 400) {
    let rpcMethods: unknown = null;
    try {
      const parsed = JSON.parse(requestBody);
      rpcMethods = (Array.isArray(parsed) ? parsed : [parsed]).map((m) => m?.method ?? "(response)");
    } catch {
      rpcMethods = "(unparseable)";
    }
    Object.assign(detail, {
      rpcMethods,
      protocolHeader: request.headers.get("mcp-protocol-version"),
      sessionHeader: request.headers.has("mcp-session-id"),
      accept: request.headers.get("accept"),
      contentType: request.headers.get("content-type"),
      responseBody: (await res.clone().text()).slice(0, 500),
    });
  }
  await debugLog(request, "mcp", res.status, detail);
  return withCors(res);
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
