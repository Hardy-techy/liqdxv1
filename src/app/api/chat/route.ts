import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidAddress, isValidUUID, sanitizeText, requireString } from "@/lib/validate";
import { checkCsrf } from "@/lib/csrf";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // CSRF protection
    const csrfError = checkCsrf(req);
    if (csrfError) return csrfError;

    // SECURITY: Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;
    const sessionAddress = auth.session.address;

    const body = await req.json();
    const { action, walletAddress, sessionId, message } = body;
    const supabase = getSupabaseAdmin();

    // Rate limit: 60 chat API calls per minute per wallet
    const rl = rateLimit(`chat-api:${sessionAddress}`, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many chat requests. Please wait a moment." }, { status: 429 });
    }

    // Helper: verify walletAddress belongs to session user
    function verifyWalletAccess(addr: string): NextResponse | null {
      if (addr.toLowerCase() !== sessionAddress.toLowerCase()) {
        return NextResponse.json(
          { error: "Cannot access another user's chat data" },
          { status: 403 }
        );
      }
      return null;
    }

    // Helper: verify session ownership before modifying it
    async function verifySessionOwnership(sid: string): Promise<NextResponse | null> {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("wallet_address")
        .eq("id", sid)
        .single();

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (session.wallet_address.toLowerCase() !== sessionAddress.toLowerCase()) {
        return NextResponse.json(
          { error: "Cannot access another user's chat session" },
          { status: 403 }
        );
      }
      return null;
    }

    // --- List recent chat sessions for this wallet (last 5) ---
    if (action === "listSessions") {
      if (!walletAddress || !isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
      }

      const accessErr = verifyWalletAccess(walletAddress);
      if (accessErr) return accessErr;

      const { data: sessions, error } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at, updated_at")
        .ilike("wallet_address", walletAddress)
        .order("updated_at", { ascending: false })
        .limit(100); // Fetch more to account for empty sessions created on page load

      if (error) throw error;

      // Fetch the last message preview for each session
      const sessionsWithPreview = await Promise.all(
        (sessions || []).map(async (s) => {
          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("content, role")
            .eq("session_id", s.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...s,
            preview: lastMsg?.content?.slice(0, 60) || "New conversation",
            hasMessages: !!lastMsg,
          };
        })
      );

      // Filter out empty sessions and return exactly 10
      const filteredSessions = sessionsWithPreview.filter(s => s.hasMessages).slice(0, 10);

      return NextResponse.json({ sessions: filteredSessions });
    }

    // --- Load all messages for a specific session ---
    if (action === "loadSession") {
      if (!sessionId || !isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
      }

      // SECURITY: Verify the session belongs to the authenticated user
      const ownerErr = await verifySessionOwnership(sessionId);
      if (ownerErr) return ownerErr;

      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ messages: messages || [] });
    }

    // --- Create a new chat session for this wallet ---
    if (action === "createSession") {
      if (!walletAddress || !isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
      }

      const accessErr = verifyWalletAccess(walletAddress);
      if (accessErr) return accessErr;

      const title = body.title ? sanitizeText(body.title, 200) : null;

      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({ wallet_address: walletAddress, title })
        .select("id, title, created_at, updated_at")
        .single();

      if (error) throw error;
      return NextResponse.json({ session: newSession, messages: [] });
    }

    // --- Get or create a chat session for this wallet ---
    if (action === "getOrCreateSession") {
      if (!walletAddress || !isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
      }

      const accessErr = verifyWalletAccess(walletAddress);
      if (accessErr) return accessErr;

      // Check for existing session
      const { data: existing } = await supabase
        .from("chat_sessions")
        .select("id, created_at, updated_at")
        .ilike("wallet_address", walletAddress)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        // Load messages for this session
        const { data: messages } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", existing.id)
          .order("created_at", { ascending: true });

        return NextResponse.json({ session: existing, messages: messages || [] });
      }

      // Create a new session
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({ wallet_address: walletAddress })
        .select("id, created_at, updated_at")
        .single();

      if (error) throw error;
      return NextResponse.json({ session: newSession, messages: [] });
    }

    // --- Save a message to an existing session ---
    if (action === "saveMessage") {
      if (!sessionId || !isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
      }
      if (!walletAddress || !isValidAddress(walletAddress)) {
        return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
      }
      if (!message || !message.role || !message.content) {
        return NextResponse.json({ error: "message with role and content is required" }, { status: 400 });
      }

      const accessErr = verifyWalletAccess(walletAddress);
      if (accessErr) return accessErr;

      // Also verify session ownership
      const ownerErr = await verifySessionOwnership(sessionId);
      if (ownerErr) return ownerErr;

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          wallet_address: walletAddress,
          role: sanitizeText(message.role, 20),
          content: sanitizeText(message.content, 10000),
          status: message.status ? sanitizeText(message.status, 50) : null,
          tx_hash: message.txHash ? sanitizeText(message.txHash, 100) : null,
          tx_id: message.txId ? sanitizeText(message.txId, 100) : null,
          intent: message.intent ? sanitizeText(message.intent, 50) : null,
          token_in: message.tokenIn ? sanitizeText(message.tokenIn, 20) : null,
          token_out: message.tokenOut ? sanitizeText(message.tokenOut, 20) : null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Touch session updated_at
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return NextResponse.json({ success: true, id: data.id });
    }

    // --- Update a message (e.g. when tx confirms) ---
    if (action === "updateMessage") {
      const { messageDbId, updates } = body;
      if (!messageDbId || !isValidUUID(messageDbId)) {
        return NextResponse.json({ error: "Valid messageDbId is required" }, { status: 400 });
      }
      if (!updates) {
        return NextResponse.json({ error: "updates object is required" }, { status: 400 });
      }

      // SECURITY: Verify the message belongs to the authenticated user
      const { data: msg } = await supabase
        .from("chat_messages")
        .select("wallet_address")
        .eq("id", messageDbId)
        .single();

      if (!msg) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }
      if (msg.wallet_address.toLowerCase() !== sessionAddress.toLowerCase()) {
        return NextResponse.json({ error: "Cannot update another user's message" }, { status: 403 });
      }

      const { error } = await supabase
        .from("chat_messages")
        .update({
          status: updates.status ? sanitizeText(updates.status, 50) : undefined,
          tx_hash: updates.txHash ? sanitizeText(updates.txHash, 100) : null,
        })
        .eq("id", messageDbId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // --- Clear a session's messages (New Chat) ---
    if (action === "clearSession") {
      if (!sessionId || !isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
      }

      // SECURITY: Verify session ownership
      const ownerErr = await verifySessionOwnership(sessionId);
      if (ownerErr) return ownerErr;

      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // --- Update a session's title ---
    if (action === "updateSessionTitle") {
      if (!sessionId || !isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
      }
      const title = requireString(body.title, 200);
      if (!title) {
        return NextResponse.json({ error: "Valid title is required" }, { status: 400 });
      }

      // SECURITY: Verify session ownership
      const ownerErr = await verifySessionOwnership(sessionId);
      if (ownerErr) return ownerErr;

      const { error } = await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", sessionId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // --- Delete a session ---
    if (action === "deleteSession") {
      if (!sessionId || !isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
      }

      // SECURITY: Verify session ownership
      const ownerErr = await verifySessionOwnership(sessionId);
      if (ownerErr) return ownerErr;

      // Messages are typically cascaded, but explicit delete ensures cleanup
      await supabase.from("chat_messages").delete().eq("session_id", sessionId);
      const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- GET: Load transaction history for a wallet ---
export async function GET(req: Request) {
  try {
    // SECURITY: Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;
    const sessionAddress = auth.session.address;

    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");
    const circleWalletAddress = searchParams.get("circleWalletAddress");

    // Rate limit: 30 history reads per minute
    const rl = rateLimit(`chat-history:${sessionAddress}`, 30, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many transaction history requests. Please wait." }, { status: 429 });
    }

    if (!walletAddress || !isValidAddress(walletAddress)) {
      return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
    }

    // SECURITY: Only allow reading your own transaction history
    if (walletAddress.toLowerCase() !== sessionAddress.toLowerCase()) {
      return NextResponse.json({ error: "Cannot view another user's transactions" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    
    // Fetch the Circle wallet address securely from the authenticated session's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("circle_wallet_id")
      .ilike("wallet_address", sessionAddress)
      .single();

    // Query by both MetaMask address AND Circle wallet address (case-insensitive)
    let query = supabase
      .from("transaction_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (profile?.circle_wallet_id) {
      query = query.or(`wallet_address.ilike.${sessionAddress},wallet_address.ilike.${profile.circle_wallet_id}`);
    } else {
      query = query.ilike("wallet_address", sessionAddress);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ transactions: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
