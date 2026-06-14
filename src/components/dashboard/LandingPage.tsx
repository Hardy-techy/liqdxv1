import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface LandingPageProps {
  authError?: string | null;
  setAuthError: (error: string | null) => void;
}

export function LandingPage({ authError, setAuthError }: LandingPageProps) {
  return (
    <div className="min-h-screen flex bg-[#F8F9FA] font-sans antialiased selection:bg-blue-100">
      {authError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-[slideDown_0.3s_ease-out]">
          <div className="bg-red-500/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">{authError}</span>
            <button onClick={() => setAuthError(null)} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: Brand & Tagline */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-20 relative overflow-hidden bg-white border-r border-zinc-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        {/* Light Mode Gradients for left side */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-multiply pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full mix-blend-multiply pointer-events-none"></div>

        {/* Top: Logo */}
        <div className="relative z-10">
          <img src="/light-lidx.png" alt="Liqdx" className="h-10 w-auto object-contain" />
        </div>

        {/* Middle: Tagline */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl xl:text-7xl font-bold tracking-tighter text-zinc-900 leading-[1.05] mb-6">
            The intelligence behind your liquidity.
          </h1>
          <p className="text-xl text-zinc-500 font-medium max-w-lg leading-relaxed">
            Build an autonomous liquidity wallet and orchestrate cross-chain operations with absolute precision.
          </p>
        </div>

        {/* Bottom: Spacer to keep tagline centered */}
        <div className="relative z-10"></div>
      </div>

      {/* RIGHT COLUMN: Connect Wallet */}
      <div className="flex-[1.2] flex flex-col items-center justify-center p-6 relative">
        {/* Mobile Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none flex justify-center overflow-hidden lg:hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 blur-[120px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo & Tagline (hidden on desktop) */}
          <div className="lg:hidden flex flex-col items-center mb-12">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 mb-8">
              <img src="/light-lidx.png" alt="Liqdx" className="h-8 w-auto object-contain" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 text-center mb-4 leading-tight">
              The intelligence behind your liquidity.
            </h1>
            <p className="text-zinc-500 text-center font-medium px-4">
              Build an autonomous wallet and orchestrate cross-chain operations.
            </p>
          </div>

          {/* Connect Card */}
          <div className="bg-white p-10 sm:p-12 rounded-[32px] border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center w-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-8 border border-blue-100/50 shadow-inner relative z-10">
              <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 3v18m9-9H3m14.121-6.364L6.879 17.121M17.121 17.121L6.879 6.879"></path>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 mb-3 relative z-10">Get Started</h2>
            <p className="text-zinc-500 text-sm text-center mb-10 font-medium relative z-10 px-4">
              Connect your wallet to access your autonomous wallet and start managing assets.
            </p>

            <div className="w-full relative z-10">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="w-full flex items-center justify-center py-4 px-8 rounded-2xl bg-[#0066FF] hover:bg-[#0055FF] text-white font-bold text-[15px] transition-all duration-200 shadow-[0_8px_20px_-6px_rgba(0,102,255,0.4)] hover:shadow-[0_12px_24px_-6px_rgba(0,102,255,0.5)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
