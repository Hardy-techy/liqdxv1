export type Tab = "terminal" | "intelligence" | "history" | "credits";

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  status?: "pending" | "success" | "error" | "pending_confirmation";
  txHash?: string;
  txId?: string; // Circle transaction ID
  createdAt?: string; // The creation timestamp from the database
  intent?: string; // swap, bridge, balance
  tokenIn?: string; // Source token symbol
  tokenOut?: string; // Destination token symbol
  balances?: { symbol: string, amount: string, chain?: string }[]; // For balance intent
  yields?: { protocol: string, asset: string, amount: string, chain?: string }[];
  amountIn?: string;
  amountOut?: string;
  amount?: string;
  rate?: string;
  fee?: string;
}
