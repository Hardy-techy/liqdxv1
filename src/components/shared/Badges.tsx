import React from 'react';
import NetworkOptimism from '@web3icons/react/icons/networks/NetworkOptimism';
import NetworkSolana from '@web3icons/react/icons/networks/NetworkSolana';
import NetworkBase from '@web3icons/react/icons/networks/NetworkBase';
import NetworkSepolia from '@web3icons/react/icons/networks/NetworkSepolia';
import NetworkArc from '@web3icons/react/icons/networks/NetworkArc';
import NetworkArbitrumOne from '@web3icons/react/icons/networks/NetworkArbitrumOne';
import NetworkAvalanche from '@web3icons/react/icons/networks/NetworkAvalanche';
import NetworkPolygon from '@web3icons/react/icons/networks/NetworkPolygon';

const TOKEN_LOGOS: Record<string, string> = {
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  EURC: "https://s2.coinmarketcap.com/static/img/coins/64x64/20641.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
};

export const TokenBadge = ({ symbol, amount }: { symbol: any, amount?: any }) => {
  const symStr = typeof symbol === "object" ? (symbol?.symbol || symbol?.token || "USDC") : String(symbol || "USDC");
  const rawAmtStr = typeof amount === "object" ? (amount?.amount || amount?.value || "0") : (amount ? String(amount) : undefined);
  const amtStr = rawAmtStr && !isNaN(parseFloat(rawAmtStr)) ? parseFloat(rawAmtStr).toFixed(2) : rawAmtStr;
  const logo = TOKEN_LOGOS[symStr.toUpperCase()];
  return (
    <div className="flex flex-col gap-2 items-center">
      {logo ? (
        <img src={logo} className="w-10 h-10 rounded-full bg-white p-0.5 shadow-sm border border-zinc-200 dark:border-zinc-800" alt={symStr} />
      ) : (
        <div className="w-10 h-10 rounded-full dark:bg-zinc-800 bg-zinc-200 border dark:border-zinc-700 border-zinc-300 flex items-center justify-center dark:text-zinc-300 text-zinc-700 text-xs font-bold shadow-sm">
          {symStr.slice(0, 3)}
        </div>
      )}
      {amtStr && <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">{amtStr}</span>}
      <span className="text-[11px] font-bold dark:text-zinc-500 text-zinc-400">{symStr}</span>
    </div>
  );
}

export const ChainBadge = ({ chainName, amount }: { chainName: any, amount?: any }) => {
  const nameStr = typeof chainName === "object" ? (chainName?.name || "Arc") : String(chainName || "Arc");
  const rawAmtStr = typeof amount === "object" ? (amount?.amount || amount?.value || "0") : (amount ? String(amount) : undefined);
  const amtStr = rawAmtStr && !isNaN(parseFloat(rawAmtStr)) ? parseFloat(rawAmtStr).toFixed(2) : rawAmtStr;
  const name = nameStr.toLowerCase();
  let IconComponent = null;
  let displayName = nameStr;

  if (name.includes('op') || name.includes('optimism')) {
    IconComponent = NetworkOptimism;
    displayName = 'Optimism';
  } else if (name.includes('sol')) {
    IconComponent = NetworkSolana;
    displayName = 'Solana';
  } else if (name.includes('base')) {
    IconComponent = NetworkBase;
    displayName = 'Base';
  } else if (name.includes('arb')) {
    IconComponent = NetworkArbitrumOne;
    displayName = 'Arbitrum';
  } else if (name.includes('arc')) {
    IconComponent = NetworkArc;
    displayName = 'Arc';
  } else if (name.includes('sep')) {
    IconComponent = NetworkSepolia;
    displayName = 'Sepolia';
  } else if (name.includes('avax') || name.includes('fuji')) {
    IconComponent = NetworkAvalanche;
    displayName = 'Avalanche';
  }

  return (
    <div className="flex flex-col gap-2 items-center">
      {IconComponent ? (
        <IconComponent className="w-10 h-10" variant="branded" />
      ) : (
        <div className="w-10 h-10 rounded-full dark:bg-zinc-800 bg-zinc-200 border dark:border-zinc-700 border-zinc-300 flex items-center justify-center dark:text-zinc-300 text-zinc-700 text-xs font-bold shadow-sm">
          {displayName.slice(0, 3)}
        </div>
      )}
      {amtStr && <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">{amtStr}</span>}
      <span className="text-[11px] font-bold dark:text-zinc-500 text-zinc-400">{displayName}</span>
    </div>
  );
};
