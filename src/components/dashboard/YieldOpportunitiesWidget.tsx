import React from 'react';
import TokenAAVE from '@web3icons/react/icons/tokens/TokenAAVE';

interface YieldOpportunitiesWidgetProps {
  data: string; // JSON string from the backend
}

export function YieldOpportunitiesWidget({ data }: YieldOpportunitiesWidgetProps) {
  let parsedData: any[] = [];
  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse yield options data", e);
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800/60 border-zinc-200/60 rounded-[18px] p-4 w-[320px] max-w-full shadow-sm mt-1">
      <div className="flex items-center justify-between mb-3 pb-2 dark:border-zinc-800/50 border-zinc-100 border-b">
        <span className="text-[11px] font-bold dark:text-zinc-400 text-zinc-500 uppercase tracking-widest font-sans flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Yield Opportunities
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {parsedData.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-[#0066FF]/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="relative">
                {item.protocol.includes("Aave") ? (
                  <TokenAAVE className="w-8 h-8 drop-shadow-sm" variant="branded" />
                ) : (
                  <img src="https://icons.llamao.fi/icons/protocols/morpho" className="w-8 h-8 rounded-full drop-shadow-sm bg-white" alt="Morpho" />
                )}
                {/* Small asset icon (USDC) overlay */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-800 p-[1px] shadow-sm">
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" className="w-full h-full rounded-full" alt="USDC" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{item.protocol}</span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">{item.chain}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-black text-[#0066FF] dark:text-[#63B3FF]">{String(item.apy).replace('%', '')}% APY</span>
              <span className="text-[10px] font-semibold text-zinc-400">Earn {item.asset}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
