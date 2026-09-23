import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Service-role client for the MCP connector's server-to-server routes only
// (OAuth client registration/token issuance/verification, and the MCP
// resource server itself). These routes have no browser session cookie to
// authenticate with, so they bypass RLS using the service-role key and MUST
// manually scope every user-data query with `.eq("user_id", userId)`
// themselves. Never import this from client code or from a route that
// doesn't do that scoping — it has full read/write access to every table.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
