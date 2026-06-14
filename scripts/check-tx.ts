import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

// Usage: node --no-warnings --import tsx --env-file=.env.local scripts/check-tx.ts

async function main() {
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });

  console.log("Fetching recent transactions...");
  const txListResponse = await client.listTransactions({});

  const transactions = txListResponse.data?.transactions || [];
  
  if (transactions.length === 0) {
    console.log("No transactions found.");
    return;
  }

  for (const tx of transactions.slice(0, 5)) {
    console.log(`\nTX ID: ${tx.id}`);
    console.log(`State: ${tx.state}`);
    console.log(`Amount: ${tx.amounts?.join(", ")}`);
    console.log(`Destination: ${tx.destinationAddress}`);
    if (tx.errorReason) {
      console.log(`Error Reason: ${tx.errorReason}`);
    }
    if (tx.errorDetails) {
      console.log(`Error Details: ${tx.errorDetails}`);
    }
  }
}

main().catch(console.error);
