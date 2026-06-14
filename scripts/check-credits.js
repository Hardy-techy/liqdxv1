require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const walletAddress = '0x151ba86c507cba550d2165c69788f62506e9c8b8'; // Guessing the full address from the screenshot '0x151b...c8b8' - actually I don't know the exact one. Let's just fetch all.
  
  console.log("--- Credits Balances ---");
  const { data: balances, error: err1 } = await supabase.from('credits_balances').select('*');
  if (err1) console.error(err1);
  else console.log(balances);

  console.log("\n--- Credits Ledger ---");
  const { data: ledger, error: err2 } = await supabase.from('credits_ledger').select('*').order('created_at', { ascending: false }).limit(10);
  if (err2) console.error(err2);
  else console.log(ledger);
}

main().catch(console.error);
