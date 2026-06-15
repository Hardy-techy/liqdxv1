import { useState, useMemo } from 'react';
import { ChatMessage } from '@/types/dashboard';

export function useTransactionHistory(messages: ChatMessage[]) {
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [txHistoryLoading, setTxHistoryLoading] = useState(false);
  const [txFilter, setTxFilter] = useState<"all" | "swap" | "bridge" | "deposit" | "withdraw">("all");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const fetchTxHistory = async (walletAddr: string, circleWalletAddress?: string) => {
    setTxHistoryLoading(true);
    try {
      const circleAddr = circleWalletAddress || "";
      const res = await fetch(`/api/chat?walletAddress=${walletAddr}&circleWalletAddress=${circleAddr}`);
      const data = await res.json();

      const txs = data.transactions || [];

      setTxHistory(txs);
    } catch (e) {
      console.error("Failed to fetch tx history:", e);
    } finally {
      setTxHistoryLoading(false);
    }
  };

  const volume24H = useMemo(() => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    let total = 0;
    const seen = new Set();

    const allTxs = [
      ...messages.map(m => ({
        intent: m.intent || (m.content.toLowerCase().includes("swap") ? "swap" : m.content.toLowerCase().includes("bridge") ? "bridge" : ""),
        message: m.content,
        amount: m.amount || m.amountIn,
        created_at: new Date().toISOString(),
        key: m.txHash || m.txId || m.id
      })),
      ...txHistory.map(t => ({
        intent: t.intent,
        message: t.message,
        amount: t.amount || t.amountIn,
        created_at: t.created_at,
        key: t.tx_hash || t.tx_id || t.id
      }))
    ];

    for (const tx of allTxs) {
      if (!tx.key || seen.has(tx.key)) continue;
      seen.add(tx.key);

      const intent = (tx.intent || "").toLowerCase();
      const isSwapOrBridge = intent.includes("swap") || intent.includes("bridge");
      const createdAt = new Date(tx.created_at || new Date());

      if (isSwapOrBridge && createdAt >= twentyFourHoursAgo) {
        let amt = parseFloat(tx.amount || "0");
        if (!amt && tx.message) {
          const match = tx.message.match(/(?:swapped|bridged)?\s*(\d+(?:\.\d+)?)\s+(?:USDC|EURC|USDT|ETH)/i);
          if (match) amt = parseFloat(match[1]);
        }
        if (!isNaN(amt)) {
          total += amt;
        }
      }
    }
    return total;
  }, [messages, txHistory]);

  const combinedTxs = useMemo(() => {
    const inMemoryTxs = messages
      .filter(m => m.txHash || m.txId)
      .map(m => ({
        id: m.id,
        intent: m.intent || (m.content.toLowerCase().includes("swap") ? "swap" : m.content.toLowerCase().includes("bridge") ? "bridge" : m.content.toLowerCase().includes("deposit") ? "deposit" : "wallet"),
        message: m.content,
        tx_hash: m.txHash || null,
        tx_id: m.txId || null,
        token_in: m.tokenIn || null,
        token_out: m.tokenOut || null,
        amount: null,
        status: m.status || "pending",
        created_at: m.createdAt || new Date().toISOString(),
        _source: "memory",
      }));
    const supabaseTxHashes = new Set(txHistory.map((t: any) => t.tx_hash || t.tx_id).filter(Boolean));
    const filteredMemory = inMemoryTxs.filter(m => {
      const key = m.tx_hash || m.tx_id;
      return !key || !supabaseTxHashes.has(key);
    });
    return [...txHistory, ...filteredMemory];
  }, [messages, txHistory]);

  const filteredTxs = useMemo(() => {
    let result = [...combinedTxs];

    if (txFilter !== "all") {
      result = result.filter(tx => tx.intent?.toLowerCase() === txFilter);
    }

    result.sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortField === "amount") {
        const amtA = parseFloat(a.amount) || 0;
        const amtB = parseFloat(b.amount) || 0;
        return sortOrder === "asc" ? amtA - amtB : amtB - amtA;
      }
      return 0;
    });

    return result;
  }, [combinedTxs, txFilter, sortField, sortOrder]);

  return {
    txHistory,
    txHistoryLoading,
    fetchTxHistory,
    volume24H,
    combinedTxs,
    filteredTxs,
    txFilter,
    setTxFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    isFilterDropdownOpen,
    setIsFilterDropdownOpen
  };
}
