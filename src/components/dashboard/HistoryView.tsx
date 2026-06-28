import React from 'react';
import { 
  Filter, 
  CheckCircle2, 
  ArrowUpDown, 
  ArrowRightLeft, 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  XCircle, 
  Clock, 
  ExternalLink 
} from "lucide-react";

interface HistoryViewProps {
  isFilterDropdownOpen: boolean;
  setIsFilterDropdownOpen: (open: boolean) => void;
  txFilter: "all" | "swap" | "bridge" | "deposit" | "withdraw";
  setTxFilter: (filter: "all" | "swap" | "bridge" | "deposit" | "withdraw") => void;
  address: string | undefined;
  fetchTxHistory: (address: string) => void;
  txHistoryLoading: boolean;
  sortField: "date" | "amount";
  setSortField: (field: "date" | "amount") => void;
  sortOrder: "desc" | "asc";
  setSortOrder: (order: "desc" | "asc") => void;
  filteredTxs: any[];
}

const formatTxDetails = (tx: any) => {
  if (!tx.message) return `${tx.intent} of ${tx.amount || "?"} USDC`;
  
  const msg = tx.message as string;
  // Compress long yield deposit messages
  if (msg.includes("Successfully supplied") || msg.includes("Successfully Supplied")) {
    const amountMatch = msg.match(/(\d+(?:\.\d+)?)\s*USDC/i);
    const amount = amountMatch ? amountMatch[1] : tx.amount || "?";
    const protocol = msg.toLowerCase().includes("morpho") ? "Morpho Vault" : "Aave V3";
    const chain = msg.toLowerCase().includes("base") ? "Base" : msg.toLowerCase().includes("arbitrum") ? "Arbitrum" : msg.toLowerCase().includes("optimism") ? "Optimism" : "Unknown Chain";
    return `Supply ${amount} USDC to ${protocol} (${chain})`;
  }
  
  // Compress Swap messages
  if (msg.toLowerCase().includes("swap of")) {
    const swapMatch = msg.match(/swap of ([\d.]+)\s*([A-Z]+)\s*to\s*([A-Z]+)/i);
    if (swapMatch) {
      return `Swap ${swapMatch[1]} ${swapMatch[2].toUpperCase()} to ${swapMatch[3].toUpperCase()}`;
    }
  }
  
  // Compress long yield withdrawal messages
  if (msg.includes("initiated withdrawal of") || msg.includes("Initiated Withdrawal Of")) {
    const amountMatch = msg.match(/withdrawal of (all your|\d+(?:\.\d+)?)/i);
    const amount = amountMatch ? (amountMatch[1].toLowerCase() === "all your" ? "All" : amountMatch[1]) : tx.amount || "All";
    const protocol = msg.toLowerCase().includes("morpho") ? "Morpho Vault" : "Aave V3";
    const chain = msg.toLowerCase().includes("base") ? "Base" : msg.toLowerCase().includes("arbitrum") ? "Arbitrum" : msg.toLowerCase().includes("optimism") ? "Optimism" : "Unknown Chain";
    return `Withdraw ${amount} USDC from ${protocol} (${chain})`;
  }

  return msg;
};

const getTxAmount = (tx: any) => {
  if (tx.amount) return tx.amount;
  if (!tx.message) return null;
  const msg = tx.message as string;
  if (msg.toLowerCase().includes("withdrawal of all your")) return "MAX";
  const amountMatch = msg.match(/(\d+(?:\.\d+)?)\s*(USDC|EURC|ETH)/i);
  if (amountMatch) return amountMatch[1];
  return null;
};

