import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TokenUSDC from '@web3icons/react/icons/tokens/TokenUSDC';
import { Zap } from "lucide-react";

interface CreditsViewProps {
  credits: number;
  wallet: any;
  uniqueBalancesArray: any[];
  inferSymbol: (b: any) => string;
  topUpLoading: boolean;
  setTopUpLoading: (loading: boolean) => void;
  setCredits: (credits: number) => void;
  fetchBalance: (walletId?: string) => void;
  setAuthError: (error: string | null) => void;
}

export function CreditsView({
  credits,
  wallet,
  uniqueBalancesArray,
  inferSymbol,
  topUpLoading,
  setTopUpLoading,
  setCredits,
  fetchBalance,
  setAuthError
}: CreditsViewProps) {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto p-2 sm:p-4 flex-1 min-h-0 gap-4">
      {/* Header Section */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            Billing & Credits
          </h2>
          <Badge className="bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF]/20 border-0 shadow-none font-bold px-2 py-0.5 text-[10px] translate-y-[1px]">
            Pro Plan
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
          Manage your available credits and purchase more using USDC seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Column: Balance & Wallet info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {/* Available Credits Premium Card */}
          <Card className="flex flex-col relative overflow-hidden h-full border-zinc-200/50 dark:border-zinc-800/50 shadow-md shadow-zinc-200/20 dark:shadow-none bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 group">
            {/* Premium Subtle Glow / Watermark */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-[#0066FF]/5 dark:bg-[#0066FF]/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-[#0066FF]/10 dark:group-hover:bg-[#0066FF]/20"></div>
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none rotate-12 transition-transform duration-700 group-hover:scale-110">
              <TokenUSDC className="w-56 h-56 text-[#0066FF]" variant="mono" />
            </div>

            <CardHeader className="pb-2 pt-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066FF]/10 to-[#0066FF]/5 text-[#0066FF] flex items-center justify-center mb-2 border border-[#0066FF]/20 backdrop-blur-sm shadow-inner shadow-white/20">
                <Zap className="w-5 h-5 fill-[#0066FF]/20" />
              </div>
              <CardTitle className="text-zinc-500 dark:text-zinc-400 font-medium text-[11px] tracking-wider uppercase">Available Credits</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col pt-1 pb-4 relative z-10">
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-5xl font-black tracking-tighter text-zinc-950 dark:text-zinc-50 bg-clip-text">
                  {credits % 1 === 0 ? credits.toLocaleString() : credits.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Credits</span>
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 -mx-6 px-6 -mb-4 pb-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Connected Wallet</span>
                   <span className="text-[11px] font-semibold font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-200/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded-md">
                     {wallet?.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "None"}
                   </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                   <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">USDC Balance</span>
                   <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
                     <TokenUSDC className="w-3.5 h-3.5" variant="branded" />
                     {uniqueBalancesArray?.filter(b => inferSymbol(b) === 'USDC').reduce((sum, b) => sum + Number(b.amount || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                   </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Packages */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Top up Credits</h3>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Select a package to instantly recharge your account.</p>
            </div>
            {topUpLoading && (
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                <div className="w-3.5 h-3.5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Processing</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "5", usdc: 5, credits: 15, title: "Starter Pack", desc: "Perfect for occasional tasks and testing.", popular: false },
              { id: "10", usdc: 10, credits: 25, title: "Pro Pack", desc: "Best value for frequent, high-volume usage.", popular: true },
            ].map((pkg) => (
              <Card key={pkg.id} className={`flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${pkg.popular ? 'border-[#0066FF] ring-1 ring-[#0066FF] shadow-md shadow-[#0066FF]/10 dark:shadow-[#0066FF]/5 bg-gradient-to-b from-white to-[#0066FF]/[0.02] dark:from-zinc-950 dark:to-[#0066FF]/10' : 'hover:shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#0066FF] to-blue-500 text-white text-[9px] font-black tracking-wider uppercase px-3 py-1 rounded-bl-xl shadow-sm">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-center gap-2 mb-1">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pkg.popular ? 'bg-[#0066FF]/10 text-[#0066FF]' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                       <TokenUSDC className="w-5 h-5" variant="branded" />
                     </div>
                     <CardTitle className={`text-lg font-bold ${pkg.popular ? 'text-[#0066FF] dark:text-blue-400' : ''}`}>{pkg.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">{pkg.desc}</CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-4xl font-extrabold tracking-tighter text-zinc-950 dark:text-zinc-50">{pkg.usdc}</span>
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">USDC</span>
                  </div>

                  <div className={`flex items-center gap-2 p-3 rounded-xl border ${pkg.popular ? 'bg-[#0066FF]/5 border-[#0066FF]/20 dark:bg-[#0066FF]/10 dark:border-[#0066FF]/30' : 'bg-zinc-50 border-zinc-200/60 dark:bg-zinc-900/50 dark:border-zinc-800/60'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${pkg.popular ? 'bg-[#0066FF]/20 text-[#0066FF]' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[13px] font-bold leading-none mb-0.5 ${pkg.popular ? 'text-[#0066FF] dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-50'}`}>+{pkg.credits} Credits</span>
                      <span className="text-[10px] font-medium leading-none text-zinc-500 dark:text-zinc-400">Instantly added</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="mt-auto pt-0 pb-4 px-6 border-t-0 bg-transparent">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={pkg.popular ? "default" : "outline"}
                      className={`w-full h-10 text-[13px] font-bold rounded-xl transition-all ${pkg.popular && credits <= 0 ? 'bg-[#0066FF] hover:bg-blue-600 text-white shadow-sm hover:shadow-md hover:shadow-[#0066FF]/20' : ''}`}
                      disabled={topUpLoading || credits > 0}
                      onClick={async () => {
                        if (credits > 0) {
                          setAuthError("You must finish your current credits before purchasing more.");
                          setTimeout(() => setAuthError(null), 6000);
                          return;
                        }
                        if (!wallet?.address || !wallet?.id) return;
                        setTopUpLoading(true);
                        try {
                          const res = await fetch("/api/credits", {
                            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
                              action: "topup", walletAddress: wallet.address, walletId: wallet.id, packageId: pkg.id, blockchain: wallet.blockchain || "ARC-TESTNET",
                            }),
                          });
                          const data = await res.json();
                          if (data.success) { setCredits(data.balance); setTimeout(() => fetchBalance(wallet.id), 2000); }
                          else { setAuthError(data.error || "Purchase failed."); setTimeout(() => setAuthError(null), 6000); }
                        } catch (err) { setAuthError("Purchase failed."); setTimeout(() => setAuthError(null), 6000); }
                        finally { setTopUpLoading(false); }
                      }}
                    >
                      Purchase Package
                    </Button>
                    {credits > 0 && (
                      <span className="text-[10px] text-center font-medium text-zinc-400 dark:text-zinc-500">
                        Available when balance reaches 0
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
