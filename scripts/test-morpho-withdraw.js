const { createPublicClient, http, encodeFunctionData, parseAbi, parseAbiItem, keccak256, encodeAbiParameters } = require('viem');
const { baseSepolia } = require('viem/chains');

async function main() {
  const rpcClient = createPublicClient({ chain: baseSepolia, transport: http() });
  
  const sourceAddress = '0x151bf252252952ed7039e2e731d0600463f9c8b8';
  const morphoBlueAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
  
  const marketParams = {
    loanToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    collateralToken: '0x4200000000000000000000000000000000000006',
    oracle: '0x907F482666314CDC6041f25d79E32f694563f391',
    irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
    lltv: BigInt("860000000000000000")
  };
  
  const id = keccak256(encodeAbiParameters(
    [ { type: 'address' }, { type: 'address' }, { type: 'address' }, { type: 'address' }, { type: 'uint256' } ],
    [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv]
  ));

  const position = await rpcClient.readContract({
    address: morphoBlueAddress,
    abi: [parseAbiItem('function position(bytes32,address) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)')],
    functionName: 'position',
    args: [id, sourceAddress]
  });
  
  console.log("Shares:", position[0].toString());

  const morphoWithdrawAbi = parseAbi([
    'function withdraw((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)'
  ]);

  try {
    const res = await rpcClient.simulateContract({
      account: sourceAddress,
      address: morphoBlueAddress,
      abi: morphoWithdrawAbi,
      functionName: 'withdraw',
      args: [
        marketParams,
        BigInt(0),
        position[0],
        sourceAddress,
        sourceAddress
      ]
    });
    console.log("Simulation SUCCESS!");
  } catch (err) {
    console.error("Simulation FAILED:", err.message || err);
  }
}

main().catch(console.error);
