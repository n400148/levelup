import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // `oauth/` and `.well-known/` handle their own access control (the MCP
    // connector's OAuth flow serves anonymous clients and mid-flow-login
    // redirects that don't fit the generic "bounce to /login" rule below).
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|api/|auth/|oauth/|\\.well-known/|authorize$|token$|register$).*)",
  ],
};
