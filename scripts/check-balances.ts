import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

async function main() {
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });

  console.log("Fetching wallets...");
  const walletsRes = await client.listWallets({});
  const wallets = walletsRes.data?.wallets || [];
  
  for (const w of wallets) {
    if (w.blockchain === 'OP-SEPOLIA' || w.blockchain === 'ETH-SEPOLIA' || w.blockchain === 'BASE-SEPOLIA' || w.blockchain === 'ARB-SEPOLIA') {
      console.log(`Wallet ${w.id} on ${w.blockchain}`);
      try {
        const balRes = await client.getWalletTokenBalance({ id: w.id, includeAll: true });
        console.log(JSON.stringify(balRes.data?.tokenBalances, null, 2));
      } catch (e) {
        console.error(e);
      }
    }
  }
}

main().catch(console.error);
