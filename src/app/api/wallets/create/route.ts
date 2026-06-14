import { NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { rateLimit } from "@/lib/rate-limit";
import { requireString } from "@/lib/validate";
import { checkCsrf } from "@/lib/csrf";
import { requireAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // CSRF protection
    const csrfError = checkCsrf(req);
    if (csrfError) return csrfError;

    // SECURITY: Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;

    const { userId, riskProfile } = await req.json();

    // Validate userId
    const validUserId = requireString(userId, 200);
    if (!validUserId) {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 });
    }

    // SECURITY: userId must match the authenticated session address
    if (validUserId.toLowerCase() !== auth.session.address.toLowerCase()) {
      return NextResponse.json(
        { error: "userId must match your authenticated wallet address" },
        { status: 403 }
      );
    }

    // Rate limit: 3 wallet creation requests per minute per user
    const rl = rateLimit(`wallet-create:${validUserId}`, 3, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    if (!process.env.CIRCLE_API_KEY) {
      return NextResponse.json({ 
        error: "Circle API Key not configured. Please add CIRCLE_API_KEY to your .env.local file." 
      }, { status: 500 });
    }

    // Initialize the Circle Server SDK
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET || ""
    });

    // 1. Check if the user already has a wallet mapped to their refId
    const existingWallets = await client.listWallets({
      refId: validUserId,
    });

    const requiredChains = ["ARC-TESTNET", "OP-SEPOLIA", "BASE-SEPOLIA", "ARB-SEPOLIA"];
    let userWallets = (existingWallets.data?.wallets || []).filter(w => requiredChains.includes(w.blockchain as string));
    const existingChains = userWallets.map(w => w.blockchain);
    const missingChains = requiredChains.filter(c => !existingChains.includes(c as any));

    if (missingChains.length > 0) {
      console.log(`Provisioning missing wallets for: ${missingChains.join(", ")}`);
      
      await client.createWallets({
        blockchains: missingChains as any[],
        accountType: "SCA",
        count: 1,
        walletSetId: process.env.CIRCLE_WALLET_SET_ID as string,
        idempotencyKey: crypto.randomUUID(),
        metadata: [
          {
            name: `Agent Wallet - ${validUserId.slice(0, 6)}`,
            refId: validUserId
          }
        ]
      });

      // Fetch again to get the complete list
      const updatedWalletsRes = await client.listWallets({ refId: validUserId });
      userWallets = (updatedWalletsRes.data?.wallets || []).filter(w => requiredChains.includes(w.blockchain as string));
    }

    const arcWallet = userWallets.find(w => w.blockchain === "ARC-TESTNET");

    // SECURITY: Store wallet ownership mapping in profiles table.
    // This is used by requireAuthWithWallet() to verify ownership on all subsequent requests.
    if (arcWallet?.address) {
      const supabase = getSupabaseAdmin();
      await supabase.from("profiles")
        .update({ circle_wallet_id: arcWallet.address })
        .eq("wallet_address", auth.session.address);
    }

    return NextResponse.json({ 
      success: true, 
      wallet: arcWallet,
      wallets: userWallets,
      message: "Agent Wallets successfully provisioned!"
    });

  } catch (error: any) {
    console.error("Failed to create Circle Agent Wallet:", error?.response?.data || error);
    return NextResponse.json({ 
      error: "Failed to create wallet. Please try again." 
    }, { status: 500 });
  }
}

