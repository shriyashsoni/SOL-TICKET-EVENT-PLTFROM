'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SolanaNetwork = 'testnet' | 'mainnet';

type PhantomProvider = {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey?: { toString(): string };
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

interface WalletContextType {
  connected: boolean;
  isConnected: boolean;
  publicKey: string | null;
  network: SolanaNetwork;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (network: SolanaNetwork) => void;
  balance: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<SolanaNetwork>('testnet');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async (wallet: string, selectedNetwork: SolanaNetwork) => {
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'balance',
        publicKey: wallet,
        network: selectedNetwork,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? 'Failed to fetch wallet balance');
    }

    setBalance(Number(payload.balance) || 0);
  };

  const connectWallet = async () => {
    if (!window.solana?.isPhantom) {
      throw new Error('Phantom wallet is not installed');
    }

    setLoading(true);
    try {
      const result = await window.solana.connect();
      const wallet = result.publicKey.toString();
      setPublicKey(wallet);
      setConnected(true);
      const existingName = localStorage.getItem('blink_user_name');
      if (!existingName) {
        const enteredName = window.prompt('Enter your name for event posting and profile:')?.trim();
        if (enteredName) {
          localStorage.setItem('blink_user_name', enteredName);
        }
      }
      await fetchBalance(wallet, network);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    window.solana?.disconnect().catch(() => undefined);
    setConnected(false);
    setPublicKey(null);
    setBalance(0);
  };

  const switchNetwork = (newNetwork: SolanaNetwork) => {
    setNetwork(newNetwork);
    if (!publicKey) {
      setBalance(0);
      return;
    }

    fetchBalance(publicKey, newNetwork).catch(() => {
      setBalance(0);
    });
  };

  const refreshBalance = async () => {
    if (!publicKey) return;
    await fetchBalance(publicKey, network);
  };

  useEffect(() => {
    if (!window.solana?.isPhantom || !window.solana.isConnected || !window.solana.publicKey) {
      return;
    }

    const wallet = window.solana.publicKey.toString();
    setPublicKey(wallet);
    setConnected(true);
    fetchBalance(wallet, network).catch(() => {
      setBalance(0);
    });
  }, [network]);

  const value = useMemo(
    () => ({
      connected,
      isConnected: connected,
      publicKey,
      network,
      connectWallet,
      disconnectWallet,
      switchNetwork,
      balance,
      loading,
      refreshBalance,
    }),
    [connected, publicKey, network, balance, loading]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
