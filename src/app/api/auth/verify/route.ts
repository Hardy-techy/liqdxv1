import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidAddress } from "@/lib/validate";
import { checkCsrf } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { verifyMessage } from "viem";

/**
 * POST /api/auth/verify
 *
 * Wallet signature authentication (SIWE-lite).
 * The frontend signs a message with the user's wallet, sends it here,
 * and we verify the signature to create a session.
 *
 * Body: { address, message, signature }
 */
export async function POST(req: Request) {
  try {
    // CSRF check
    const csrfError = checkCsrf(req);
    if (csrfError) return csrfError;

    const body = await req.json();
    const { address, message, signature } = body;

    // Validate inputs
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
    }
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Signed message required" }, { status: 400 });
    }
    if (!signature || typeof signature !== "string") {
      return NextResponse.json({ error: "Signature required" }, { status: 400 });
    }

    // Rate limit: 5 sign-in attempts per minute per address
    const rl = rateLimit(`auth-verify:${address.toLowerCase()}`, 5, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please wait." }, { status: 429 });
    }

    // Validate the message format (must contain expected fields)
    const expectedStatement = "Sign in to Liqdx";
    if (!message.includes(expectedStatement)) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    const cookieStore = await import("next/headers").then(m => m.cookies());
    const storedNonce = cookieStore.get("auth_nonce")?.value;

    if (!storedNonce) {
      return NextResponse.json({ error: "Nonce expired or missing. Please refresh and try again." }, { status: 400 });
    }

    // Clear the nonce immediately to prevent reuse (one-time use)
    cookieStore.delete("auth_nonce");

    // Extract and validate the Nonce from the message
    const nonceMatch = message.match(/Nonce: ([a-zA-Z0-9]+)/);
    if (!nonceMatch || nonceMatch[1] !== storedNonce) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 400 });
    }

    // Extract and validate the URI domain binding
    const uriMatch = message.match(/URI: (.+)/);
    const expectedUri = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (!uriMatch || uriMatch[1].trim() !== expectedUri) {
      return NextResponse.json({ error: "Invalid URI binding" }, { status: 400 });
    }

    // Extract and validate the timestamp from the message
    const timestampMatch = message.match(/Issued At: (.+)$/m);
    if (timestampMatch) {
      const issuedAt = new Date(timestampMatch[1]);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;
      if (isNaN(issuedAt.getTime()) || Math.abs(now.getTime() - issuedAt.getTime()) > fiveMinutes) {
        return NextResponse.json({ error: "Message expired. Please sign again." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Missing Issued At timestamp" }, { status: 400 });
    }

    // Verify the signature using viem
    let isValid = false;
    try {
      isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (err) {
      console.error("Signature verification error:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (!isValid) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    // Signature verified! Create session.
    // Check if user already has a profile (for Twitter handle)
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("profiles")
      .select("twitter_handle")
      .ilike("wallet_address", address)
      .single();

    const twitterHandle = profile?.twitter_handle || undefined;

    // Upsert profile to ensure wallet_address exists in profiles
    // (will not overwrite existing twitter_handle or circle_wallet_id)
    await supabase.from("profiles").upsert(
      { wallet_address: address },
      { onConflict: "wallet_address", ignoreDuplicates: true }
    );

    // Create session JWT cookie
    await createSession({ address, twitterHandle });

    return NextResponse.json({
      success: true,
      authenticated: true,
      address,
      twitterHandle: twitterHandle || null,
    });
  } catch (error: any) {
    console.error("Auth verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/auth/verify
 *
 * Check current session status.
 */
export async function GET() {
  const session = await getSession();
  if (session?.address) {
    return NextResponse.json({
      authenticated: true,
      address: session.address,
      twitterHandle: session.twitterHandle || null,
    });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
