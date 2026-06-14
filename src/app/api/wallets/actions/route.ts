import { NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidAddress, isValidUUID, isValidAmount, isValidBlockchain } from "@/lib/validate";
import { checkCsrf } from "@/lib/csrf";
import { requireAuthWithWalletId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });
}

export async function POST(req: Request) {
  try {
    // CSRF protection
    const csrfError = checkCsrf(req);
    if (csrfError) return csrfError;

    const body = await req.json();
    const { walletId, walletAddress, action } = body;

    // SECURITY: Require authentication AND verify wallet/walletId ownership
    const auth = await requireAuthWithWalletId(walletId, walletAddress);
    if (!auth.authenticated) return auth.response;

    // Rate limit: 20 wallet actions per minute per wallet
    const rl = rateLimit(`wallet-action:${walletAddress}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many wallet action requests. Please wait a moment." }, { status: 429 });
    }

    const client = getClient();

    // --- FUND: Request testnet tokens from Circle faucet ---
    if (action === "fund") {
      if (!isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
      }

      try {
        await client.requestTestnetTokens({
          address: walletAddress,
          blockchain: "ARC-TESTNET",
          usdc: true,
          native: true,
        });
        return NextResponse.json({ success: true, message: "Testnet USDC & native tokens requested! Balance may take ~30s to appear." });
      } catch (faucetErr: any) {
        // Rate-limited or forbidden — provide manual faucet links
        return NextResponse.json({ 
          success: false, 
          message: `API faucet rate-limited. Use the manual faucets instead:\n• Public: https://faucet.circle.com (paste your wallet address, select Arc Testnet)\n• Console: https://console.circle.com/faucet (use Wallet ID)`,
          walletAddress,
        });
      }
    }

    // --- BALANCE: Get real on-chain token balances ---
    if (action === "balance") {
      if (!isValidUUID(walletId)) {
        return NextResponse.json({ error: "Valid walletId is required" }, { status: 400 });
      }

      const response = await client.getWalletTokenBalance({
        id: walletId,
        includeAll: true,
      });
      return NextResponse.json({ balances: response.data?.tokenBalances || [] });
    }

    // --- TRANSACTIONS: List real transaction history ---
    if (action === "transactions") {
      if (!isValidUUID(walletId)) {
        return NextResponse.json({ error: "Valid walletId is required" }, { status: 400 });
      }

      const response = await client.listTransactions({
        walletIds: [walletId],
      });
      return NextResponse.json({ transactions: response.data?.transactions || [] });
    }

    // --- GET TRANSACTION: Fetch a specific transaction by ID ---
    if (action === "getTransaction") {
      const { txId } = body;
      if (!isValidUUID(txId)) {
        return NextResponse.json({ error: "Valid txId is required" }, { status: 400 });
      }

      const response = await client.getTransaction({ id: txId });
      return NextResponse.json({ transaction: response.data?.transaction });
    }

    // --- WITHDRAW: Send USDC from Wallet back to User's Personal Wallet ---
    if (action === "withdraw") {
      const { amount, destinationAddress, blockchain } = body;
      
      if (!isValidAmount(amount)) {
        return NextResponse.json({ error: "Valid positive amount is required" }, { status: 400 });
      }
      if (!isValidAddress(destinationAddress)) {
        return NextResponse.json({ error: "Valid destinationAddress is required" }, { status: 400 });
      }
      if (!isValidBlockchain(blockchain)) {
        return NextResponse.json({ error: "Valid blockchain is required" }, { status: 400 });
      }

      const response = await client.createTransaction({
        walletId, // Explicitly use the authenticated walletId
        blockchain: blockchain as any,
        destinationAddress: destinationAddress,
        amount: [amount.toString()],
        tokenAddress: "0x3600000000000000000000000000000000000000", // ARC_TESTNET_USDC
        fee: { type: "level", config: { feeLevel: "MEDIUM" } }
      });

      // Log withdraw to Supabase (using admin client)
      const supabase = getSupabaseAdmin();
      await supabase.from("transaction_logs").insert({
        wallet_address: destinationAddress,
        circle_wallet_id: walletId,
        intent: "withdraw",
        token_in: "USDC",
        amount: amount.toString(),
        tx_id: response.data?.id || null,
        status: "success", // Changed to success for UX since we don't have webhooks
        blockchain,
        message: `Withdraw of ${amount} USDC to ${destinationAddress}`,
      });

      return NextResponse.json({ success: true, transactionId: response.data?.id, message: "Withdrawal initiated." });
    }

    // --- LOG DEPOSIT: Manual deposit from user wallet to wallet ---
    if (action === "logDeposit") {
      const { amount, walletAddress, txHash } = body;

      if (!isValidAmount(amount)) {
        return NextResponse.json({ error: "Valid positive amount is required" }, { status: 400 });
      }
      if (!isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();
      await supabase.from("transaction_logs").insert({
        wallet_address: walletAddress,
        intent: "deposit",
        token_in: "USDC",
        amount: amount.toString(),
        tx_hash: txHash || null,
        status: "success",
        message: `Deposit of ${amount} USDC into Wallet`,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Wallet action error:", error?.response?.data || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
