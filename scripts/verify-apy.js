const { createPublicClient, http } = require('viem');
const { arbitrumSepolia, baseSepolia, optimismSepolia } = require('viem/chains');

const UI_POOL_DATA_PROVIDER_ABI = [
  {
    "inputs": [
      { "internalType": "contract IPoolAddressesProvider", "name": "provider", "type": "address" }
    ],
    "name": "getReservesData",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "underlyingAsset", "type": "address" },
          { "internalType": "string", "name": "symbol", "type": "string" },
          { "internalType": "uint128", "name": "liquidityRate", "type": "uint128" }
        ],
        "internalType": "struct IUiPoolDataProviderV3.AggregatedReserveData[]",
        "name": "",
        "type": "tuple[]"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "marketReferenceCurrencyUnit", "type": "uint256" }
        ],
        "internalType": "struct IUiPoolDataProviderV3.BaseCurrencyInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONFIG = {
  arbitrumSepolia: {
    chain: arbitrumSepolia,
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    dataProvider: "0x97Cf44bF6a9A3D2B4F32b05C480dBEdC018F72A9",
    addressProvider: "0xB25a5D144626a0D488e52AE717A051a2E9997076",
  },
  baseSepolia: {
    chain: baseSepolia,
    rpc: "https://sepolia.base.org",
    dataProvider: "0x6a9D64f93DB660EaCB2b6E9424792c630CdA87d8",
    addressProvider: "0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00",
  },
  optimismSepolia: {
    chain: optimismSepolia,
    rpc: "https://sepolia.optimism.io",
    dataProvider: "0x86E2938daE289763D4e09a7e42c5cCcA62Cf9809",
    addressProvider: "0x36616cf17557639614c1cdDb356b1B83fc0B2132",
  }
};

async function checkAaveAPY(network) {
  const config = CONFIG[network];
  const client = createPublicClient({ chain: config.chain, transport: http(config.rpc) });
  
  try {
    const data = await client.readContract({
      address: config.dataProvider,
      abi: UI_POOL_DATA_PROVIDER_ABI,
      functionName: 'getReservesData',
      args: [config.addressProvider]
    });
    
    const reserves = data[0];
    
    for (const r of reserves) {
      if (!r.liquidityRate) continue;
      
      const RAY = 10n ** 27n;
      const SECONDS_PER_YEAR = 31536000n;
      
      // Calculate using BigInt to prevent precision loss before float conversion
      const apr = Number(r.liquidityRate) / Number(RAY);
      const ratePerSecond = apr / Number(SECONDS_PER_YEAR);
      const apy = (Math.pow(1 + ratePerSecond, Number(SECONDS_PER_YEAR)) - 1) * 100;
      
      console.log(`[${network}] Symbol: '${r.symbol}', Raw LiquidityRate: ${r.liquidityRate}, APR: ${(apr * 100).toFixed(4)}%, APY: ${apy.toFixed(4)}%`);
    }
  } catch (err) {
    console.error(`[${network}] Error fetching APY:`, err.shortMessage || err.message);
  }
}

async function main() {
  console.log("Verifying ALL Aave V3 APYs via UiPoolDataProvider with RAW DATA...");
  await checkAaveAPY("arbitrumSepolia");
  await checkAaveAPY("baseSepolia");
  await checkAaveAPY("optimismSepolia");
}

main();
