"use client";
import { useState, Suspense, useRef, useEffect } from "react";
import { useAccount, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { useTheme } from "@/components/Providers";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LandingPage } from "@/components/dashboard/LandingPage";
import { TerminalView } from "@/components/dashboard/TerminalView";
import { IntelligenceView } from "@/components/dashboard/IntelligenceView";
import { HistoryView } from "@/components/dashboard/HistoryView";
import { CreditsView } from "@/components/dashboard/CreditsView";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useChatSession } from "@/hooks/useChatSession";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useBalances } from "@/hooks/useBalances";

function DashboardInner() {
  const { address, isConnected, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"terminal" | "intelligence" | "history" | "credits">("terminal");
  const [activeAction, setActiveAction] = useState<"none" | "deposit" | "withdraw">("none");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState("");

  const fetchBalanceRef = useRef<any>(null);
  const fetchTxHistoryRef = useRef<any>(null);

  // Custom Hooks
  const {
    isAuthenticated,
    isAuthenticating,
    wallet,
    wallets,
    twitterHandle,
    authError,
    setAuthError,
    renderErrorToast,
    credits,
    setCredits,
    topUpLoading,
    setTopUpLoading
  } = useWalletAuth();

  const {
    chatInput,
    setChatInput,
    messages,
    isSubmitting,
    chatContainerRef,
    chatSessions,
    chatSessionId,
    startNewChat,
    switchSession,
    isChatEmpty,
    loadChatSessionsAndOpenRecent,
    handleChatSubmit,
    isLoadingSession,
  } = useChatSession({
    address,
    wallet,
    setActiveTab,
    fetchBalance: (id: string) => fetchBalanceRef.current?.(id),
    fetchTxHistory: (addr: string) => fetchTxHistoryRef.current?.(addr),
    setAuthError,
    setCredits
  });

  const {
    txHistory,
    txHistoryLoading,
    fetchTxHistory,
    txFilter,
    setTxFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    isFilterDropdownOpen,
    setIsFilterDropdownOpen,
    volume24H,
    combinedTxs,
    filteredTxs,
  } = useTransactionHistory(messages);

  const {
    selectedChain,
    setSelectedChain,
    isDropdownOpen,
    setIsDropdownOpen,
    allBalances,
    allChainsNetWorth,
    totalPortfolioValue,
    uniqueBalancesArray,
    inferSymbol,
    fetchBalance,
    balanceLoading,
    holdingsView,
    setHoldingsView,
    isHoldingsDropdownOpen,
    setIsHoldingsDropdownOpen,
  } = useBalances({ wallet, wallets });

  // Update refs
  useEffect(() => {
    fetchBalanceRef.current = fetchBalance;
    fetchTxHistoryRef.current = fetchTxHistory;
  }, [fetchBalance, fetchTxHistory]);

  // Initial Fetch Data (on connect)
  useEffect(() => {
    if (isAuthenticated && wallet?.id && address) {
      fetchBalance(wallet.id);
      fetchTxHistory(address, wallet.address);
      loadChatSessionsAndOpenRecent(address);
    }
  }, [isAuthenticated, wallet?.id, address]);

  // --- Real Deposit & Withdraw Logic ---
  const handleDeposit = async () => {
    if (!wallet?.address || !depositAmount) return;
    setTransferStatus("Prompting wallet to send native USDC...");
    try {
      const tx = await sendTransactionAsync({
        to: wallet.address as `0x${string}`,
        value: parseEther(depositAmount),
      });
      setTransferStatus(`Deposit submitted! TX: ${tx.slice(0, 10)}... Waiting for confirmation.`);

      // Log to Supabase
      try {
        await fetch("/api/wallets/actions", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
            action: "logDeposit",
            amount: depositAmount,
            walletAddress: address,
            walletId: wallet.id,
            txHash: tx
          })
        });
      } catch (logErr) { console.error("Failed to log deposit:", logErr); }

      setDepositAmount("");
      setTimeout(() => {
        fetchBalance(wallet.id);
        if (address) fetchTxHistory(address); // refresh history tab
        setTransferStatus("");
        setActiveAction("none");
      }, 5000);
    } catch (err: any) {
      setTransferStatus(`Deposit failed: ${err.shortMessage || err.message}`);
      setTimeout(() => setTransferStatus(""), 5000);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet?.id || !address || !withdrawAmount) return;
    setTransferStatus("Initiating autonomous wallet withdrawal...");
    try {
      const res = await fetch("/api/wallets/actions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          action: "withdraw",
          walletId: wallet.id,
          walletAddress: wallet.address,
          blockchain: wallet.blockchain,
          amount: withdrawAmount,
          destinationAddress: address
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransferStatus(`Withdrawal initiated! Circle TX ID: ${data.transactionId}`);
      setWithdrawAmount("");
      setTimeout(() => {
        fetchBalance(wallet.id);
        if (address) fetchTxHistory(address); // refresh history tab
        setTransferStatus("");
        setActiveAction("none");
      }, 5000);
    } catch (err: any) {
      setTransferStatus(`Withdraw failed: ${err.message}`);
      setTimeout(() => setTransferStatus(""), 5000);
    }
  };

  // Render pre-auth landing if not connected, wrong chain, or not authenticated
  if (!isConnected || chainId !== 5042002 || (!isAuthenticated && !isAuthenticating)) {
    return <LandingPage authError={authError} setAuthError={setAuthError} />;
  }

  // Render loading state while user is signing the SIWE message
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium">Please sign the message in your wallet...</p>
        </div>
      </div>
    );
  }

  // Render Connected Dashboard Layout
  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      renderErrorToast={renderErrorToast}
      twitterHandle={twitterHandle}
      theme={theme}
      toggleTheme={toggleTheme}
      address={wallet?.address}
      circleWalletId={wallet?.id}
    >
      {activeTab === "terminal" && (
        <TerminalView
          wallet={wallet}
          selectedChain={selectedChain}
          setSelectedChain={setSelectedChain as any}
          fetchBalance={fetchBalance}
          balanceLoading={balanceLoading}
          totalPortfolioValue={totalPortfolioValue}
          uniqueBalancesArray={uniqueBalancesArray}
          inferSymbol={inferSymbol}
          volume24H={volume24H}
          activeAction={activeAction}
          setActiveAction={setActiveAction}
          allChainsNetWorth={allChainsNetWorth}
          txHistory={txHistory}
          combinedTxs={combinedTxs}
          holdingsView={holdingsView}
          setHoldingsView={setHoldingsView}
          isHoldingsDropdownOpen={isHoldingsDropdownOpen}
          setIsHoldingsDropdownOpen={setIsHoldingsDropdownOpen}
          allBalances={allBalances}
          credits={credits}
          setActiveTab={setActiveTab}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
        />
      )}

      {activeTab === "intelligence" && (
        <IntelligenceView
          startNewChat={startNewChat}
          chatSessions={chatSessions}
          switchSession={switchSession}
          chatSessionId={chatSessionId}
          isChatEmpty={isChatEmpty}
          handleChatSubmit={handleChatSubmit}
          chatInput={chatInput}
          setChatInput={setChatInput}
          wallet={wallet}
          isSubmitting={isSubmitting}
          chatContainerRef={chatContainerRef}
          messages={messages}
          isLoadingSession={isLoadingSession}
        />
      )}

      {activeTab === "history" && (
        <HistoryView
          isFilterDropdownOpen={isFilterDropdownOpen}
          setIsFilterDropdownOpen={setIsFilterDropdownOpen}
          txFilter={txFilter}
          setTxFilter={setTxFilter}
          address={wallet?.address}
          fetchTxHistory={fetchTxHistory}
          txHistoryLoading={txHistoryLoading}
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          filteredTxs={filteredTxs}
        />
      )}

      {activeTab === "credits" && (
        <CreditsView
          credits={credits}
          wallet={wallet}
          uniqueBalancesArray={uniqueBalancesArray}
          inferSymbol={inferSymbol}
          topUpLoading={topUpLoading}
          setTopUpLoading={setTopUpLoading}
          setCredits={setCredits}
          fetchBalance={fetchBalance}
          setAuthError={setAuthError}
        />
      )}

      {/* Premium DeFi Modal (Deposit & Withdraw) */}
      {activeAction !== "none" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity animate-fade-in"
            onClick={() => setActiveAction("none")}
          />
          {/* Modal Container */}
          <div className="relative w-full max-w-[280px] bg-white/70 dark:bg-[#111]/70 backdrop-blur-3xl rounded-[24px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-white/50 dark:border-white/10 overflow-hidden transform transition-all animate-[fadeIn_0.2s_ease-out_forwards]">

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
              <div className="w-6" /> {/* Spacer for centering */}
              <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-white">
                {activeAction === "deposit" ? "Deposit" : "Withdraw"}
              </h3>
              <button
                onClick={() => { setActiveAction("none"); setTransferStatus(""); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100/50 dark:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-4 pb-4 pt-2 flex flex-col items-center">

              {/* The Minimalist Input */}
              <div className="w-full flex flex-col items-center justify-center mb-6 relative">
                <input
                  type="text"
                  value={activeAction === "deposit" ? depositAmount : withdrawAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    if (val.split('.').length > 2) return;
                    activeAction === "deposit" ? setDepositAmount(val) : setWithdrawAmount(val);
                  }}
                  placeholder="0"
                  className="w-full bg-transparent border-none text-[40px] font-medium text-zinc-900 dark:text-white outline-none p-0 text-center leading-none tracking-tight placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                  autoFocus
                />

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-[#222] rounded-full mt-3">
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=024" alt="USDC" className="w-3.5 h-3.5 object-contain" />
                  <span className="text-[12px] font-semibold text-zinc-900 dark:text-white">USDC</span>
                </div>

                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-2">
                  Balance: 0.00
                </span>
              </div>

              {/* Destination Details */}
              {activeAction === "withdraw" && (
                <div className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#1A1A1A] rounded-xl flex justify-between items-center mb-3">
                  <span className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">To</span>
                  <span className="text-[12px] font-medium text-zinc-900 dark:text-white">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</span>
                </div>
              )}

              {transferStatus && (
                <div className="w-full px-3 py-2.5 bg-zinc-900 dark:bg-white rounded-xl flex justify-center items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900 animate-pulse shrink-0" />
                  <span className="text-[12px] font-semibold text-white dark:text-zinc-900">{transferStatus}</span>
                </div>
              )}

              {/* Minimalist Action Button */}
              <button
                onClick={activeAction === "deposit" ? handleDeposit : handleWithdraw}
                disabled={activeAction === "deposit" ? (!depositAmount || !wallet?.address) : (!withdrawAmount || !wallet?.id || !address)}
                className={`w-full h-[44px] rounded-full font-semibold text-[14px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${activeAction === "deposit" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"}`}
              >
                {activeAction === "deposit" ? "Confirm" : "Confirm"}
              </button>

            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </DashboardLayout>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-black">
        <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
