import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function consentPage(opts: { clientName: string; email: string; hidden: Record<string, string> }): string {
  const fields = Object.entries(opts.hidden)
    .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`)
    .join("\n      ");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Authorize LiftCipher Connector</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #05070d; color: #f2f4fa;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  }
  .card {
    width: 100%; max-width: 380px; margin: 20px; padding: 32px 28px;
    background: #0d1120; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
    box-shadow: 0 20px 60px -20px rgba(0,0,0,0.6);
  }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 4px;
    background: linear-gradient(90deg, #6f8dff, #0437f2); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sub { font-size: 12px; color: #8a90a6; margin-bottom: 24px; }
  h1 { font-size: 16px; font-weight: 600; margin: 0 0 6px; }
  p { font-size: 13px; line-height: 1.5; color: #b7bcce; margin: 0 0 18px; }
  .scopes { list-style: none; padding: 0; margin: 0 0 24px; font-size: 12.5px; color: #d3d7e6; }
  .scopes li { padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.06); }
  .scopes li:first-child { border-top: none; }
  .actions { display: flex; gap: 10px; }
  button { flex: 1; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; }
  .approve { background: #0437f2; color: white; }
  .deny { background: rgba(255,255,255,0.06); color: #d3d7e6; }
  .email { font-size: 11px; color: #6f7590; margin-top: 20px; text-align: center; }
</style>
</head>
<body>
  <div class="card">
    <div class="brand">LiftCipher</div>
    <div class="sub">Connector authorization</div>
    <h1>${escapeHtml(opts.clientName)} wants to access your LiftCipher data</h1>
    <p>This lets it read your tracked data during chats. It cannot change or delete anything.</p>
    <ul class="scopes">
      <li>Weight, nutrition, and body scan history</li>
      <li>Workout plans and logged sets</li>
      <li>Peptide/supplement stack history</li>
      <li>Goals and standing meal plan</li>
    </ul>
    <form method="POST" action="/api/mcp/authorize">
      ${fields}
      <div class="actions">
        <button class="deny" type="submit" name="decision" value="deny">Deny</button>
        <button class="approve" type="submit" name="decision" value="approve">Allow</button>
      </div>
    </form>
    <div class="email">Signed in as ${escapeHtml(opts.email)}</div>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const responseType = searchParams.get("response_type");
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method") ?? "S256";
  const state = searchParams.get("state") ?? "";
  const scope = searchParams.get("scope") ?? "";

  if (responseType !== "code" || !clientId || !redirectUri || !codeChallenge) {
    return new NextResponse("Malformed authorization request — missing a required parameter.", { status: 400 });
  }
  if (codeChallengeMethod !== "S256") {
    return new NextResponse("Only PKCE code_challenge_method=S256 is supported.", { status: 400 });
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("mcp_oauth_clients")
    .select("client_id, client_name, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();

  // Redirect target isn't trusted until it's confirmed to belong to this
  // registered client, so a validation failure renders inline rather than
  // bouncing the browser to an attacker-supplied redirect_uri.
  if (!client || !client.redirect_uris.includes(redirectUri)) {
    return new NextResponse("Unknown client or unregistered redirect URI.", { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as { sub?: string; email?: string } | undefined;

  if (!claims?.sub) {
    const next = `/oauth/authorize${new URL(request.url).search}`;
    return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}`);
  }

  const html = consentPage({
    clientName: client.client_name || "A connected app",
    email: claims.email ?? "",
    hidden: {
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      state,
      scope,
    },
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
