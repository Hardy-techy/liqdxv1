require('dotenv').config({ path: '.env.local' });
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

async function main() {
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
  });

  console.log("Fetching wallets...");
  const walletsRes = await client.listWallets({});
  const wallets = walletsRes.data?.wallets || [];
  
  for (const w of wallets) {
    console.log(`Wallet ${w.id} on ${w.blockchain}`);
    try {
      const balRes = await client.getWalletTokenBalance({ id: w.id, includeAll: true });
      if (balRes.data?.tokenBalances?.length > 0) {
        console.log(JSON.stringify(balRes.data?.tokenBalances, null, 2));
      } else {
        console.log('[]');
      }
    } catch (e) {
      console.error(e);
    }
  }
}

main().catch(console.error);
