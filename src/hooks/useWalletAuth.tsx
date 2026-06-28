import React, { useState, useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useSearchParams } from "next/navigation";

export function useWalletAuth(onAuthenticated?: (address: string) => void) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const searchParams = useSearchParams();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authAttemptedRef = useRef<string | null>(null);
  const fetchedAddressRef = useRef<string | null>(null);

  const [twitterHandle, setTwitterHandle] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // New Wallet & Credits State
  const [wallet, setWallet] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
    
  // Helper to Render Toast
  const renderErrorToast = () => {
    if (!authError) return null;
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 backdrop-blur-md">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[14px] font-medium leading-snug">{authError}</span>
        </div>
      </div>
    );
  };

  const fetchWalletsAndCredits = async (userAddress: string) => {
    try {
      let fetchedActiveWallet = null;
      // 1. Check LocalStorage Cache First
      const cacheKey = `liqdx_wallets_${userAddress.toLowerCase()}`;
      const cachedWallets = localStorage.getItem(cacheKey);
      if (cachedWallets) {
        try {
          const parsedWallets = JSON.parse(cachedWallets);
          if (parsedWallets && parsedWallets.length > 0) {
            setWallets(parsedWallets);
            const active = parsedWallets.find((w: any) => w.blockchain === "ARC-TESTNET") || parsedWallets[0];
            setWallet(active);
            fetchedActiveWallet = active;
          }
        } catch (e) {
          console.error("Failed to parse cached wallets", e);
        }
      }

      // 2. Fetch Wallets (Background/Fallback)
      const wRes = await fetch(`/api/wallets/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userAddress })
      });
      if (wRes.ok && wRes.headers.get("content-type")?.includes("application/json")) {
        const wData = await wRes.json();
        if (wData.wallets) {
          localStorage.setItem(cacheKey, JSON.stringify(wData.wallets));
          setWallets(wData.wallets);
          fetchedActiveWallet = wData.wallets.find((w: any) => w.blockchain === "ARC-TESTNET") || wData.wallets[0];
          setWallet(fetchedActiveWallet);
        }
      }
      
      // Credits functionality removed
    } catch (err) {
      console.error("Failed to fetch wallets/credits:", err);
    }
  };

  // Handle OAuth callback URL parameters
  useEffect(() => {
    const claimSuccess = searchParams.get("claimSuccess");
    const handle = searchParams.get("handle");
    const authErr = searchParams.get("authError");

    if (claimSuccess === "true" && handle) {
      setTwitterHandle(handle);
      window.history.replaceState({}, "", "/");
    }

    if (authErr) {
      const errorMessages: Record<string, string> = {
        missing_params: "Missing wallet address. Please connect your wallet first.",
        server_config: "Server configuration error. Please contact support.",
        missing_code: "Twitter did not return an authorization code.",
        expired_session: "Your login session expired. Please try again.",
        csrf_mismatch: "Security validation failed. Please try again.",
        token_exchange_failed: "Failed to complete authentication with Twitter.",
        profile_fetch_failed: "Failed to fetch your Twitter profile.",
        no_username: "Could not retrieve your Twitter username.",
        db_error: "Failed to save your profile. Please try again.",
        internal_error: "An unexpected error occurred. Please try again.",
        access_denied: "You denied the Twitter authorization request.",
      };
      setAuthError(errorMessages[authErr] || `Authentication error: ${authErr}`);
      setTimeout(() => setAuthError(null), 8000);
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  // SECURITY: Wallet signature authentication (SIWE-lite)
  useEffect(() => {
    if (isConnected && address && authAttemptedRef.current !== address) {
      authAttemptedRef.current = address;
      const authenticateWallet = async () => {
        setIsAuthenticating(true);
        try {
          const checkRes = await fetch(`/api/auth/verify`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.authenticated && checkData.address?.toLowerCase() === address.toLowerCase()) {
              setIsAuthenticated(true);
              setIsAuthenticating(false);
              fetchedAddressRef.current = address;
              fetchWalletsAndCredits(address);
              if (onAuthenticated) onAuthenticated(address);
              return;
            }
          }

          const nonceRes = await fetch("/api/auth/nonce");
          const { nonce } = await nonceRes.json();
          if (!nonce) throw new Error("Failed to generate secure nonce");

          const domain = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").host;
          const uri = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to Liqdx\n\nURI: ${uri}\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;
          const signature = await signMessageAsync({ message });

          const verifyRes = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, message, signature }),
          });

          if (!verifyRes.ok) {
            const errData = await verifyRes.json();
            throw new Error(errData.error || "Authentication failed");
          }

          setIsAuthenticated(true);
          fetchedAddressRef.current = address;
          fetchWalletsAndCredits(address);
          if (onAuthenticated) onAuthenticated(address);
        } catch (err: any) {
          console.error("Wallet authentication failed:", err);
          setAuthError(err.message || "Wallet signature required to use Liqdx.");
          setIsAuthenticated(false);
          authAttemptedRef.current = null;
        } finally {
          setIsAuthenticating(false);
        }
      };
      authenticateWallet();
    } else if (!isConnected) {
      setIsAuthenticated(false);
      fetchedAddressRef.current = null;
      authAttemptedRef.current = null;
      setWallet(null);
      setWallets([]);
    }
  }, [isConnected, address, signMessageAsync, onAuthenticated]);

  // Fetch authenticated session from JWT cookie (with Supabase fallback)
  useEffect(() => {
    if (!address) {
      setTwitterHandle(null);
      return;
    }
    const checkAuthSession = async () => {
      try {
        const res = await fetch(`/api/auth/me?address=${encodeURIComponent(address)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user?.twitterHandle) {
            setTwitterHandle(data.user.twitterHandle);
          } else {
            setTwitterHandle(null);
          }
        } else {
          setTwitterHandle(null);
        }
      } catch (e) {
        setTwitterHandle(null);
      }
    };
    checkAuthSession();
  }, [address]);

  return {
    address,
    isConnected,
    isAuthenticated,
    isAuthenticating,
    twitterHandle,
    authError,
    setAuthError,
    wallet,
    wallets,
    
    renderErrorToast
  };
}
