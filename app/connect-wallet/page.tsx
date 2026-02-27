'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/app/wallet-context';
import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { ChevronRight, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function ConnectWalletPage() {
  const router = useRouter();
  const { connectWallet, loading } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const handlePhantomConnect = async () => {
    setError(null);
    try {
      await connectWallet();
      if (typeof window !== 'undefined') {
        const existingName = localStorage.getItem('blink_user_name');
        if (!existingName) {
          const enteredName = window.prompt('Enter your name for event posting and profile:')?.trim();
          if (enteredName) {
            localStorage.setItem('blink_user_name', enteredName);
          }
        }
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Connection failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  };

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Connect Your Wallet
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose your preferred way to connect to BlinkTicket
              </p>
            </div>

            {/* Network Selection */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <p className="text-sm font-semibold text-foreground mb-4">Current Network</p>
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-lg bg-background border-2 border-accent">
                  <p className="font-medium text-foreground">Testnet</p>
                  <p className="text-sm text-muted-foreground">Only network enabled</p>
                </div>
              </div>
            </div>

            {/* Phantom Wallet */}
            <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Phantom Wallet</h3>
                    <p className="text-muted-foreground">The most secure way to connect</p>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-4 mb-6">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-accent" />
                      <span className="text-foreground">Industry-leading security</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-accent" />
                      <span className="text-foreground">Non-custodial wallet</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-accent" />
                      <span className="text-foreground">Support for Testnet</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handlePhantomConnect}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accent to-primary text-accent-foreground font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Connecting...' : 'Connect with Phantom'}
                  {!loading && <ChevronRight className="w-5 h-5" />}
                </button>

                {error && (
                  <p className="text-sm text-destructive text-center mt-3">{error}</p>
                )}

                <p className="text-sm text-muted-foreground text-center mt-4">
                  Don't have Phantom? Download it from phantomapp.io
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-background border border-accent border-opacity-30 rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">Why connect your wallet?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Buy and sell NFT tickets securely</li>
                <li>• Manage your digital ticket collection</li>
                <li>• Transfer tickets to other Solana addresses</li>
                <li>• Track your transaction history</li>
              </ul>
              <Link
                href="/whitepaper"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:border-accent transition"
              >
                Read Whitepaper
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
