import React from 'react';

interface MorphoVaultWidgetProps {
  data: any;
}

export function MorphoVaultWidget({ data }: MorphoVaultWidgetProps) {
  // We expect data to have { apy: "15.98", vault: "USDC Base Vault", totalDeposits: "$...", netBorrowing: "$..." }
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse morpho data", e);
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-1 w-full max-w-sm">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/60 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full p-1.5 shadow-sm border border-zinc-100 dark:border-zinc-800 relative z-10 shrink-0">
            <img src="https://icons.llamao.fi/icons/protocols/morpho" alt="Morpho" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Morpho Base</span>
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">USDC/WETH Market</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[18px] font-bold text-emerald-600 dark:text-emerald-400">
            {parsedData.apy || "15.98"}% APY
          </span>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">Live Rate</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/40 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total Supply</span>
          <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">{parsedData.totalSupply || "74.00"} USDC</span>
        </div>
        <div className="p-3 rounded-xl bg-white/40 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total Borrowed</span>
          <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">{parsedData.totalBorrow || "74.00"} USDC</span>
        </div>
      </div>
      
      <div className="text-[12px] text-zinc-500 dark:text-zinc-400 px-1 mt-1 text-center bg-[#0066FF]/5 dark:bg-[#00A3FF]/10 py-2 rounded-xl border border-[#0066FF]/10 dark:border-[#00A3FF]/20">
        Market utilization is optimized at <span className="font-bold text-[#0066FF] dark:text-[#63B3FF]">{parsedData.utilization || "100"}%</span> to maximize APY.
      </div>
    </div>
  );
}
