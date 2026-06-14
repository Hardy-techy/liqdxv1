import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";
import { getSupabaseAdmin } from "./supabase/server";

/**
 * Authentication & authorization helpers for API routes.
 *
 * Auth model:
 *   1. User connects wallet → signs a message → session JWT created
 *   2. Every API request includes the session cookie (httpOnly, auto-sent by browser)
 *   3. requireAuth() verifies the JWT and returns the session
 *   4. requireAuthWithWallet() also verifies the requested walletAddress belongs to the session user
 */

interface AuthSuccess {
  authenticated: true;
  session: SessionPayload;
}

interface AuthFailure {
  authenticated: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Verify that the caller has a valid session.
 * Returns the session payload or a 401 response.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();

  if (!session?.address) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Authentication required. Please connect your wallet and sign in." },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true, session };
}

/**
 * Verify that the caller has a valid session AND the requested
 * wallet address belongs to them.
 *
 * This prevents user A from calling the API with user B's wallet.
 *
 * @param requestedWalletAddress - The Circle wallet address from the request body
 */
export async function requireAuthWithWallet(
  requestedWalletAddress: string
): Promise<AuthResult> {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth;

  const sessionAddress = auth.session.address.toLowerCase();
  const requestedAddr = requestedWalletAddress.toLowerCase();

  // Case 1: The requested address IS the session address (e.g. credits by MetaMask addr)
  if (requestedAddr === sessionAddress) {
    return auth;
  }

  // Case 2: The requested address is the Circle wallet address — verify ownership
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("circle_wallet_id")
    .ilike("wallet_address", sessionAddress)
    .single();

  if (profile?.circle_wallet_id) {
    // circle_wallet_id stores the Circle wallet address (shared across chains)
    if (profile.circle_wallet_id.toLowerCase() === requestedAddr) {
      return auth;
    }
  }

  // Ownership check failed
  return {
    authenticated: false,
    response: NextResponse.json(
      { error: "Wallet ownership verification failed. This wallet does not belong to your account." },
      { status: 403 }
    ),
  };
}

/**
 * Verify wallet ownership by walletId (Circle UUID).
 * Looks up the wallet in Circle and checks refId matches session address.
 */
export async function requireAuthWithWalletId(
  requestedWalletId: string,
  requestedWalletAddress?: string
): Promise<AuthResult> {
  let auth;
  if (requestedWalletAddress) {
    // First verify the wallet address belongs to the session user
    auth = await requireAuthWithWallet(requestedWalletAddress);
    if (!auth.authenticated) return auth;
  } else {
    auth = await requireAuth();
    if (!auth.authenticated) return auth;
  }

  // Enforce walletId ownership via Supabase mapping.
  // When a wallet is created, its Circle UUID is not stored locally by default
  // (only the address is). However, if we need to verify the UUID itself,
  // we check if the requested Circle wallet address matches the auth session.
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("circle_wallet_id")
    .ilike("wallet_address", auth.session.address)
    .single();

  // If the profile has a circle_wallet_id stored, ensure it matches requestedWalletAddress.
  // The actual circle_wallet_id field in DB stores the *address*, NOT the UUID.
  // To truly verify the UUID (walletId), we must query Circle, OR we trust that
  // checking the address ownership is sufficient since Circle maps UUID -> Address.
  
  // A tighter check: Query Circle to verify the walletId belongs to the user's refId
  const { initiateDeveloperControlledWalletsClient } = require("@circle-fin/developer-controlled-wallets");
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });

  try {
    const walletRes = await client.getWallet({ id: requestedWalletId });
    const walletRefId = walletRes.data?.wallet?.refId;
    
    if (walletRefId?.toLowerCase() !== auth.session.address.toLowerCase()) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { error: "Wallet ID ownership verification failed. This wallet ID does not belong to your account." },
          { status: 403 }
        ),
      };
    }
  } catch (error) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Could not verify wallet ID ownership." },
        { status: 403 }
      ),
    };
  }

  return auth;
}
