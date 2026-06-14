import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { isValidAddress } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const walletId = searchParams.get("walletId");

  console.log(`[TWITTER LOGIN] Incoming request: address=${address}, walletId=${walletId}`);

  if (!address || !walletId) {
    console.error("[TWITTER LOGIN] Missing address or walletId");
    return NextResponse.redirect(new URL("/?authError=missing_params", getBaseUrl(request)));
  }

  // SECURITY: Validate address format
  if (!isValidAddress(address)) {
    return NextResponse.redirect(new URL("/?authError=invalid_address", getBaseUrl(request)));
  }

  // SECURITY: Require an existing session — the user must have signed in with their wallet first.
  // This prevents attackers from linking their Twitter to someone else's wallet.
  const session = await getSession();
  if (!session?.address || session.address.toLowerCase() !== address.toLowerCase()) {
    console.error("[TWITTER LOGIN] Session mismatch or missing. Must sign in with wallet first.");
    return NextResponse.redirect(new URL("/?authError=wallet_not_signed_in", getBaseUrl(request)));
  }

  const clientId = process.env.TWITTER_CLIENT_ID?.trim();
  if (!clientId) {
    console.error("[TWITTER LOGIN] TWITTER_CLIENT_ID env var is missing or empty");
    return NextResponse.redirect(new URL("/?authError=server_config", getBaseUrl(request)));
  }

  // 1. Generate PKCE verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // 2. Generate random state to prevent CSRF
  // NOTE: We no longer embed address/walletId in state. We read them from the
  // verified session in the callback, which is tamper-proof.
  // SECURITY: Bind the state to the session address to prevent OAuth CSRF / Session Fixation.
  const randomState = crypto.randomBytes(16).toString("hex");
  const hmac = crypto.createHmac("sha256", process.env.SESSION_SECRET || "default_fallback_secret")
    .update(randomState + session.address)
    .digest("hex");
  const state = `${randomState}.${hmac}`;

  // 3. Store code_verifier and randomState in secure cookies
  const cookieStore = await cookies();
  cookieStore.set("twitter_oauth_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  cookieStore.set("twitter_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // 4. Construct Twitter OAuth URL
  // SECURITY: Use dynamic redirect URI from environment, not hardcoded localhost
  const redirectUri = `${getBaseUrl(request)}/api/auth/twitter/callback`;

  const authUrl = new URL("https://x.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "users.read tweet.read");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log(`[TWITTER LOGIN] Redirect URI: ${redirectUri}`);

  return NextResponse.redirect(authUrl.toString());
}

function getBaseUrl(request: NextRequest): string {
  // Use explicit env var (required for production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  // Fall back to request headers (dev only)
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}
