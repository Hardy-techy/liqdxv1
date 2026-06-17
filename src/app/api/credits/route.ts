import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCircleClient } from "@/lib/circle";
import { isValidAddress, isValidUUID, isValidAmount, isValidBlockchain } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { requireAuth, requireAuthWithWallet, requireAuthWithWalletId } from "@/lib/auth";

// Credit packages: USDC -> Credits
const CREDIT_PACKAGES: Record<string, { usdc: number; credits: number }> = {
  "5": { usdc: 5, credits: 15 },
  "10": { usdc: 10, credits: 25 },
};

// Credit costs per action (hidden from user)
export const CREDIT_COSTS: Record<string, number> = {
  swap: 2,
  bridge: 3,
  send: 1,
  conversation: 1,
  balance: 1,
  help: 1,
  unknown: 1,
};

const FREE_CREDITS = 5; // New user bonus

// Treasury wallet address — where USDC top-ups are sent
const TREASURY_ADDRESS = process.env.TREASURY_WALLET_ADDRESS || "";

// --- GET: Fetch credit balance (requires auth) ---
export async function GET(req: Request) {
  // SECURITY: Require authentication for balance reads
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: "Valid address is required" }, { status: 400 });
  }

  // SECURITY: Only allow reading your own balance (either MetaMask or Circle Wallet)
  const walletAuth = await requireAuthWithWallet(address);
  if (!walletAuth.authenticated) {
    return NextResponse.json({ error: "Cannot view another user's credits" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("credits_balances")
    .select("balance")
    .ilike("wallet_address", address)
    .single();

  if (error || !data) {
    return NextResponse.json({ balance: 0 });
  }

  return NextResponse.json({ balance: parseFloat(data.balance as any) });
}

// --- POST: Top-up, deduct, history, init ---
export async function POST(req: Request) {
  try {
    // CSRF protection
    const csrfError = checkCsrf(req);
    if (csrfError) return csrfError;

    // SECURITY: Require authentication for all credit operations
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;

    const body = await req.json();
    const { action } = body;

    const supabase = getSupabaseAdmin();

    // --- INIT: Give free credits to new users ---
    if (action === "init") {
      const { walletAddress } = body;
      if (!walletAddress || !isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress required" }, { status: 400 });
      }

      // SECURITY: Can only init credits for your own wallet or wallet
      const walletAuth = await requireAuthWithWallet(walletAddress);
      if (!walletAuth.authenticated) return walletAuth.response;

      // Check if user already has a balance row
      const { data: existing } = await supabase
        .from("credits_balances")
        .select("balance")
        .eq("wallet_address", walletAddress)
        .single();

      if (existing) {
        return NextResponse.json({ balance: parseFloat(existing.balance as any), isNew: false });
      }

      // New user: create balance with free credits
      await supabase.from("credits_balances").insert({
        wallet_address: walletAddress,
        balance: FREE_CREDITS,
      });

      await supabase.from("credits_ledger").insert({
        wallet_address: walletAddress,
        type: "bonus",
        amount: FREE_CREDITS,
        balance_after: FREE_CREDITS,
        description: "Welcome bonus — free credits",
      });

      return NextResponse.json({ balance: FREE_CREDITS, isNew: true });
    }

    // --- TOPUP: Buy credits with USDC (real transfer to treasury) ---
    if (action === "topup") {
      const { walletAddress, walletId, packageId, blockchain } = body;

      if (!walletAddress || !isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress required" }, { status: 400 });
      }
      if (!walletId || !isValidUUID(walletId)) {
        return NextResponse.json({ error: "Valid walletId required" }, { status: 400 });
      }
      if (!packageId || !CREDIT_PACKAGES[packageId]) {
        return NextResponse.json({ error: "Invalid package. Choose '5' or '10'." }, { status: 400 });
      }

      // SECURITY: Verify BOTH walletAddress and walletId ownership for fund-moving operation
      // This prevents an attacker from supplying their own address but someone else's wallet ID
      const walletAuth = await requireAuthWithWalletId(walletId, walletAddress);
      if (!walletAuth.authenticated) return walletAuth.response;

      // Rate limit: 5 topups per minute per wallet
      const rl = rateLimit(`credits-topup:${walletAddress}`, 5, 60_000);
      if (!rl.success) {
        return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
      }

      // SECURITY: Low Balance Threshold. Prevent hoarding/stacking packages.
      // Must have < 5 credits to purchase a new package.
      const { data: currentBalance } = await supabase
        .from("credits_balances")
        .select("balance")
        .eq("wallet_address", walletAddress)
        .single();
      
      const balanceVal = currentBalance ? parseFloat(currentBalance.balance as any) : 0;
      if (balanceVal >= 5) {
        return NextResponse.json({ error: "You must use your existing balance (below 5 credits) before purchasing more." }, { status: 403 });
      }

      const pkg = CREDIT_PACKAGES[packageId];

      if (!TREASURY_ADDRESS) {
        return NextResponse.json({ error: "Treasury wallet not configured" }, { status: 500 });
      }

      // 1. Transfer USDC from user's Circle wallet to treasury
      const client = getCircleClient();
      let txId: string | undefined;

      try {
        const txResponse = await client.createTransaction({
          walletId, // Explicitly use the securely verified UUID
          blockchain: (blockchain && isValidBlockchain(blockchain) ? blockchain : "ARC-TESTNET") as any,
          destinationAddress: TREASURY_ADDRESS,
          amount: [pkg.usdc.toString()],
          tokenAddress: "0x3600000000000000000000000000000000000000", // USDC on Arc Testnet
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        txId = txResponse.data?.id;
      } catch (txErr: any) {
        console.error("Credit topup transfer failed");
        return NextResponse.json({ error: "USDC transfer failed. Please try again." }, { status: 400 });
      }

      // 2. SECURITY: Atomic credit addition via Supabase RPC to prevent race conditions.
      // Replaces the previous non-atomic read-then-write which was vulnerable to
      // concurrent requests causing incorrect balances.
      let newBalance: number;
      const { data: rpcResult, error: rpcError } = await supabase.rpc("add_credits_atomic", {
        p_wallet: walletAddress.toLowerCase(),
        p_amount: pkg.credits,
      });

      if (rpcError) {
        console.error("add_credits_atomic RPC failed:", rpcError.message);
        return NextResponse.json({ error: "Credit top-up failed due to a database error. Please try again." }, { status: 500 });
      } else {
        newBalance = Number(rpcResult);
      }

      // 3. Add ledger entry
      await supabase.from("credits_ledger").insert({
        wallet_address: walletAddress.toLowerCase(),
        type: "topup",
        amount: pkg.credits,
        balance_after: newBalance,
        description: `Purchased ${pkg.credits} credits for ${pkg.usdc} USDC`,
        tx_hash: txId || null,
      });

      return NextResponse.json({
        success: true,
        balance: newBalance,
        creditsAdded: pkg.credits,
        usdcSpent: pkg.usdc,
        txId,
      });
    }

    // SECURITY: Credit deduction is handled ONLY internally by the agent route via
    // the atomic deduct_credits_atomic RPC. Exposing a public deduct endpoint would
    // allow manipulation of credit balances without corresponding actions.
    if (action === "deduct") {
      return NextResponse.json({ error: "Credit deduction is handled internally by the agent." }, { status: 403 });
    }

    // --- HISTORY: Get credit transaction history ---
    if (action === "history") {
      const { walletAddress } = body;
      if (!walletAddress || !isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress required" }, { status: 400 });
      }

      // SECURITY: Can only view your own history
      if (walletAddress.toLowerCase() !== auth.session.address.toLowerCase()) {
        return NextResponse.json({ error: "Cannot view another user's credit history" }, { status: 403 });
      }

      // Rate limit: 30 history reads per minute
      const rl = rateLimit(`credits-history:${walletAddress}`, 30, 60_000);
      if (!rl.success) {
        return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
      }

      const { data: ledger } = await supabase
        .from("credits_ledger")
        .select("*")
        .eq("wallet_address", walletAddress)
        .order("created_at", { ascending: false })
        .limit(50);

      return NextResponse.json({ history: ledger || [] });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Credits API error:", error?.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
