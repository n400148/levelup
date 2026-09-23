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
        source: "/.well-known/openid-configuration",
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
      // Default endpoints older MCP clients fall back to when they can't
      // read the metadata above (MCP spec 2025-03-26).
      { source: "/authorize", destination: "/oauth/authorize" },
      { source: "/token", destination: "/api/mcp/token" },
      { source: "/register", destination: "/api/mcp/register" },
    ];
  },
};

export default nextConfig;
