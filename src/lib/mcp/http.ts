import { createClient } from "@supabase/supabase-js";

/**
 * The origin clients actually reached us on. `req.url` inside the Netlify
 * function can carry an internal host or http://, and MCP clients reject
 * discovery metadata whose issuer/resource doesn't exactly match the URL
 * they were given — so build it from the Host header and force https
 * everywhere except local dev.
 */
export function publicOrigin(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return `${isLocal ? url.protocol.replace(":", "") : "https"}://${host}`;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
};

export function withCors(res: Response): Response {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * TEMPORARY handshake diagnostics, written with the public key to the
 * insert-only mcp_debug_log table. Never pass tokens, codes, or secrets in
 * `detail`. Remove once the connector is confirmed working in production.
 */
export async function debugLog(
  req: Request,
  event: string,
  status: number | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const url = new URL(req.url);
    await client.from("mcp_debug_log").insert({
      event,
      method: req.method,
      path: url.pathname,
      status,
      detail: {
        ...detail,
        ua: req.headers.get("user-agent"),
        host: req.headers.get("host"),
        xfHost: req.headers.get("x-forwarded-host"),
        xfProto: req.headers.get("x-forwarded-proto"),
        reqUrlOrigin: url.origin,
        publicOrigin: publicOrigin(req),
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.supabase_key),
      },
    });
  } catch {
    // Diagnostics must never break the real flow.
  }
}
