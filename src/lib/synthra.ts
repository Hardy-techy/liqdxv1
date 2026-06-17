export interface SynthraQuoteParams {
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  tradeType: "EXACT_INPUT" | "EXACT_OUTPUT";
}

export interface SynthraQuoteResponse {
  state: string;
  chainId: number;
  routing: string;
  tradeType: string;
  amountIn: string;
  amountOut: string;
  amountInDecimals: string;
  amountOutDecimals: string;
  gasEstimate: string;
  gasEstimateUSD: string;
  routeString: string;
  latencyMs: number;
  warnings: string[];
  route: any[];
}

export interface SynthraSwapParams {
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  recipient: string;
  sender: string;
  approvalMode: "erc20" | "permit2";
}

export interface SynthraSwapResponse {
  transaction: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
  };
  approval?: {
    tokenApproval?: {
      needsApproval: boolean;
      approveTransaction?: {
        to: string;
        data: string;
      };
    };
  };
}

/**
 * Fetches a swap quote from Synthra
 */
export async function getSynthraQuote(params: SynthraQuoteParams): Promise<SynthraQuoteResponse> {
  const apiKey = process.env.SYNTHRA_API_KEY;
  if (!apiKey) throw new Error("SYNTHRA_API_KEY is not set in environment variables.");

  const response = await fetch("https://trading-api.synthra.org/v1/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Synthra Quote API Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Generates the transaction payload for the swap
 */
export async function buildSynthraSwap(params: SynthraSwapParams): Promise<SynthraSwapResponse> {
  const apiKey = process.env.SYNTHRA_API_KEY;
  if (!apiKey) throw new Error("SYNTHRA_API_KEY is not set in environment variables.");

  const response = await fetch("https://trading-api.synthra.org/v1/swap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Synthra Swap API Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}
