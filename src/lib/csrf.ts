import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that mutating requests (POST, PUT, DELETE, PATCH) originate
 * from our own domain. Prevents CSRF where a malicious page makes
 * requests to our API routes from the user's browser.
 *
 * NOTE: This does NOT protect against direct API calls (curl/Postman).
 * That's what session auth is for. CSRF is an additional layer for browsers.
 */
export function checkCsrf(req: NextRequest | Request): NextResponse | null {
  const method = req.method?.toUpperCase();

  // Only check mutating methods
  if (!method || method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  // Build allow-list from explicit env vars (not Host header in production)
  const allowedOrigins = new Set<string>();

  // Add production domain from env (trusted source)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowedOrigins.add(new URL(appUrl).origin);
    } catch { /* invalid URL */ }
  }

  // SECURITY: Only trust the Host header in development.
  // In production, a misconfigured reverse proxy could forward an attacker-controlled
  // Host header, allowing CSRF bypass via Host: evil.com + Origin: https://evil.com.
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    if (host) {
      allowedOrigins.add(`http://${host}`);
      allowedOrigins.add(`https://${host}`);
    }
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }

  // Allow if the Origin header matches
  if (origin && allowedOrigins.has(origin)) {
    return null;
  }

  // Fallback: check Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.has(refererOrigin)) {
        return null;
      }
    } catch {
      // Invalid referer URL
    }
  }

  // SECURITY: If BOTH Origin and Referer are missing, REJECT the request.
  // Previous code allowed this, which let curl/scripts bypass CSRF entirely.
  // Browsers ALWAYS send at least one of Origin or Referer for same-origin POSTs.
  if (!origin && !referer) {
    return NextResponse.json(
      { error: "Missing Origin header. CSRF validation failed." },
      { status: 403 }
    );
  }

  // Origin/Referer present but didn't match allow-list
  return NextResponse.json(
    { error: "CSRF validation failed. Request origin not allowed." },
    { status: 403 }
  );
}
