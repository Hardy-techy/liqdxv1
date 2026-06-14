const { createWalletClient, createPublicClient, http, parseAbi, parseAbiItem } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');
const fs = require('fs');
const path = require('path');

async function main() {
  const pk = fs.readFileSync(path.resolve(__dirname, 'deploy-key.txt'), 'utf8').trim();
  const account = privateKeyToAccount(pk);
  
  const rpcClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });

  const morphoBlue = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
  const weth = '0x4200000000000000000000000000000000000006';
  
  const vaultAddress = '0x5c5b62bfae8434ecea66f5a8c6b4ae27a75c6a94';
  const oracleAddress = await rpcClient.readContract({
    address: vaultAddress,
    abi: [parseAbiItem('function mockOracle() view returns (address)')],
    functionName: 'mockOracle'
  });

  console.log("Mock Oracle is:", oracleAddress);

  const marketParams = {
    loanToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    collateralToken: weth,
    oracle: oracleAddress,
    irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
    lltv: 860000000000000000n
  };

  console.log("Wrapping ETH...");
  const wethAbi = parseAbi(['function deposit() payable', 'function approve(address, uint256)']);
  let hash = await walletClient.writeContract({
    address: weth,
    abi: wethAbi,
    functionName: 'deposit',
    value: 1000000000000000n // 0.001 ETH
  });
  await rpcClient.waitForTransactionReceipt({ hash });

  console.log("Approving Morpho...");
  hash = await walletClient.writeContract({
    address: weth,
    abi: wethAbi,
    functionName: 'approve',
    args: [morphoBlue, 1000000000000000n]
  });
  await rpcClient.waitForTransactionReceipt({ hash });

  const morphoAbi = parseAbi([
    'function supplyCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, bytes data)',
    'function borrow((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver)'
  ]);

  console.log("Supplying Collateral...");
  hash = await walletClient.writeContract({
    address: morphoBlue,
    abi: morphoAbi,
    functionName: 'supplyCollateral',
    args: [marketParams, 1000000000000000n, account.address, '0x']
  });
  await rpcClient.waitForTransactionReceipt({ hash });

  console.log("Borrowing USDC to pump APY...");
  hash = await walletClient.writeContract({
    address: morphoBlue,
    abi: morphoAbi,
    functionName: 'borrow',
    args: [marketParams, 1800000n, 0n, account.address, account.address] // Borrow 1.8 USDC
  });
  await rpcClient.waitForTransactionReceipt({ hash });

  console.log("DONE! The APY has been pumped!");
}

main().catch(console.error);
