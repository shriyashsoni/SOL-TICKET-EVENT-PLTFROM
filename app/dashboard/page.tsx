'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { useWallet } from '@/app/wallet-context';
import { useRouter } from 'next/navigation';
import { Wallet, TrendingUp, Ticket, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type TicketRecord = {
  id: string;
  eventTitle: string;
  eventDate: string;
  price: string;
  date: string;
  status: 'active' | 'used' | 'expired';
  mint: string;
};

type TxRecord = {
  id: string;
  type: string;
  event: string;
  amount: number;
  token: string;
  date: string;
  status: string;
  signature: string;
};

export default function DashboardPage() {
  const { connected, publicKey, disconnectWallet, network, balance, switchNetwork, refreshBalance } = useWallet();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.replace('/connect-wallet');
    }
  }, [connected, router]);

  useEffect(() => {
    const load = async () => {
      if (!connected || !publicKey) return;
      setLoading(true);
      try {
        await refreshBalance();

        const [ticketsRes, txRes] = await Promise.all([
          fetch(`/api/tickets?publicKey=${publicKey}`),
          fetch(`/api/transactions?publicKey=${publicKey}&limit=10`),
        ]);

        const ticketsPayload = await ticketsRes.json();
        const txPayload = await txRes.json();

        setTickets(ticketsPayload.data ?? []);
        setTransactions(txPayload.data ?? []);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        setTickets([]);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [connected, publicKey, network]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'purchase')
      .reduce((acc, tx) => acc + tx.amount, 0)
      .toFixed(2);
  }, [transactions]);

  if (!connected) {
    return (
      <>
        <HeaderWrapper />
        <main className="min-h-screen bg-gradient-to-b from-background to-card flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Connect your wallet to open dashboard.</p>
            <Link
              href="/connect-wallet"
              className="inline-flex items-center gap-2 px-6 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition"
            >
              Connect Wallet
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
              <p className="text-lg text-muted-foreground">Manage your NFT tickets and blockchain assets</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={network}
                onChange={(e) => switchNetwork(e.target.value as 'testnet' | 'mainnet')}
                className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="testnet">Testnet</option>
                <option value="mainnet">Mainnet</option>
              </select>
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-card border border-border rounded-lg p-6 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-bold">Wallet Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Wallet Address</p>
                  <div className="flex items-center gap-3">
                    <code className="bg-background border border-border px-4 py-2 rounded-lg text-foreground font-mono text-sm flex-1 overflow-hidden text-ellipsis">
                      {publicKey}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(publicKey || '')}
                      className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Network</p>
                  <p className="font-medium text-foreground capitalize">
                    {network === 'testnet' ? 'Testnet (Testing)' : 'Mainnet (Production)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-bold">Balance</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">SOL Balance</p>
                  <p className="text-3xl font-bold text-accent">{balance.toFixed(4)} SOL</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8 md:mb-12">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Active Tickets</p>
              <p className="text-3xl font-bold text-accent">{tickets.length}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
              <p className="text-3xl font-bold text-accent">{totalSpent} SOL</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Transactions</p>
              <p className="text-3xl font-bold text-accent">{transactions.length}</p>
            </div>
          </div>

          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Ticket className="w-6 h-6 text-accent" />
              <h2 className="text-3xl font-bold">My Tickets</h2>
            </div>

            {loading ? (
              <div className="text-muted-foreground">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">No tickets yet</p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{ticket.eventTitle}</h3>
                      <p className="text-sm text-muted-foreground mb-1">Event: {ticket.eventDate}</p>
                      <p className="text-sm text-muted-foreground">Purchased: {ticket.date}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <p className="text-xl font-bold text-accent">{ticket.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-6">Recent Transactions</h2>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Event</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Type</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Amount</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Date</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-muted transition">
                      <td className="px-6 py-4">{tx.event}</td>
                      <td className="px-6 py-4 text-accent capitalize">{tx.type}</td>
                      <td className="px-6 py-4">{tx.amount} {tx.token}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium capitalize">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
