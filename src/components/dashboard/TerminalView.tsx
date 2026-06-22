import React from 'react';
import NetworkOptimism from '@web3icons/react/icons/networks/NetworkOptimism';
import NetworkBase from '@web3icons/react/icons/networks/NetworkBase';
import NetworkArc from '@web3icons/react/icons/networks/NetworkArc';
import NetworkArbitrumOne from '@web3icons/react/icons/networks/NetworkArbitrumOne';
import TokenUSDC from '@web3icons/react/icons/tokens/TokenUSDC';
import TokenEURC from '@web3icons/react/icons/tokens/TokenEURC';
import { ArrowRightLeft, Zap, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface TerminalViewProps {
  wallet: any;
  selectedChain: string;
  setSelectedChain: (chain: string) => void;
  fetchBalance: (walletId?: string) => void;
  balanceLoading?: boolean;
  totalPortfolioValue: number;
  uniqueBalancesArray: any[];
  inferSymbol: (b: any) => string;
  volume24H: number;
  activeAction: "none" | "deposit" | "withdraw";
  setActiveAction: (action: "none" | "deposit" | "withdraw") => void;
  allChainsNetWorth: number;
  txHistory: any[];
  combinedTxs: any[];
  holdingsView: "Assets" | "Chains";
  setHoldingsView: (view: "Assets" | "Chains") => void;
  isHoldingsDropdownOpen: boolean;
  setIsHoldingsDropdownOpen: (open: boolean) => void;
  allBalances: any[];
  credits: number;
  setActiveTab: (tab: any) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
}

export function TerminalView({
  wallet,
  selectedChain,
  setSelectedChain,
  fetchBalance,
  balanceLoading,
  totalPortfolioValue,
  uniqueBalancesArray,
  inferSymbol,
  volume24H,
  activeAction,
  setActiveAction,
  allChainsNetWorth,
  txHistory,
  combinedTxs,
  holdingsView,
  setHoldingsView,
  isHoldingsDropdownOpen,
  setIsHoldingsDropdownOpen,
  allBalances,
  credits,
  setActiveTab,
  isDropdownOpen,
  setIsDropdownOpen
}: TerminalViewProps) {
  return (
    <div className="flex flex-col w-full max-w-[1100px] mx-auto p-4 sm:p-5 gap-4">
      {/* TOP ROW: 2 Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Box 1: PORTFOLIO (Largest, Vibrant Blue) - Span 7 */}
        <div className="col-span-12 lg:col-span-7 bg-[#0088f0] rounded-[20px] p-6 shadow-md relative flex flex-col h-full min-h-0 overflow-hidden">
          {/* Crisp Professional Liquid Pattern */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none">
            {/* Distinct liquid shape 1 */}
            <div className="absolute top-[-20%] left-[5%] w-[450px] h-[450px] bg-white/[0.04] border border-white/10 animate-spin pointer-events-none origin-center" style={{ animationDuration: '35s', borderRadius: '40% 60% 70% 30%' }}></div>
            {/* Distinct liquid shape 2 */}
            <div className="absolute bottom-[-30%] right-[-10%] w-[550px] h-[550px] bg-black/[0.04] border border-black/10 animate-spin pointer-events-none origin-center" style={{ animationDuration: '45s', animationDirection: 'reverse', borderRadius: '60% 40% 30% 70%' }}></div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 relative z-20 gap-2 sm:gap-0">
            <div className="inline-flex py-1.5">
              <span className="text-[11px] font-bold text-white tracking-wider uppercase opacity-90">
                AI Wallet Active
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] text-[12px] sm:text-[13px] font-medium text-white transition-colors backdrop-blur-md">
                  {selectedChain === 'OP-SEPOLIA' ? <NetworkOptimism className="w-4 h-4 shrink-0" variant="branded" /> :
                    selectedChain === 'ARB-SEPOLIA' ? <NetworkArbitrumOne className="w-4 h-4 shrink-0" variant="branded" /> :
                      selectedChain === 'BASE-SEPOLIA' ? <NetworkBase className="w-4 h-4 shrink-0" variant="branded" /> :
                        <NetworkArc className="w-4 h-4 shrink-0" variant="branded" />}
                  <span className="truncate">{selectedChain === 'OP-SEPOLIA' ? 'Optimism' : selectedChain === 'ARB-SEPOLIA' ? 'Arbitrum' : selectedChain === 'BASE-SEPOLIA' ? 'Base' : 'Arc Testnet'}</span>
                  <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[160px] bg-white dark:bg-[#1A1A1A] border border-zinc-100 dark:border-white/5 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                    {[
                      { id: 'ARC-TESTNET', name: 'Arc Testnet', icon: NetworkArc },
                      { id: 'OP-SEPOLIA', name: 'Optimism', icon: NetworkOptimism },
                      { id: 'ARB-SEPOLIA', name: 'Arbitrum', icon: NetworkArbitrumOne },
                      { id: 'BASE-SEPOLIA', name: 'Base', icon: NetworkBase }
                    ].map((chain, i) => (
                      <div key={i} className="flex items-center px-3 py-2 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer transition-colors" onClick={() => { setSelectedChain(chain.id); setIsDropdownOpen(false); }}>
                        <div className="flex items-center gap-2.5">
                          <chain.icon className="w-4 h-4" variant="branded" />
                          <span className="text-[12px] font-medium text-zinc-900 dark:text-white">{chain.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] text-[12px] sm:text-[13px] font-medium text-white transition-colors backdrop-blur-md cursor-pointer shrink-0" onClick={() => { if (wallet?.address) { navigator.clipboard.writeText(wallet.address); } }}>
                <span>{wallet?.address ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}` : "Loading..."}</span>
                <svg className="w-3.5 h-3.5 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>

              <button onClick={() => fetchBalance(wallet?.id)} disabled={balanceLoading} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[8px] border border-white/20 flex items-center justify-center transition-colors backdrop-blur-md shrink-0 ${balanceLoading ? "text-white/50 cursor-not-allowed" : "text-white/90 hover:bg-white/10"}`}>
                <svg className={`w-4 h-4 text-white ${balanceLoading ? "animate-spin opacity-50" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col relative z-10 mt-3">
            <h2 className="text-[3rem] sm:text-[4rem] font-bold leading-none text-white tracking-tight">
              {totalPortfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6 sm:mt-3">
              <span className="text-[13px] font-medium text-white/80">
                USDC: <span className="font-bold text-white">{uniqueBalancesArray.filter(b => inferSymbol(b) === 'USDC').reduce((sum, b) => sum + Number(b.amount || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
              <span className="text-white/40 text-[10px]">●</span>
              <span className="text-[13px] font-medium text-white/80">
                EURC: <span className="font-bold text-white">{uniqueBalancesArray.filter(b => inferSymbol(b) === 'EURC').reduce((sum, b) => sum + Number(b.amount || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-auto relative z-10 transition-all duration-300">
            <button onClick={() => setActiveAction("deposit")} className={`px-5 py-2.5 rounded-[8px] text-[13px] font-bold shadow-md hover:scale-105 transition-all cursor-pointer ${activeAction === "deposit" ? "bg-white text-[#0088f0] ring-4 ring-white/20" : "bg-white text-[#0088f0]"}`}>
              Deposit
            </button>
            <button onClick={() => setActiveAction("withdraw")} className={`px-5 py-2.5 border text-[13px] font-bold transition-all cursor-pointer rounded-[8px] ${activeAction === "withdraw" ? "border-white bg-white/20 text-white ring-4 ring-white/10" : "border-white/30 text-white hover:bg-white/10"}`}>
              Withdraw
            </button>
            <div className="ml-auto hidden sm:flex items-center gap-6 text-white/80">
              <div className="flex flex-col items-end">
                <span className="text-[11px] uppercase tracking-wider">24H Volume</span>
                <span className="text-[14px] font-bold text-white">{volume24H.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: KEY METRICS (4 Stats grouped) - Span 5 */}
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-[#1A1A1A] rounded-[20px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-zinc-100 dark:border-white/5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[16px] font-medium text-zinc-900 dark:text-white">Key Metrics</h3>
            <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="bg-zinc-50 dark:bg-[#2A2A2A]/50 rounded-2xl p-3.5 flex flex-col justify-center min-h-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <span className="text-[11px] font-medium text-zinc-500 mb-1 z-10 relative">Net Worth</span>
              <span className="text-[1rem] sm:text-[1.2rem] font-bold text-zinc-900 dark:text-white z-10 relative">${allChainsNetWorth.toFixed(2)}</span>
            </div>

            <div className="bg-zinc-50 dark:bg-[#2A2A2A]/50 rounded-2xl p-3.5 flex flex-col justify-center min-h-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <span className="text-[11px] font-medium text-zinc-500 mb-1 z-10 relative">Total Tx</span>
              <span className="text-[1rem] sm:text-[1.2rem] font-bold text-zinc-900 dark:text-white z-10 relative">{txHistory.length || 24}</span>
            </div>

            <div className="bg-zinc-50 dark:bg-[#2A2A2A]/50 rounded-2xl p-3.5 flex flex-col justify-center min-h-0">
              <span className="text-[11px] font-medium text-zinc-500 mb-1">Exposure</span>
              <div className="flex items-center justify-between">
                <span className="text-[1rem] sm:text-[1.2rem] font-bold text-zinc-900 dark:text-white">4 Chains</span>
                <div className="flex -space-x-1.5">
                  <NetworkArc className="w-[22px] h-[22px] rounded-full ring-[2px] ring-zinc-50 dark:ring-[#2A2A2A] bg-white dark:bg-[#1A1A1A] relative z-40" variant="branded" />
                  <NetworkOptimism className="w-[22px] h-[22px] rounded-full ring-[2px] ring-zinc-50 dark:ring-[#2A2A2A] bg-white dark:bg-[#1A1A1A] relative z-30" variant="branded" />
                  <NetworkBase className="w-[22px] h-[22px] rounded-full ring-[2px] ring-zinc-50 dark:ring-[#2A2A2A] bg-white dark:bg-[#1A1A1A] relative z-20" variant="branded" />
                  <NetworkArbitrumOne className="w-[22px] h-[22px] rounded-full ring-[2px] ring-zinc-50 dark:ring-[#2A2A2A] bg-white dark:bg-[#1A1A1A] relative z-10" variant="branded" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-[#2A2A2A]/50 rounded-2xl p-3.5 flex flex-col justify-center min-h-0">
              <span className="text-[11px] font-medium text-zinc-500 mb-1">Assets</span>
              <div className="flex items-center justify-between">
                <span className="text-[1rem] sm:text-[1.2rem] font-bold text-zinc-900 dark:text-white">2</span>
                <div className="flex -space-x-1.5">
                  <TokenUSDC className="w-[22px] h-[22px] rounded-full ring-[2px] ring-zinc-50 dark:ring-[#2A2A2A] bg-white dark:bg-[#1A1A1A] relative z-20" variant="branded" />
                  <TokenEURC className="w-[22px] h-[22px] rounded-full ring-[2px] ring-zinc-50 dark:ring-[#2A2A2A] bg-white dark:bg-[#1A1A1A] relative z-10" variant="branded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: 3 Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Box 3: TRANSACTION HISTORY */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[20px] px-6 pt-6 pb-4 shadow-[0_2px_10px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-zinc-100 dark:border-white/5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-[16px] font-medium text-zinc-900 dark:text-white tracking-tight">Transaction History</h3>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            </div>
          </div>
          <div className="flex flex-col gap-0 flex-1 pr-1">
            {combinedTxs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 text-[13px] py-4">
                No recent transactions
              </div>
            ) : (
              combinedTxs.slice(0, 3).map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                      {tx.intent === 'swap' ? <ArrowRightLeft className="w-4 h-4" /> : tx.intent === 'bridge' ? <Zap className="w-4 h-4" /> : tx.intent === 'withdraw' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium text-zinc-900 dark:text-white capitalize">{tx.intent === 'swap' ? 'Token Swap' : tx.intent === 'bridge' ? 'Bridge' : tx.intent || 'Transaction'}</span>
                      <span className="text-[12px] text-zinc-500">{new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-zinc-100 dark:bg-[#2A2A2A] rounded-full text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      {tx.status === 'success' ? 'Completed' : 'Pending'}
                    </div>
                    <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    </button>
                  </div>
                </div>
              )))}
          </div>
        </div>

        {/* Box 4: HOLDINGS / SPENDING OVERVIEW */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[20px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-zinc-100 dark:border-white/5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8 px-2 relative">
            <h3 className="text-[16px] font-medium text-zinc-900 dark:text-white">Holdings Overview</h3>
            <div className="relative">
              <div onClick={() => setIsHoldingsDropdownOpen(!isHoldingsDropdownOpen)} className="px-3 py-1 border border-zinc-200 dark:border-white/10 rounded-full text-[12px] font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer transition-colors">
                {holdingsView} <svg className={`w-3 h-3 transition-transform ${isHoldingsDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
              {isHoldingsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-[#2A2A2A] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="flex flex-col py-1">
                    <button onClick={() => { setHoldingsView("Assets"); setIsHoldingsDropdownOpen(false); }} className={`px-4 py-2 text-[13px] font-medium text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${holdingsView === 'Assets' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-white/5' : 'text-zinc-500'}`}>Assets</button>
                    <button onClick={() => { setHoldingsView("Chains"); setIsHoldingsDropdownOpen(false); }} className={`px-4 py-2 text-[13px] font-medium text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${holdingsView === 'Chains' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-white/5' : 'text-zinc-500'}`}>Chains</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-end justify-center gap-4 sm:gap-6 px-2 pb-2 h-full min-h-[120px] sm:min-h-[140px] mx-auto w-full max-w-[280px]">
            {allBalances.length >= 0 ? (() => {
              let aggregated: { label: string, amount: number, pct: number }[] = [];

              if (holdingsView === 'Assets') {
                const sums: Record<string, number> = {};
                allBalances.forEach(b => {
                  const sym = inferSymbol(b);
                  sums[sym] = (sums[sym] || 0) + Number(b.amount || 0);
                });
                // Ensure at least USDC and EURC show up
                if (sums['USDC'] === undefined) sums['USDC'] = 0;
                if (sums['EURC'] === undefined) sums['EURC'] = 0;

                const totalAssets = Object.values(sums).reduce((a, b) => a + b, 0);
                aggregated = Object.entries(sums).map(([label, amount]) => ({
                  label,
                  amount,
                  pct: totalAssets > 0 ? (amount / totalAssets) * 100 : 0
                }));
              } else {
                // Preset all 4 chains so they always show up
                const sums: Record<string, number> = { Arbitrum: 0, Base: 0, Optimism: 0, Arc: 0 };
                allBalances.forEach(b => {
                  const chainId = (b.token?.blockchain || 'ARC-TESTNET').toUpperCase();
                  let label = 'Arc';
                  if (chainId.includes('ARB')) label = 'Arbitrum';
                  else if (chainId.includes('OP')) label = 'Optimism';
                  else if (chainId.includes('BASE')) label = 'Base';
                  sums[label] += Number(b.amount || 0);
                });

                const totalChains = Object.values(sums).reduce((a, b) => a + b, 0);
                aggregated = Object.entries(sums).map(([label, amount]) => ({
                  label,
                  amount,
                  pct: totalChains > 0 ? (amount / totalChains) * 100 : 0
                }));
              }

              // Sort descending by amount to show the largest items first
              aggregated.sort((a, b) => b.amount - a.amount);

              return aggregated.slice(0, 4).map((item, i) => {
                const isMain = i === 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                    <span className={`text-[12px] font-medium ${isMain ? 'text-[#0088f0]' : 'text-zinc-500'}`}>{item.pct.toFixed(0)}%</span>
                    <div className={`w-full max-w-[48px] rounded-t-xl transition-all relative overflow-hidden ${isMain ? 'bg-[#0088f0]' : 'bg-[#E5E7EB] dark:bg-[#2A2A2A]'}`} style={{ height: `${Math.max(15, item.pct)}%` }}>
                      {isMain && (
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, white 4px, white 8px)' }}></div>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium">{item.label}</span>
                  </div>
                );
              });
            })() : null}
          </div>
        </div>

        {/* Box 5: AI AGENT HUB */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[20px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col relative h-full border border-zinc-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium text-zinc-900 dark:text-white">AI Credits</h3>
            <div className="px-3 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-[12px] rounded-full font-medium">Monthly</div>
          </div>

          <div className="flex flex-col flex-1 items-center justify-center">
            <span className="text-[2.5rem] leading-none font-semibold text-zinc-900 dark:text-white tracking-tight">
              {credits % 1 === 0 ? credits.toLocaleString() : credits.toFixed(1)}
            </span>
            <span className="text-[13px] text-zinc-500 font-medium mt-1">Credits Available</span>
          </div>

          <div className="mt-auto">
            {(() => {
              const maxCredits = credits > 20 ? 25 : 20;
              const usedCredits = Math.max(0, maxCredits - credits);
              const percentUsed = Math.min(100, (usedCredits / maxCredits) * 100);
              
              return (
                <>
                  <div className="flex justify-between text-[12px] font-medium text-zinc-500 mb-1.5">
                    <span>Usage</span>
                    <span>{usedCredits % 1 === 0 ? usedCredits : usedCredits.toFixed(1)} / {maxCredits}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-[#2A2A2A] overflow-hidden mb-3">
                    <div className="h-full bg-[#FF7A00] rounded-full transition-all duration-500" style={{ width: `${percentUsed}%` }}></div>
                  </div>
                  <button onClick={() => setActiveTab("credits")} className="w-full py-2 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-900 dark:text-white rounded-2xl text-[13px] font-medium transition-all flex items-center justify-center gap-2">
                    Top Up Credits
                  </button>
                </>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
