"use client";

import React, { useState } from "react";
import { ExternalLink, Clock, TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp } from "lucide-react";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  thumbnail: string;
}

interface PulseItem {
  symbol: string;
  price: number;
  change24h: number;
  image?: string;
}

export function NewsWidget({ data }: { data: string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  let articles: NewsItem[] = [];
  let aiTake = "";
  let pulse: PulseItem[] = [];

  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      articles = parsed;
    } else {
      aiTake = parsed.aiTake || parsed.summary || "";
      articles = parsed.articles || [];
      pulse = parsed.pulse || [];
    }
  } catch (e) {
    console.error("Failed to parse news data", e);
    return null;
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-[20px] text-sm text-zinc-500">
        No recent news found.
      </div>
    );
  }

  const getSourceColor = (source: string) => {
    switch(source.toLowerCase()) {
      case "coindesk": return "text-[#00C09B]";
      case "cointelegraph": return "text-[#FABF2C]";
      case "decrypt": return "text-[#FF007F]";
      default: return "text-[#0066FF]";
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="w-full flex flex-col gap-0 bg-white/60 dark:bg-[#0a0a0c]/60 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(255,255,255,0.01)] mt-1 max-w-[500px]">
      
      {/* 1. Crypto Pulse Header */}
      {pulse && pulse.length > 0 && (
        <div className="flex flex-col border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0066FF] dark:text-[#00A3FF]" />
            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest font-sans">Crypto Pulse</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            {pulse.map((p, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  {p.image && <img src={p.image} alt={p.symbol} className="w-4 h-4 rounded-full" />}
                  <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">{p.symbol}</span>
                </div>
                <span className="text-[13px] font-bold font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">
                  ${p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <div className={`flex items-center gap-0.5 mt-0.5 ${p.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {p.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="text-[11px] font-bold font-mono">{Math.abs(p.change24h).toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. AI Take Blockquote */}
      {aiTake && (
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-gradient-to-br from-[#0066FF]/5 to-transparent dark:from-[#00A3FF]/5">
          <span className="text-[10px] font-bold text-[#0066FF] dark:text-[#00A3FF] uppercase tracking-widest font-sans mb-1.5 block">AI Take</span>
          <p className="text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-serif italic border-l-2 border-[#0066FF]/30 dark:border-[#00A3FF]/30 pl-3">
            &quot;{aiTake}&quot;
          </p>
        </div>
      )}

      {/* 3. Top Stories (Expandable Numbered List) */}
      <div className="flex flex-col w-full bg-white dark:bg-transparent">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-sans">Top Stories</span>
        </div>
        
        <div className="flex flex-col">
          {articles.map((item, idx) => {
            const isExpanded = expandedId === idx;
            return (
              <div key={idx} className={`flex flex-col border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors ${isExpanded ? 'bg-zinc-50 dark:bg-zinc-900/50' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'}`}>
                
                {/* Compact Row (Always visible) */}
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : idx)}
                  className="w-full flex items-start text-left px-4 py-3 gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{idx + 1}</span>
                  </div>
                  <h4 className={`font-medium text-[13px] leading-[1.4] flex-1 ${isExpanded ? 'text-[#0066FF] dark:text-[#63B3FF] font-bold' : 'text-zinc-800 dark:text-zinc-200 line-clamp-2'}`}>
                    {item.title}
                  </h4>
                  <div className="shrink-0 mt-0.5 text-zinc-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded State */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100 mb-3' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-4 pl-[44px] flex flex-col gap-3">
                    
                    {item.thumbnail && (
                      <div className="w-full h-[120px] rounded-[12px] overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
                        <img 
                          src={item.thumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {/* Source Badge overlay */}
                        <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-black/5 dark:border-white/10 shadow-sm">
                          <span className={`text-[9px] font-bold tracking-wider uppercase ${getSourceColor(item.source)}`}>
                            {item.source}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">{timeAgo(item.pubDate)}</span>
                      </div>
                      
                      <a 
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#0066FF] dark:text-[#63B3FF] hover:underline bg-[#0066FF]/10 dark:bg-[#00A3FF]/10 px-2.5 py-1 rounded-full transition-colors hover:bg-[#0066FF]/20 dark:hover:bg-[#00A3FF]/20"
                      >
                        Read Full
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
