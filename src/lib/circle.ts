import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

/**
 * Resolves and validates the Circle Kit Key from environment variables.
 * Used by both agent and swap routes.
 */
export function resolveKitKey(): string {
  const rawKitKey = (process.env.CIRCLE_KIT_KEY || process.env.KIT_KEY || "").trim();

  if (!rawKitKey) {
    throw new Error("Missing Circle Kit Key. Set CIRCLE_KIT_KEY in web/.env.local using the format KIT_KEY:<keyId>:<keySecret>.");
  }

  const normalizedKitKey = rawKitKey.startsWith("KIT_KEY:") ? rawKitKey : `KIT_KEY:${rawKitKey}`;

  if (normalizedKitKey === "KIT_KEY:your_circle_kit_key_here" || normalizedKitKey === "KIT_KEY:KIT_KEY:your_circle_kit_key_here") {
    throw new Error("web/.env.local still contains the placeholder Circle Kit Key. Replace CIRCLE_KIT_KEY with the real value from the Circle Developer Console.");
  }

  if (!/^KIT_KEY:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/.test(normalizedKitKey)) {
    throw new Error("Circle Kit Key must match KIT_KEY:<keyId>:<keySecret>.");
  }

  return normalizedKitKey;
}

/**
 * Creates an initialized Circle developer-controlled wallets client.
 * Validates env vars before attempting initialization.
 */
export function getCircleClient() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey) {
    throw new Error("Missing CIRCLE_API_KEY. Set it in web/.env.local.");
  }
  if (!entitySecret) {
    throw new Error("Missing CIRCLE_ENTITY_SECRET. Set it in web/.env.local.");
  }

  return initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });
}

/**
 * Sanitizes error messages to prevent leaking API keys, internal paths, or secrets.
 */
export function sanitizeErrorMessage(error: any): string {
  const raw = error?.response?.data?.message || error?.message || "An unexpected error occurred.";
  
  // Extract just the first line/short message to prevent huge viem stack traces leaking to frontend
  const shortMessage = raw.split('\n')[0].replace("The contract function ", "").replace("reverted with the following reason:", "reverted:");

  // Strip anything that looks like an API key, file path, secret, or technical jargon
  return shortMessage
    .replace(/KIT_KEY:[^\s]+/g, "KIT_KEY:***")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[internal]")
    .replace(/\/[^\s]*node_modules[^\s]*/g, "[internal]")
    .replace(/apiKey[:\s]*[^\s,}]+/gi, "apiKey:***")
    .replace(/entitySecret[:\s]*[^\s,}]+/gi, "entitySecret:***")
    .replace(/ONCHAIN_SIMULATION_FAILED:\s*/gi, "")
    .replace(/Simulation failed on /gi, "Transaction failed on ")
    .replace(/simulation/gi, "execution")
    .replace(/simulate/gi, "execute");
}
