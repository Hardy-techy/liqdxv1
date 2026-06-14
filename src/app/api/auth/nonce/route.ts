import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * GET /api/auth/nonce
 * 
 * Generates a crypto-random nonce, stores it in an HTTP-only secure cookie,
 * and returns it for the frontend to include in the SIWE message.
 * This prevents replay attacks on the signature authentication endpoint.
 */
export async function GET() {
  const nonce = crypto.randomBytes(16).toString("hex");
  
  const cookieStore = await cookies();
  cookieStore.set("auth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes validity
  });

  return NextResponse.json({ nonce });
}
