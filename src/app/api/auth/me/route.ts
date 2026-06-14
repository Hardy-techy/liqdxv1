import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidAddress } from "@/lib/validate";

export async function GET(request: NextRequest) {
  // 1. MUST have JWT session cookie
  const session = await getSession();

  if (!session?.address) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // If session already has twitterHandle, return fast
  if (session.twitterHandle) {
    return NextResponse.json({
      authenticated: true,
      user: {
        address: session.address,
        twitterHandle: session.twitterHandle,
      },
    });
  }

  // 2. Session exists but no twitterHandle in JWT (e.g. newly linked account)
  // Query Supabase for the *session's* address only.
  try {
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("twitter_handle")
      .ilike("wallet_address", session.address)
      .single();

    if (!error && profile?.twitter_handle) {
      // Re-create the JWT session with the hydrated twitter handle
      await createSession({ address: session.address, twitterHandle: profile.twitter_handle });

      return NextResponse.json({
        authenticated: true,
        user: {
          address: session.address,
          twitterHandle: profile.twitter_handle,
        },
      });
    }
  } catch (e) {
    console.error("Supabase profile lookup failed:", e);
  }

  // Still authenticated, just no twitter handle yet
  return NextResponse.json({ 
    authenticated: true, 
    user: { address: session.address, twitterHandle: null } 
  });
}
