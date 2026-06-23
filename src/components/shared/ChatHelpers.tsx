import React, { useState, useEffect } from 'react';

export const FormattedMessage = ({ content }: { content: string }) => {
  // SECURITY: Escape HTML entities FIRST to prevent XSS injection
  // (AI responses can echo user input which may contain malicious HTML)
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Replace **bold** with <strong>bold</strong>
  let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Replace single * or - bullets at the start of a line with actual bullet points
  formatted = formatted.replace(/(?:^|\n)(?:\*|-)\s+(.*)/g, '<br />• $1');

  // Replace remaining newlines with <br />
  formatted = formatted.replace(/\n/g, '<br />');

  // Clean up double br from bullet conversion
  formatted = formatted.replace(/<br \/>(?:<br \/>)+•/g, '<br />•');
  if (formatted.startsWith('<br />')) formatted = formatted.substring(6);

  return <div dangerouslySetInnerHTML={{ __html: formatted }} className="whitespace-pre-wrap font-sans" />;
};

// Determine which specialized agent should handle based on user text
export const getAgentFromText = (text: string): { name: string; logo: string; type: 'flux' | 'atlas' | 'oracle' | 'omni' } => {
  const lower = text.toLowerCase();
  if (lower.includes("bridge") || lower.includes("swap") || lower.includes("send") || lower.includes("transfer")) {
    return { name: "Flux", logo: "/flux.png", type: "flux" };
  }
  if (lower.includes("yield") || lower.includes("aave") || lower.includes("morpho") || lower.includes("supply") || lower.includes("deposit") || lower.includes("withdraw") || lower.includes("stake")) {
    return { name: "Atlas", logo: "/Atlas.png", type: "atlas" };
  }
  if (lower.includes("price") || lower.includes("news") || lower.includes("market") || lower.includes("sentiment")) {
    return { name: "Oracle", logo: "/oracle.png", type: "oracle" };
  }
  return { name: "Liqdx AI", logo: "", type: "omni" };
};

export const PendingIndicator = ({ userText }: { userText: string }) => {
  const [step, setStep] = useState(0);
  const agent = getAgentFromText(userText);

  const lower = userText.toLowerCase();
  const isBridge = lower.includes("bridge");
  const isSwap = lower.includes("swap");
  const isSend = lower.includes("send") || lower.includes("transfer");
  const isYield = lower.includes("yield") || lower.includes("aave") || lower.includes("morpho") || lower.includes("supply") || lower.includes("deposit") || lower.includes("stake");
  const isWithdraw = lower.includes("withdraw");
  const isPrice = lower.includes("price") || lower.includes("market");
  const isNews = lower.includes("news") || lower.includes("sentiment");

  // Phase 1 is always "Parsing intent..." via Omni-Agent
  // Phase 2+ are specialized messages via the resolved agent
  let specializedMessages: string[] = [];
  if (isBridge) {
    specializedMessages = [
      "Fetching best cross-chain route...",
      "Securing optimal bridge price...",
      "Approving USDC transfer...",
      "Executing cross-chain transaction...",
      "Waiting for CCTP finalization (~1-2 mins)..."
    ];
  } else if (isSwap) {
    specializedMessages = [
      "Fetching best swap quotes...",
      "Optimizing slippage & routing...",
      "Executing swap transaction...",
      "Confirming final balances..."
    ];
  } else if (isSend) {
    specializedMessages = [
      "Resolving recipient address...",
      "Preparing transfer...",
      "Executing transfer..."
    ];
  } else if (isWithdraw) {
    specializedMessages = [
      "Fetching active yield positions...",
      "Calculating withdrawal amount...",
      "Executing withdrawal..."
    ];
  } else if (isYield) {
    specializedMessages = [
      "Analyzing yield opportunities...",
      "Selecting optimal vault...",
      "Executing supply transaction...",
      "Confirming deposit..."
    ];
  } else if (isPrice) {
    specializedMessages = [
      "Fetching live market data...",
      "Aggregating price feeds..."
    ];
  } else if (isNews) {
    specializedMessages = [
      "Scanning crypto news sources...",
      "Analyzing market sentiment..."
    ];
  } else {
    specializedMessages = [
      "Processing your request...",
      "Generating response..."
    ];
  }

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + 1, specializedMessages.length); // max = specializedMessages.length (0 = parsing, 1..N = specialized)
      setStep(current);
    }, 2000);

    return () => clearInterval(interval);
  }, [userText]);

  const isParsing = step === 0;
  const currentText = isParsing ? "Parsing intent..." : specializedMessages[step - 1];
  const currentAgentName = isParsing ? "Omni-Agent" : agent.name;

  return (
    <div className="flex flex-col gap-1">
      {/* Agent name label */}
      <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase ml-1">
        via {currentAgentName}
      </span>
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#f0f7ff] dark:bg-[#0066ff]/10 w-fit shadow-[0_4px_14px_rgba(0,102,255,0.1)]">
        <span className="text-[13.5px] font-semibold text-[#0066ff] dark:text-[#63B3FF] tracking-wide">
          {currentText}
        </span>

        {/* Show all 3 agent logos ONLY during Omni-Agent parsing phase */}
        {isParsing && (
          <div className="flex items-center -space-x-2 shrink-0 ml-1">
            <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 border-2 border-[#f0f7ff] dark:border-[#0a101d] shadow-sm flex items-center justify-center p-[4px] z-30 animate-float-wave">
              <img src="/flux.png" alt="Flux" className="w-full h-full object-contain" />
            </div>
            <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 border-2 border-[#f0f7ff] dark:border-[#0a101d] shadow-sm flex items-center justify-center p-[4px] z-20 animate-float-wave animate-delay-150">
              <img src="/Atlas.png" alt="Atlas" className="w-full h-full object-contain" />
            </div>
            <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 border-2 border-[#f0f7ff] dark:border-[#0a101d] shadow-sm flex items-center justify-center p-[4px] z-10 animate-float-wave animate-delay-300">
              <img src="/oracle.png" alt="Oracle" className="w-full h-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
