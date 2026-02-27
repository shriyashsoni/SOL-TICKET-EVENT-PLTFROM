'use client';

import { Moon, Sun, Wallet, Menu, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/app/providers';
import { useWallet } from '@/app/wallet-context';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { connected, publicKey, disconnectWallet } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!connected) return;
    if (pathname === '/connect-wallet') {
      router.replace('/dashboard');
    }
  }, [connected, pathname, router]);

  const truncateAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/blinkticket_logo.svg"
              alt="BlinkTicket"
              width={180}
              height={60}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-accent transition">
              Home
            </Link>
            <Link href="/events" className="text-foreground hover:text-accent transition">
              Events
            </Link>
            <Link href="/whitepaper" className="text-foreground hover:text-accent transition">
              Whitepaper
            </Link>
            <Link href="/about" className="text-foreground hover:text-accent transition">
              About
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-lg transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-foreground" />
              )}
            </button>

            {/* Wallet Button */}
            <div className="hidden sm:block">
              {connected && publicKey ? (
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                >
                  <Wallet className="w-4 h-4" />
                  {truncateAddress(publicKey)}
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/connect-wallet"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3">
            <Link
              href="/"
              className="text-foreground hover:text-accent transition py-2"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/events"
              className="text-foreground hover:text-accent transition py-2"
              onClick={() => setMobileOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/about"
              className="text-foreground hover:text-accent transition py-2"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>
            <Link
              href="/whitepaper"
              className="text-foreground hover:text-accent transition py-2"
              onClick={() => setMobileOpen(false)}
            >
              Whitepaper
            </Link>
            {connected && publicKey ? (
              <button
                onClick={() => {
                  disconnectWallet();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition text-sm font-medium w-full"
              >
                <Wallet className="w-4 h-4" />
                Disconnect {truncateAddress(publicKey)}
              </button>
            ) : (
              <Link
                href="/connect-wallet"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
