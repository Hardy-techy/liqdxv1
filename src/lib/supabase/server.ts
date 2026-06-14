import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

/**
 * Server-side Supabase admin client using service_role key.
 * This bypasses RLS and should ONLY be used in API routes (server-side).
 * NEVER import this file from client components.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add SUPABASE_SERVICE_ROLE_KEY to your .env.local (find it in Supabase Dashboard → Settings → API)."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
