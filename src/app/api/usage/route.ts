import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const { data: usage, error } = await supabase
      .from("daily_usage")
      .select("*")
      .eq("wallet_address", address.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Usage fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
    }

    const today = new Date().toISOString().split("T")[0];

    // If no record exists or last reset date is not today, usage is 0
    if (!usage || usage.last_reset_date !== today) {
      return NextResponse.json({ requestCount: 0, limit: 30 });
    }

    return NextResponse.json({ requestCount: usage.request_count, limit: 30 });
  } catch (error) {
    console.error("Usage route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
