import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import crypto from "crypto";

async function main() {
  const action = process.argv[2];

  if (action === "generate-secret") {
    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey || apiKey.includes("your_circle_api_key_here")) {
      console.error("❌ Error: You must set CIRCLE_API_KEY in .env.local first to fetch the public key.");
      return;
    }

    console.log("Generating Entity Secret and fetching Circle Public Key...");
    
    // Generate 32-byte hex string
    const secret = crypto.randomBytes(32).toString("hex");
    
    try {
      // Fetch public key from Circle
      const response = await fetch("https://api.circle.com/v1/w3s/config/entity/publicKey", {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
      const data = await response.json();
      const publicKey = data.data.publicKey;

      // Encrypt the secret using RSA-OAEP SHA-256
      const entitySecretBuffer = Buffer.from(secret, 'hex');
      const encryptedData = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        entitySecretBuffer
      );

      const ciphertext = encryptedData.toString('base64');

      console.log("\n========================================================");
      console.log("🔒 Your Entity Secret & Ciphertext Generated 🔒");
      console.log("========================================================");
      
      console.log("\n1️⃣ RAW ENTITY SECRET (Paste this into web/.env.local as CIRCLE_ENTITY_SECRET):");
      console.log(secret);

      console.log("\n2️⃣ ENTITY SECRET CIPHERTEXT (Paste this into the Circle Console!):");
      console.log(ciphertext);

      console.log("\n⚠️ IMPORTANT NEXT STEPS:");
      console.log("1. Copy the long CIPHERTEXT string above (it is 684 characters).");
      console.log("2. Paste it into the Circle Console where it says 'Must be 684 characters'.");
      console.log("3. Download your Recovery File!");
      console.log("4. Copy the short RAW SECRET and paste it into web/.env.local");
      console.log("========================================================\n");
    } catch (err: any) {
      console.error("❌ Failed to fetch public key or encrypt:", err.message);
    }
    return;
  }

  if (action === "create-wallet-set") {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      console.error("❌ Error: CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be set in your environment.");
      return;
    }

    console.log("Creating Wallet Set using Circle SDK...");
    
    try {
      const client = initiateDeveloperControlledWalletsClient({
        apiKey,
        entitySecret,
      });

      const response = await client.createWalletSet({
        name: "Arc AI Agent Wallet Set",
      });

      const walletSetId = response.data?.walletSet?.id;
      
      console.log("\n========================================================");
      console.log("✅ Wallet Set Created Successfully ✅");
      console.log("========================================================");
      console.log("WALLET SET ID:");
      console.log(walletSetId);
      console.log("\nPaste this into your .env.local file as CIRCLE_WALLET_SET_ID");
      console.log("========================================================\n");
    } catch (err: any) {
      console.error("❌ Failed to create Wallet Set:", err?.response?.data || err.message);
    }
    return;
  }

  console.log("Usage:");
  console.log("  npm run circle:setup generate-secret");
  console.log("  npm run circle:setup create-wallet-set");
}

main();
