import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSession, getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = getBaseUrl(request);

  console.log(`[TWITTER CALLBACK] Received: code=${code ? "present" : "missing"}, state=${state ? "present" : "missing"}, error=${error || "none"}`);

  // Handle Twitter OAuth errors (user denied, etc.)
  if (error) {
    console.log(`[TWITTER CALLBACK] Twitter returned error: ${error}`);
    return NextResponse.redirect(new URL(`/?authError=${encodeURIComponent(error)}`, baseUrl));
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("twitter_oauth_verifier")?.value;
  const storedState = cookieStore.get("twitter_oauth_state")?.value;

  // Clear authentication cookies immediately
  cookieStore.delete("twitter_oauth_verifier");
  cookieStore.delete("twitter_oauth_state");

  if (!code || !state) {
    console.log("[TWITTER CALLBACK] Missing code or state from Twitter");
    return NextResponse.redirect(new URL("/?authError=missing_code", baseUrl));
  }

  if (!verifier || !storedState) {
    console.log("[TWITTER CALLBACK] Missing verifier or storedState cookies - they may have expired (10 min limit)");
    return NextResponse.redirect(new URL("/?authError=expired_session", baseUrl));
  }

  const session = await getSession();
  if (!session?.address) {
    console.log("[TWITTER CALLBACK] No session — user must sign in with wallet first");
    return NextResponse.redirect(new URL("/?authError=wallet_not_signed_in", baseUrl));
  }
  const address = session.address;

  // Verify CSRF state and session binding
  if (state !== storedState) {
    console.log(`[TWITTER CALLBACK] CSRF state mismatch`);
    return NextResponse.redirect(new URL("/?authError=csrf_mismatch", baseUrl));
  }

  // SECURITY: Re-compute HMAC to ensure this state was generated for THIS wallet address
  // This prevents OAuth Session Fixation attacks
  const crypto = require("crypto");
  const [randomState, providedHmac] = state.split(".");
  if (!randomState || !providedHmac) {
    console.log(`[TWITTER CALLBACK] Invalid state format`);
    return NextResponse.redirect(new URL("/?authError=csrf_mismatch", baseUrl));
  }
  
  const expectedHmac = crypto.createHmac("sha256", process.env.SESSION_SECRET || "default_fallback_secret")
    .update(randomState + address)
    .digest("hex");

  if (providedHmac !== expectedHmac) {
    console.log(`[TWITTER CALLBACK] State session binding failed (Session Fixation attempt)`);
    return NextResponse.redirect(new URL("/?authError=csrf_mismatch", baseUrl));
  }

  // SECURITY: Use dynamic redirect URI matching the login route
  const redirectUri = `${baseUrl}/api/auth/twitter/callback`;
  const clientId = process.env.TWITTER_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.TWITTER_CLIENT_SECRET?.trim() || "";

  if (!clientId || !clientSecret) {
    console.log("[TWITTER CALLBACK] Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET env vars");
    return NextResponse.redirect(new URL("/?authError=server_config", baseUrl));
  }

  try {
    // 1. Exchange auth code for access token
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log(`[TWITTER CALLBACK] Token exchange failed: status=${tokenResponse.status}`);
      return NextResponse.redirect(new URL("/?authError=token_exchange_failed", baseUrl));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Twitter
    const userResponse = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      console.log(`[TWITTER CALLBACK] User profile fetch failed: status=${userResponse.status}`);
      return NextResponse.redirect(new URL("/?authError=profile_fetch_failed", baseUrl));
    }

    const userData = await userResponse.json();
    const username = userData.data?.username;

    if (!username) {
      console.log("[TWITTER CALLBACK] No username in Twitter response");
      return NextResponse.redirect(new URL("/?authError=no_username", baseUrl));
    }

    // 3. Upsert profile in Supabase (using admin client)
    // SECURITY: address comes from verified session, not from URL params
    const supabase = getSupabaseAdmin();

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        wallet_address: address,
        twitter_handle: username.toLowerCase(),
      },
      { onConflict: "wallet_address" }
    );

    if (upsertError) {
      console.log(`[TWITTER CALLBACK] DB upsert error: ${upsertError.message}`);
      return NextResponse.redirect(new URL("/?authError=db_error", baseUrl));
    }

    // Update session JWT with Twitter handle
    await createSession({ address, twitterHandle: username.toLowerCase() });
    console.log(`[TWITTER CALLBACK] Success! Twitter handle linked to address ${address.slice(0, 6)}...${address.slice(-4)}`);

    return NextResponse.redirect(new URL(`/?claimSuccess=true&handle=${encodeURIComponent(username.toLowerCase())}`, baseUrl));

  } catch (err: any) {
    console.error(`[TWITTER CALLBACK] Exception:`, err.message);
    return NextResponse.redirect(new URL("/?authError=internal_error", baseUrl));
  }
}

function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}