export function HistoryView({
  isFilterDropdownOpen,
  setIsFilterDropdownOpen,
  txFilter,
  setTxFilter,
  address,
  fetchTxHistory,
  txHistoryLoading,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  filteredTxs
}: HistoryViewProps) {
  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto flex-1 h-full min-h-0">
      <div className="flex flex-col relative w-full flex-1 h-full min-h-0">
        <div className="flex justify-between items-center mb-1 gap-2 shrink-0">
          <h3 className="text-lg font-semibold tracking-tight dark:text-white text-black font-sans">Activity</h3>

          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <button onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 dark:border-white/10 rounded-xl text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                <Filter className="w-3.5 h-3.5" /> {txFilter === 'all' ? 'All Types' : txFilter.charAt(0).toUpperCase() + txFilter.slice(1)}
                <svg className={`w-3.5 h-3.5 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-50 py-1">
                  {['all', 'swap', 'bridge', 'deposit', 'withdraw'].map((type) => (
                    <div key={type} className="px-3 py-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer capitalize transition-colors flex items-center justify-between" onClick={() => { setTxFilter(type as any); setIsFilterDropdownOpen(false); }}>
                      {type === 'all' ? 'All Types' : type}
                      {txFilter === type && <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => address && fetchTxHistory(address)}
              disabled={txHistoryLoading}
              className="flex items-center gap-1.5 text-xs font-medium dark:text-zinc-400 text-zinc-500 hover:dark:text-white hover:text-black transition-colors px-3 py-1.5 border dark:border-zinc-800 border-zinc-200 rounded-xl cursor-pointer bg-transparent"
            >
              {txHistoryLoading && <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              Refresh
            </button>
          </div>
        </div>

        <div className="w-full mt-1 overflow-auto flex-1 min-h-0 custom-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white dark:bg-[#09090b] z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
              <tr className="border-b border-zinc-100 dark:border-white/5 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
                <th className="py-2 pl-4 font-medium">Type</th>
                <th className="py-2 font-medium">Details</th>
                <th className="py-2 font-medium flex items-center gap-1.5 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors" onClick={() => { setSortField('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Date <ArrowUpDown className={`w-3 h-3 ${sortField === 'date' ? 'text-[#0066FF]' : ''}`} /></th>
                <th className="py-2 font-medium">Transaction Hash</th>
                <th className="py-2 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors" onClick={() => { setSortField('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Amount <ArrowUpDown className={`w-3 h-3 inline-block ml-1 ${sortField === 'amount' ? 'text-[#0066FF]' : ''}`} /></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (txHistoryLoading) return (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b dark:border-white/5 border-zinc-100">
                        <td className="py-4 pl-4"><div className="h-6 w-24 rounded-md skeleton" /></td>
                        <td className="py-4"><div className="h-4 w-48 rounded skeleton" /></td>
                        <td className="py-4"><div className="h-4 w-24 rounded skeleton" /></td>
                        <td className="py-4"><div className="h-6 w-20 rounded-md skeleton opacity-60" /></td>
                        <td className="py-4"><div className="h-4 w-16 rounded skeleton" /></td>
                      </tr>
                    ))}
                  </>
                );
                if (filteredTxs.length === 0) return (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[13px] font-medium tracking-tight dark:text-zinc-500 text-zinc-400">
                      No transactions recorded yet. Swaps, bridges, deposits, and withdrawals will appear here.
                    </td>
                  </tr>
                );
                return filteredTxs.map((tx: any, i: number) => {
                  return (
                    <tr key={i} className="border-b dark:border-white/5 border-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100 dark:border-white/5">
                            {tx.intent === 'swap' ? <ArrowRightLeft className="w-4 h-4 text-zinc-500" /> : tx.intent === 'bridge' ? <Zap className="w-4 h-4 text-zinc-500" /> : tx.intent === 'withdraw' ? <ArrowUpRight className="w-4 h-4 text-zinc-500" /> : <ArrowDownLeft className="w-4 h-4 text-zinc-500" />}
                          </div>
                          <span className="font-semibold text-[13.5px] text-zinc-900 dark:text-zinc-100 capitalize tracking-tight">
                            {tx.intent === 'swap' ? 'Swap' : tx.intent === 'bridge' ? 'Bridge' : tx.intent || 'Transaction'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-[13.5px] font-medium text-zinc-600 dark:text-zinc-300 capitalize">
                        {formatTxDetails(tx)}
                      </td>
                      <td className="py-4 text-[13px] text-zinc-500 dark:text-zinc-400">
                        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1.5 justify-center h-full pt-0.5">
                          {(tx.tx_hash || tx.tx_id) ? (
                            <a href={
                              (() => {
                                const chainStr = (tx.blockchain || tx.message || "").toLowerCase();
                                let base = "https://sepolia.arbiscan.io/tx/"; // default to arbitrum
                                if (chainStr.includes("optimism")) base = "https://sepolia-optimism.etherscan.io/tx/";
                                else if (chainStr.includes("base")) base = "https://sepolia.basescan.org/tx/";
                                else if (chainStr.includes("arc")) base = "https://testnet.arcscan.app/tx/";
                                
                                return `${base}${tx.tx_hash || tx.tx_id}`;
                              })()
                            } target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-500 hover:text-[#0066FF] dark:text-zinc-400 dark:hover:text-[#0066FF] transition-colors flex items-center gap-1.5 font-medium ml-1">
                              {(tx.tx_hash || tx.tx_id).slice(0, 6)}...{(tx.tx_hash || tx.tx_id).slice(-4)}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-[13px] text-zinc-400 dark:text-zinc-600 font-medium ml-1">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {getTxAmount(tx) ? `${getTxAmount(tx)} USDC` : '—'}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
