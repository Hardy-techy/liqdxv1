/**
 * Input validation helpers for API routes.
 * Centralizes validation to prevent injection and ensure data integrity.
 */

/** Validate Ethereum-style wallet address (0x + 40 hex chars) */
export function isValidAddress(addr: unknown): addr is string {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/** Validate UUID v4 format (for walletId, sessionId, etc.) */
export function isValidUUID(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

/** Sanitize user-provided text — trim and cap length */
export function sanitizeText(text: unknown, maxLength = 2000): string {
  if (typeof text !== "string") return "";
  return text.slice(0, maxLength).trim();
}

/** Validate a positive numeric amount string */
export function isValidAmount(amount: unknown): boolean {
  if (typeof amount !== "string" && typeof amount !== "number") return false;
  const num = Number(amount);
  return Number.isFinite(num) && num > 0;
}

/** Validate blockchain identifier (e.g. "ARC-TESTNET", "OP-SEPOLIA") */
export function isValidBlockchain(chain: unknown): chain is string {
  if (typeof chain !== "string") return false;
  // Whitelist of supported chains
  const supported = [
    "ARC-TESTNET", "OP-SEPOLIA", "BASE-SEPOLIA", "ARB-SEPOLIA",
    "ARC", "ETH", "BASE", "ARB",
    "AVAX-FUJI", "AVAX",
    "MATIC-AMOY", "MATIC",
    "SOL-DEVNET", "SOL",
    "OP-SEPOLIA", "OP",
    "UNI-SEPOLIA", "UNI",
    "MONAD-TESTNET", "MONAD",
  ];
  return supported.includes(chain);
}

/**
 * Validate a required string field — must be a non-empty string.
 * Returns the trimmed value or null if invalid.
 */
export function requireString(value: unknown, maxLength = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}
