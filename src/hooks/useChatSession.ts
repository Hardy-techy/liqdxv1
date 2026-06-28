import { useState, useRef } from 'react';
import { ChatMessage } from '@/types/dashboard';

export function useChatSession({
  address,
  wallet,
  setActiveTab,
  fetchBalance,
  fetchTxHistory,
  setAuthError,}: {
  address?: string;
  wallet?: any;
  setActiveTab?: (tab: "terminal" | "intelligence" | "history") => void;
  fetchBalance?: (walletId: string) => void;
  fetchTxHistory?: (address: string) => void;
  setAuthError?: (error: string | null) => void;
}) {
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<number>(0);

  const fetchDailyUsage = async () => {
    if (!wallet?.address) return;
    try {
      const res = await fetch(`/api/usage?address=${wallet.address}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setDailyUsage(data.requestCount || 0);
      }
    } catch (e) {
      console.error("Failed to fetch daily usage", e);
    }
  };

  const hasAutoTitled = useRef(false);
  const msgDbIdMap = useRef<Record<string, string>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic (exposed if needed via a hook or ref, omitted here to keep pure state)

  const loadChatSessionsAndOpenRecent = async (walletAddr: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "listSessions", walletAddress: walletAddr }),
      });
      const data = await res.json();
      const sessions = data.sessions || [];
      setChatSessions(sessions);

      fetchDailyUsage();

      // Always start a new chat session on initial load/refresh per user request
      await startNewChat(walletAddr);
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    }
  };

  const fetchChatSessions = async (walletAddr: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "listSessions", walletAddress: walletAddr }),
      });
      const data = await res.json();
      setChatSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to fetch chat sessions:", e);
    }
  };

  const switchSession = async (sessionId: string) => {
    try {
      setIsLoadingSession(true);
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "loadSession", sessionId }),
      });
      const data = await res.json();
      setChatSessionId(sessionId);
      hasAutoTitled.current = true; // existing sessions are already titled
      if (data.messages && data.messages.length > 0) {
        const loaded: ChatMessage[] = data.messages.map((m: any) => {
          let parsedBalances;
          let parsedYields;
          const displayContent = m.content;
          
          if (m.intent === "balance" && m.content) {
            if (m.content.startsWith("{")) {
              // New JSON format
              try {
                const parsed = JSON.parse(m.content);
                parsedBalances = parsed.balances;
                parsedYields = parsed.yields;
              } catch(e) {}
            } else if (m.content.includes(" on ")) {
              // Old text format: "USDC on Optimism: 3.798474, EURC on ARC-TESTNET: 2.477"
              try {
                const formatChain = (c: string) => {
                  const cl = c.trim().toLowerCase();
                  if (cl === "arc-testnet" || cl === "arc testnet") return "Arc Testnet";
                  if (cl === "arb-sepolia" || cl === "arbitrum") return "Arbitrum";
                  if (cl === "op-sepolia" || cl === "optimism") return "Optimism";
                  if (cl === "base-sepolia" || cl === "base") return "Base";
                  if (cl === "eth-sepolia" || cl === "ethereum") return "Ethereum";
                  return c.trim();
                };
                // Strip any prefix like "Your multichain wallet balances: "
                const raw = m.content.replace(/^[^:]*balances:\s*/i, "");
                const parts = raw.split(",").map((s: string) => s.trim()).filter(Boolean);
                parsedBalances = [];
                parsedYields = [];
                for (const part of parts) {
                  const match = part.match(/^(\S+)\s+on\s+(.+?):\s*([\d.]+)$/i);
                  if (match) {
                    const [, symbol, chain, amount] = match;
                    const sym = symbol.trim();
                    const chainName = formatChain(chain);
                    // Detect Aave receipt tokens
                    if (/^a(arb|opt|base|eth)/i.test(sym) || /ausdc/i.test(sym)) {
                      parsedYields.push({ protocol: "Aave V3", asset: "USDC", amount, chain: chainName });
                    } else {
                      parsedBalances.push({ symbol: sym, amount, chain: chainName });
                    }
                  }
                }
                if (parsedBalances.length === 0) parsedBalances = undefined;
                if (parsedYields.length === 0) parsedYields = undefined;
              } catch(e) {}
            }
          }

          return {
            id: m.id,
            role: m.role,
            content: displayContent,
            status: m.status || undefined,
            txHash: m.tx_hash || undefined,
            txId: m.tx_id || undefined,
            intent: m.intent || undefined,
            tokenIn: m.token_in || undefined,
            tokenOut: m.token_out || undefined,
            balances: parsedBalances,
            yields: parsedYields,
            createdAt: m.created_at || undefined,
          };
        });
        setMessages(loaded);
      } else {
        setMessages([
          { id: "1", role: "ai", content: "Chat initialized. I can execute real on-chain transactions on Liqdx. Try asking me to 'Swap 0.1 USDC' or 'Bridge 0.1 USDC'." }
        ]);
      }
    } catch (e) {
      console.error("Failed to switch session:", e);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const startNewChat = async (walletAddr?: string) => {
    const addr = walletAddr || address;
    if (!addr) return;
    setChatSessionId(null);
    hasAutoTitled.current = false;
    setMessages([
      { id: "1", role: "ai", content: "Chat initialized. I can execute real on-chain transactions on Liqdx. Try asking me to 'Swap 0.1 USDC' or 'Bridge 0.1 USDC'." }
    ]);
  };

  const deleteSession = async (sessionIdToDelete: string) => {
    try {
      await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteSession", sessionId: sessionIdToDelete })
      });
      setChatSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
      if (chatSessionId === sessionIdToDelete) {
        startNewChat(address);
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  const autoTitleSession = async (sessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "");
    try {
      await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateSessionTitle", sessionId, title }),
      });
      setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    } catch (e) {
      console.error("Failed to auto-title session:", e);
    }
  };

  const saveMsgToDb = async (sessionId: string, walletAddr: string, msg: ChatMessage) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveMessage", sessionId, walletAddress: walletAddr, message: msg }),
      });
      const data = await res.json();
      if (data.id) {
        msgDbIdMap.current[msg.id] = data.id;
      }
    } catch (e) {
      console.error("Failed to save message:", e);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wallet?.id || isSubmitting) return;

    setIsSubmitting(true);
    const userText = chatInput.trim();
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: userText };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");

    let currentSessionId = chatSessionId;

    if (!currentSessionId && address) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "createSession", walletAddress: address }),
        });
        const data = await res.json();
        if (data.session) {
          currentSessionId = data.session.id;
          setChatSessionId(currentSessionId);
        }
      } catch (e) {
        console.error("Failed to create session dynamically:", e);
      }
    }

    if (currentSessionId && address) saveMsgToDb(currentSessionId, address, userMsg);

    if (currentSessionId && !hasAutoTitled.current) {
      hasAutoTitled.current = true;
      autoTitleSession(currentSessionId, userText);
    }

    const aiMsgId = (Date.now() + 1).toString();
    const pendingAiMsg: ChatMessage = {
      id: aiMsgId,
      role: "ai",
      content: "Analyzing intent and preparing execution...",
      status: "pending"
    };
    setMessages(prev => [...prev, pendingAiMsg]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 
          prompt: userText, 
          walletId: wallet.id, 
          walletAddress: wallet.address, 
          blockchain: wallet.blockchain,
          history: messages.map(m => ({ role: m.role, content: m.content })).slice(-5)
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg: ChatMessage = { ...pendingAiMsg, status: "error", content: data.error || data.message };
        setMessages(prev => prev.map(m => m.id === aiMsgId ? errMsg : m));
        if (currentSessionId && address) saveMsgToDb(currentSessionId, address, errMsg);
        if (data.limitReached) setDailyUsage(30);

        return;
      }

      const isInfoIntent = ["balance", "help", "conversation", "price", "news", "unknown", "morpho_vault", "yield_options"].includes(data.intent);
      const finalAiMsg: ChatMessage = {
        ...pendingAiMsg,
        content: data.message,
        txId: data.transactionId,
        txHash: data.txHash,
        intent: data.intent,
        tokenIn: data.tokenIn,
        tokenOut: data.tokenOut,
        balances: data.balances,
        yields: data.yields,
        amountIn: data.amountIn,
        amountOut: data.amountOut,
        amount: data.amount,
        rate: data.rate,
        fee: data.fee,
        status: data.txHash ? "success" : (isInfoIntent ? "success" : "pending")
      };
      setMessages(prev => prev.map(m => m.id === aiMsgId ? finalAiMsg : m));

      if (currentSessionId && address) saveMsgToDb(currentSessionId, address, finalAiMsg);
      if (address) fetchChatSessions(address);
      fetchDailyUsage();


      if (data.txHash) {
        setTimeout(() => {
          fetchBalance?.(wallet.id);
          if (address) fetchTxHistory?.(address);
        }, 2000);
      }

    } catch (err: any) {
      const errMsg: ChatMessage = { ...pendingAiMsg, status: "error", content: "Failed to connect to agent backend." };
      setMessages(prev => prev.map(m => m.id === aiMsgId ? errMsg : m));
      if (currentSessionId && address) saveMsgToDb(currentSessionId, address, errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isChatEmpty = messages.length === 1 && messages[0].id === "1";

  return {
    chatInput,
    setChatInput,
    messages,
    setMessages,
    isSubmitting,
    chatContainerRef,
    hasAutoTitled,
    chatSessions,
    chatSessionId,
    setChatSessionId,
    fetchChatSessions,
    startNewChat,
    switchSession,
    autoTitleSession,
    saveMsgToDb,
    deleteSession,
    handleChatSubmit,
    isChatEmpty,
    loadChatSessionsAndOpenRecent,
    isLoadingSession,
    dailyUsage,
  };
}
