import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Well-known OAuth discovery paths (RFC 8414 / RFC 9728) that MCP clients
  // fetch before touching /api/mcp — routed to real handlers under
  // /api/mcp/well-known/** since App Router treats a literal ".well-known"
  // segment awkwardly.
  async rewrites() {
    return [
      {
        source: "/.well-known/oauth-authorization-server",
        destination: "/api/mcp/well-known/oauth-authorization-server",
      },
      {
        source: "/.well-known/oauth-protected-resource",
        destination: "/api/mcp/well-known/oauth-protected-resource",
      },
      {
        source: "/.well-known/oauth-protected-resource/api/mcp",
        destination: "/api/mcp/well-known/oauth-protected-resource",
      },
    ];
  },
};

export default nextConfig;
