import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: sessions, error: sErr } = await supabase.from("chat_sessions").select("*").limit(10);
  console.log("Sessions:", sessions);
  
  const { data: msgs, error: mErr } = await supabase.from("chat_messages").select("*").limit(10);
  console.log("Messages:", msgs);
}
run();
