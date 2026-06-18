export interface AchSwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedOut: string;
  minOut: string;
  slippageBps: number;
  routeData: string;
  adapter: string;
}

export interface AchSwapTransaction {
  to: string;
  data: string;
  value: string;
  chainId: number;
}

const BASE_URL = "https://swap-api.achswap.app";

/**
 * Get a quote for swapping tokens via AchSwap
 * @param tokenIn The address of the input token (use 0x0000000000000000000000000000000000000000 for native token)
 * @param tokenOut The address of the output token
 * @param amountInWei The amount of input token in raw WEI
 * @param slippageBps Slippage tolerance in basis points (e.g. 500 = 5%)
 */
export async function getAchSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amountInWei: string,
  slippageBps: number = 500
): Promise<AchSwapQuote> {
  const params = new URLSearchParams({
    tokenIn,
    tokenOut,
    amountIn: amountInWei,
    slippageBps: slippageBps.toString(),
  });

  const res = await fetch(`${BASE_URL}/quote?${params.toString()}`);
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AchSwap Quote failed: ${res.statusText} - ${text}`);
  }

  return res.json() as Promise<AchSwapQuote>;
}

/**
 * Get the execution transaction calldata for the given quote and recipient
 * @param quote The quote object returned by getAchSwapQuote
 * @param recipient The wallet address that will receive the output tokens
 */
export async function getAchSwapTransaction(
  quote: AchSwapQuote,
  recipient: string
): Promise<AchSwapTransaction> {
  const payload = {
    tokenIn: quote.tokenIn,
    tokenOut: quote.tokenOut,
    amountIn: quote.amountIn,
    amountOutMin: quote.minOut,
    recipient: recipient,
    routeData: quote.routeData,
  };

  const res = await fetch(`${BASE_URL}/swap-tx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AchSwap Swap-Tx failed: ${res.statusText} - ${text}`);
  }

  return res.json() as Promise<AchSwapTransaction>;
}
