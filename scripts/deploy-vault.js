const { createWalletClient, createPublicClient, http, custom } = require('viem');
const { privateKeyToAccount, generatePrivateKey } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');
const fs = require('fs');
const path = require('path');

async function main() {
  const privateKeyFile = path.resolve(__dirname, 'deploy-key.txt');
  let privateKey;
  
  if (fs.existsSync(privateKeyFile)) {
    privateKey = fs.readFileSync(privateKeyFile, 'utf8').trim();
  } else {
    privateKey = generatePrivateKey();
    fs.writeFileSync(privateKeyFile, privateKey);
  }

  const account = privateKeyToAccount(privateKey);
  const rpcClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });

  console.log("======================================");
  console.log("Deployer Address:", account.address);
  console.log("======================================");

  let balance = await rpcClient.getBalance({ address: account.address });
  if (balance === 0n) {
    console.log("BALANCE IS 0! Please fund this address using a faucet:");
    console.log("-> https://faucet.circle.com/");
    console.log("-> https://www.alchemy.com/faucets/base-sepolia");
    console.log("Waiting for funds...");
    
    while (balance === 0n) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      balance = await rpcClient.getBalance({ address: account.address });
    }
  }

  console.log(`Balance found: ${Number(balance) / 1e18} ETH. Deploying PrivateMorphoVault...`);

  const compiledFile = path.resolve(__dirname, 'compiled', 'PrivateMorphoVault.json');
  const compiled = JSON.parse(fs.readFileSync(compiledFile, 'utf8'));

  const usdc = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  const morphoBlue = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
  const weth = '0x4200000000000000000000000000000000000006';
  const irm = '0x46415998764C29aB2a25CbeA6254146D50D22687';
  const lltv = 860000000000000000n;

  const hash = await walletClient.deployContract({
    abi: compiled.abi,
    bytecode: compiled.bytecode,
    args: [usdc, morphoBlue, weth, irm, lltv]
  });

  console.log("Tx Hash:", hash);
  const receipt = await rpcClient.waitForTransactionReceipt({ hash });

  console.log("======================================");
  console.log("PrivateMorphoVault deployed to:", receipt.contractAddress);
  console.log("======================================");

  fs.writeFileSync(path.resolve(__dirname, 'deployed-vault.txt'), receipt.contractAddress);
}

main().catch(console.error);
