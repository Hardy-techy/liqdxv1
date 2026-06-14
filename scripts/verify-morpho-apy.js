const { createPublicClient, http, parseAbiItem, encodeAbiParameters, keccak256 } = require('viem');
const { baseSepolia } = require('viem/chains');

async function main() {
  console.log("Verifying Custom Morpho USDC/WETH Market APY on-chain (Base Sepolia)...");
  
  const rpcClient = createPublicClient({ chain: baseSepolia, transport: http("https://sepolia.base.org") });
  
  const morpho = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
  const irm = '0x46415998764C29aB2a25CbeA6254146D50D22687';
  
  const marketParams = {
    loanToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC
    collateralToken: '0x4200000000000000000000000000000000000006', // WETH
    oracle: '0x907F482666314CDC6041f25d79E32f694563f391',
    irm: irm,
    lltv: BigInt("860000000000000000") // 86%
  };

  const id = keccak256(encodeAbiParameters(
    [ { type: 'address' }, { type: 'address' }, { type: 'address' }, { type: 'address' }, { type: 'uint256' } ],
    [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv]
  ));

  console.log(`Computed Market ID: ${id}`);

  try {
    const marketInfo = await rpcClient.readContract({
      address: morpho,
      abi: [parseAbiItem('function market(bytes32) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)')],
      functionName: 'market',
      args: [id]
    });

    console.log("Fetched Market Info:", marketInfo);

    const borrowRate = await rpcClient.readContract({
      address: irm,
      abi: [parseAbiItem('function borrowRateView((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv), (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)) view returns (uint256)')],
      functionName: 'borrowRateView',
      args: [marketParams, {
        totalSupplyAssets: marketInfo[0],
        totalSupplyShares: marketInfo[1],
        totalBorrowAssets: marketInfo[2],
        totalBorrowShares: marketInfo[3],
        lastUpdate: marketInfo[4],
        fee: marketInfo[5]
      }]
    });

    console.log(`Raw Borrow Rate (per second): ${borrowRate.toString()}`);
    const apy = ((Number(borrowRate) * 31536000) / 1e18) * 100;
    
    console.log(`\n================================`);
    console.log(`✅ ON-CHAIN VERIFIED MORPHO APY: ${apy.toFixed(2)}%`);
    console.log(`================================\n`);
    
  } catch (err) {
    console.error("Error verifying Morpho APY:", err);
  }
}

main();
