import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomToken } from "@/lib/mcp/tokens";

const CODE_TTL_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const form = await request.formData();
  const decision = String(form.get("decision") ?? "");
  const clientId = String(form.get("client_id") ?? "");
  const redirectUri = String(form.get("redirect_uri") ?? "");
  const codeChallenge = String(form.get("code_challenge") ?? "");
  const codeChallengeMethod = String(form.get("code_challenge_method") ?? "S256");
  const state = String(form.get("state") ?? "");
  const scope = String(form.get("scope") ?? "");

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("mcp_oauth_clients")
    .select("client_id, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!client || !client.redirect_uris.includes(redirectUri) || codeChallengeMethod !== "S256" || !codeChallenge) {
    return new NextResponse("Invalid authorization request.", { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = (claimsData?.claims as { sub?: string } | undefined)?.sub;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const redirect = new URL(redirectUri);

  if (decision !== "approve") {
    redirect.searchParams.set("error", "access_denied");
    if (state) redirect.searchParams.set("state", state);
    return NextResponse.redirect(redirect);
  }

  const code = randomToken();
  const { error } = await admin.from("mcp_oauth_codes").insert({
    code,
    client_id: clientId,
    user_id: userId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    scope: scope || null,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) {
    return new NextResponse("Failed to create authorization code.", { status: 500 });
  }

  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);
  return NextResponse.redirect(redirect);
}
