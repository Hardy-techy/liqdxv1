import { NextResponse } from "next/server";
import { resolveKitKey } from "@/lib/circle";
import { isValidAddress, requireString } from "@/lib/validate";
import { checkCsrf } from "@/lib/csrf";
import { requireAuthWithWallet } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

// Arc Testnet Swap endpoint - uses Circle App Kit Swap SDK
// Supports USDC ↔ EURC on Arc Testnet
export async function POST(req: Request) {
  try {
    // CSRF protection
    const csrfError = checkCsrf(req);
    if (csrfError) return csrfError;

    const { walletAddress, tokenIn, tokenOut, amountIn } = await req.json();

    if (!isValidAddress(walletAddress)) {
      return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
    }

    // SECURITY: Authenticate + verify wallet ownership
    const auth = await requireAuthWithWallet(walletAddress);
    if (!auth.authenticated) return auth.response;

    // Rate limit: 10 swaps per minute per wallet
    const rl = rateLimit(`swap:${walletAddress}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many swap requests. Please wait a moment." }, { status: 429 });
    }

    const validTokenIn = requireString(tokenIn, 20);
    const validTokenOut = requireString(tokenOut, 20);
    if (!validTokenIn || !validTokenOut) {
      return NextResponse.json({ error: "Valid tokenIn and tokenOut are required" }, { status: 400 });
    }

    if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
      return NextResponse.json({ error: "Valid positive amountIn is required" }, { status: 400 });
    }

    const { createCircleWalletsAdapter } = require("@circle-fin/adapter-circle-wallets");
    const { createSwapKitContext, estimate, swap } = require("@circle-fin/swap-kit");

    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      return NextResponse.json({ error: "Circle API credentials not configured." }, { status: 500 });
    }

    const adapter = createCircleWalletsAdapter({ apiKey, entitySecret });

    const kitKey = resolveKitKey();
    const normalizedTokenIn = String(validTokenIn).toUpperCase();
    const normalizedTokenOut = String(validTokenOut).toUpperCase();
    const parsedAmount = String(amountIn);

    const context = createSwapKitContext();
    const params = {
      tokenIn: normalizedTokenIn,
      tokenOut: normalizedTokenOut,
      amountIn: parsedAmount,
      from: { adapter, address: walletAddress, chain: "Arc_Testnet" },
      config: { kitKey },
    };

    const quote = await estimate(context, params);
    const response = await swap(context, params);

    return NextResponse.json({
      success: true,
      swap: {
        tokenIn: normalizedTokenIn,
        tokenOut: normalizedTokenOut,
        amountIn: parsedAmount,
        chain: "Arc_Testnet",
        txHash: response?.txHash,
        estimatedOutput: quote?.estimatedOutput || null,
      },
    });
  } catch (error: any) {
    const safeMsg = (error?.message || "Swap failed.")
      .replace(/KIT_KEY:[^\s]+/g, "KIT_KEY:***")
      .replace(/apiKey[:\s]*[^\s,}]+/gi, "apiKey:***");
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
