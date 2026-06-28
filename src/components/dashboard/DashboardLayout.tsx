import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: "terminal" | "intelligence" | "history";
  setActiveTab: (tab: "terminal" | "intelligence" | "history") => void;
  renderErrorToast: () => React.ReactNode;
  twitterHandle: string | null;
  theme: string;
  toggleTheme: () => void;
  address?: string;
  circleWalletId?: string;
}

export function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  renderErrorToast,
  twitterHandle,
  theme,
  toggleTheme,
  address,
  circleWalletId
}: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#F6F8FA] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans antialiased overflow-hidden relative transition-colors">
      {/* Global Glow Background for Chat View */}
      {activeTab === "intelligence" && (
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-gradient-to-bl from-[#0066FF]/20 dark:from-[#00A3FF]/15 to-transparent rounded-full blur-[140px] pointer-events-none -translate-y-1/4 translate-x-1/4 z-0"></div>
      )}

      {/* Auth Error Toast */}
      {renderErrorToast()}

      {/* Top Navigation Bar */}
      <header className="flex flex-col px-4 sm:px-8 shrink-0 bg-white dark:bg-[#09090b] z-50 pt-2 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto pb-2">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/light-lidx.png" alt="LIQDX" className="h-8 w-auto object-contain dark:hidden scale-[1.3] origin-left" />
            <img src="/liqx.png" alt="LIQDX" className="h-8 w-auto object-contain hidden dark:block scale-[1.3] origin-left" />
          </div>

          <nav className="hidden lg:flex items-center gap-1 flex-1 mx-8">
            {[
              { id: "terminal", label: "Dashboard" },
              { id: "intelligence", label: "Agent" },
              { id: "history", label: "Activity" }
            ].map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-4 h-10 flex items-center justify-center rounded-[8px] text-[13px] font-medium transition-all duration-200 cursor-pointer ${isActive
                    ? "bg-blue-50 dark:bg-[#1E293B] text-blue-600 dark:text-[#3B82F6]"
                    : "bg-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Twitter Block */}
            {twitterHandle ? (
              <div className="flex items-center px-2 sm:px-3 ml-2 sm:ml-0 cursor-default">
                <span className="text-[14px] sm:text-[15px] font-bold text-[#0061F0] dark:text-[#3B82F6] hover:opacity-80 transition-opacity tracking-wide">
                  @{twitterHandle}
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (address && circleWalletId) {
                    window.location.href = `/api/auth/twitter/login?address=${address}&walletId=${circleWalletId}`;
                  } else if (address) {
                    window.location.href = `/api/auth/twitter/login?address=${address}&walletId=pending`;
                  }
                }}
                className="flex items-center gap-1.5 px-4 h-10 bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/10 rounded-[8px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <span className="text-[14px] font-medium hidden sm:block">Connect X</span>
              </button>
            )}

            {/* Theme Toggle Square Block */}
            <button
              className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/10 rounded-[8px] hover:bg-zinc-50 dark:hover:bg-[#252525] transition-all text-zinc-600 dark:text-zinc-400 cursor-pointer"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>

            {/* Wallet Block */}
            <ConnectButton.Custom>
              {({ account, openConnectModal, openAccountModal, mounted }) => {
                const ready = mounted;
                return (
                  <button
                    onClick={address ? openAccountModal : openConnectModal}
                    className={`flex items-center gap-2.5 px-3 h-10 bg-[#0088f0] hover:bg-[#007add] border border-transparent rounded-[8px] transition-all shadow-sm ${!ready ? 'opacity-0' : 'opacity-100'}`}
                  >
                    {address ? (
                      <>
                        <div className="w-[22px] h-[22px] rounded-[6px] overflow-hidden bg-white/20 border border-white/20 flex items-center justify-center">
                          {account?.ensAvatar ? (
                            <img src={account.ensAvatar} alt="ENS Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${address}`} alt="Avatar" className="w-full h-full object-cover scale-125" />
                          )}
                        </div>
                        <span className="text-[13px] sm:text-[14px] font-bold text-white tracking-wide pr-1 whitespace-nowrap">
                          {account?.displayName || `${address.slice(0, 6)}...${address.slice(-4)}`}
                        </span>
                      </>
                    ) : (
                      <span className="text-[14px] font-bold px-2 text-white">Connect Wallet</span>
                    )}
                  </button>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <nav className="flex lg:hidden items-center gap-2 w-full overflow-x-auto no-scrollbar pb-2 pt-1 max-w-7xl mx-auto">
          {[
            { id: "terminal", label: "Dashboard" },
            { id: "intelligence", label: "Agent" },
            { id: "history", label: "Activity" }
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-4 h-9 shrink-0 flex items-center justify-center rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer border ${isActive
                  ? "bg-blue-50 dark:bg-[#1E293B] text-blue-600 dark:text-[#3B82F6] border-transparent"
                  : "bg-transparent text-slate-500 dark:text-[#94A3B8] border-zinc-200 dark:border-white/10"
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 custom-scrollbar w-full mx-auto max-w-[1600px] ${activeTab === 'history'
        ? 'overflow-hidden flex flex-col bg-white dark:bg-[#09090b] pt-6 pb-0 px-4 sm:px-8'
        : activeTab === 'intelligence'
          ? 'overflow-hidden flex flex-col py-0 px-0'
          : activeTab === 'terminal'
            ? 'overflow-y-auto flex flex-col py-0 px-0'
            : 'overflow-y-auto py-6 px-4 sm:px-8'
        }`}>
        {children}
      </main>
    </div>
  );
}
