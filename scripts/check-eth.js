const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

async function main() {
  const rpcClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const balance = await rpcClient.getBalance({ address: '0x7Bda0456AD1f900FaA735B41dE5C2c8a513E49f4' });
  console.log("Balance:", Number(balance) / 1e18, "ETH");
}

main().catch(console.error);
