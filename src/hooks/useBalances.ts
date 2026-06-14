import { useState, useMemo, useEffect } from "react";

export function useBalances({ wallet, wallets }: { wallet: any, wallets: any[] }) {
  const [balances, setBalances] = useState<any[]>([]);
  const [allBalances, setAllBalances] = useState<any[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [allChainsNetWorth, setAllChainsNetWorth] = useState<number>(0);
  const [allChainsNetWorthLoading, setAllChainsNetWorthLoading] = useState(false);

  const [selectedChain, setSelectedChain] = useState<"all" | "Optimism" | "Polygon" | "Arbitrum" | "Optimism" | "Avalanche" | "Base" | "ARC-TESTNET">("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [holdingsView, setHoldingsView] = useState<"Assets" | "Chains">("Assets");
  const [isHoldingsDropdownOpen, setIsHoldingsDropdownOpen] = useState(false);

  const fetchAllBalances = async () => {
    if (wallets.length === 0) return;
    setAllChainsNetWorthLoading(true);
    setBalanceLoading(true);
    try {
      let total = 0;
      const balancesArrays = await Promise.all(
        wallets.map(async (w: any) => {
          try {
            const res = await fetch("/api/wallets/actions", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletId: w.id, action: "balance" }),
            });
            const data = await res.json();
            if (res.ok && data.balances) {
              const uniqueBalances = new Map();
              for (const b of data.balances) {
                const sym = b.token?.symbol || "Unknown";
                if (!uniqueBalances.has(sym) || b.token?.isNative) {
                  uniqueBalances.set(sym, b);
                }
              }
              return Array.from(uniqueBalances.values());
            }
          } catch (e) {
            console.error("Failed to fetch balance for wallet", w.id, e);
          }
          return [];
        })
      );

      const globalBalances = balancesArrays.flat();
      globalBalances.forEach(b => {
        total += parseFloat(b.amount || "0");
      });

      setAllBalances(globalBalances);
      setBalances(globalBalances); // Also update 'balances' for backwards compatibility
      setAllChainsNetWorth(total);
    } finally {
      setAllChainsNetWorthLoading(false);
      setBalanceLoading(false);
    }
  };

  const fetchBalance = async (walletId?: string) => {
    // We ignore the specific walletId and refresh all balances to keep UI in sync
    await fetchAllBalances();
  };

  useEffect(() => {
    fetchAllBalances();
  }, [wallets]);

  // Helper to infer missing token symbols from testnets
  const inferSymbol = (b: any) => {
    if (b.token?.symbol) return b.token.symbol;
    if (b.token?.tokenAddress === "0x3600000000000000000000000000000000000000") return "USDC";
    if (!b.token?.tokenAddress) return "ARC"; // Native gas
    return "USDC"; // Fallback
  };

  // Deduplicate balances to avoid double-counting tokens, and filter by selectedChain
  const uniqueBalancesArray = useMemo(() => {
    let filtered = allBalances;
    if (selectedChain !== "all") {
      filtered = allBalances.filter(b => (b.token?.blockchain || 'ARC-TESTNET').toUpperCase() === selectedChain);
    } else {
      // If "all" is selected but we still want to default to ARC if allBalances is empty
      filtered = allBalances;
    }
    
    // Only fallback if "all" is selected, don't fallback if the user specifically chose an empty chain
    if (filtered.length === 0 && balances.length > 0 && selectedChain === "all") {
       filtered = balances;
    }

    const map = new Map();
    for (const b of filtered) {
      const sym = inferSymbol(b);
      if (!map.has(sym) || b.token?.isNative) {
        map.set(sym, b);
      }
    }
    return Array.from(map.values());
  }, [allBalances, balances, selectedChain]);

  // Calculate total portfolio value across all fetched balances for the selected chain
  const totalPortfolioValue = useMemo(() => {
    let total = 0;
    for (const b of uniqueBalancesArray) {
      total += parseFloat(b.amount || "0");
    }
    if (total > 0) return total;
    
    // Fallback for demo purposes if API hasn't loaded
    if (selectedChain === 'ARC-TESTNET' || selectedChain === 'all') {
      return allChainsNetWorth || 0;
    }
    return 0;
  }, [uniqueBalancesArray, allChainsNetWorth, selectedChain]);

  return {
    balances,
    allBalances,
    balanceLoading,
    allChainsNetWorth,
    allChainsNetWorthLoading,
    fetchBalance,
    inferSymbol,
    uniqueBalancesArray,
    totalPortfolioValue,
    setBalances,
    selectedChain,
    setSelectedChain,
    isDropdownOpen,
    setIsDropdownOpen,
    holdingsView,
    setHoldingsView,
    isHoldingsDropdownOpen,
    setIsHoldingsDropdownOpen
  };
}
