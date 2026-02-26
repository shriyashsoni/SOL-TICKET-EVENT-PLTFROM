'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { useWallet } from '@/app/wallet-context';
import { ArrowRight, Bot, CalendarPlus, ChartNoAxesCombined, ShieldCheck, Sparkles, Ticket, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  price_sol: number;
  description: string;
  category: string;
  available_tickets: number;
  total_tickets: number;
}

interface Stats {
  totalTicketsSold: number;
  activeEvents: number;
  activeUsers: number;
  totalRevenueSol: number;
  platformFees: number;
}

export default function Home() {
  const { isConnected } = useWallet();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, statsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/stats'),
        ]);

        const eventsData = await eventsRes.json();
        const statsData = await statsRes.json();

        setEvents((eventsData.data || []).slice(0, 3));
        setStats(statsData.data || null);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-background via-card to-background py-20 md:py-28 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent mb-5">
                  <Sparkles className="w-4 h-4" />
                  AI + On-chain Ticket Platform (Testnet)
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">
                  Create and sell tickets with one link
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Paste an event URL, auto-fill details with AI scraping, post on Solana testnet, and sell tickets with verifiable on-chain transactions.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/events"
                    className="px-8 py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition inline-flex items-center gap-2"
                  >
                    Browse Events
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  {isConnected ? (
                    <Link
                      href="/dashboard"
                      className="px-8 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition inline-flex items-center gap-2"
                    >
                      Open Dashboard
                      <ChartNoAxesCombined className="w-5 h-5" />
                    </Link>
                  ) : (
                    <Link
                      href="/connect-wallet"
                      className="px-8 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition"
                    >
                      Connect Wallet
                    </Link>
                  )}
                  <Link
                    href="/whitepaper"
                    className="px-8 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-muted transition inline-flex items-center gap-2"
                  >
                    Read Whitepaper
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mt-8">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">Network</p>
                    <p className="font-semibold">Solana Testnet</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">Posting Fee</p>
                    <p className="font-semibold">0.0001 SOL</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">Verification</p>
                    <p className="font-semibold">On-chain checked</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-44 text-center">
                  <Bot className="w-10 h-10 text-accent mb-3" />
                  <p className="font-semibold">AI Event Scraping</p>
                  <p className="text-xs text-muted-foreground mt-1">Auto-fill title, date, venue, image</p>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-44 text-center">
                  <ShieldCheck className="w-10 h-10 text-accent mb-3" />
                  <p className="font-semibold">On-chain Event Post</p>
                  <p className="text-xs text-muted-foreground mt-1">Program PDA + posting fee enforcement</p>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-primary/20 to-accent/20 border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-44 text-center">
                  <Wallet className="w-10 h-10 text-accent mb-3" />
                  <p className="font-semibold">Organizer Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-1">Track sales, profit, and withdraw earnings</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 border-b border-border bg-card/40">
          <div className="container mx-auto px-4">
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-3">Core Platform Features</h2>
              <p className="text-muted-foreground">Everything needed to post, sell, verify, and manage ticket events.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <CalendarPlus className="w-6 h-6 text-accent mb-3" />
                <h3 className="font-semibold mb-1">Create from URL</h3>
                <p className="text-sm text-muted-foreground">Use one event link to prefill details and publish faster.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <Ticket className="w-6 h-6 text-accent mb-3" />
                <h3 className="font-semibold mb-1">NFT-style Tickets</h3>
                <p className="text-sm text-muted-foreground">Each purchase is tied to a verified on-chain transaction.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <Zap className="w-6 h-6 text-accent mb-3" />
                <h3 className="font-semibold mb-1">Reliable Verification</h3>
                <p className="text-sm text-muted-foreground">Backend retries and RPC fallback improve confirmation stability.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <ChartNoAxesCombined className="w-6 h-6 text-accent mb-3" />
                <h3 className="font-semibold mb-1">Sales & Profit View</h3>
                <p className="text-sm text-muted-foreground">Public sold/profit metrics plus organizer withdrawal actions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent mb-2">
                  {stats ? stats.totalTicketsSold.toLocaleString() : '—'}
                </p>
                <p className="text-muted-foreground">Total Tickets Sold</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-accent mb-2">
                  {stats ? stats.activeEvents : '—'}
                </p>
                <p className="text-muted-foreground">Active Events</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-accent mb-2">
                  {stats ? stats.activeUsers.toLocaleString() : '—'}
                </p>
                <p className="text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-accent mb-2">
                  {stats ? `${stats.platformFees} SOL` : '—'}
                </p>
                <p className="text-muted-foreground">Platform Fees</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Events */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="text-4xl font-bold mb-4">Featured Events</h2>
              <p className="text-lg text-muted-foreground">Discover live events and buy verified tickets on Solana testnet</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-3 text-center text-muted-foreground">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="col-span-3 text-center text-muted-foreground">No events available</div>
              ) : (
                events.map((event) => {
                  const gradients = ['from-purple-600 to-blue-600', 'from-blue-600 to-cyan-600', 'from-pink-600 to-orange-600'];
                  const gradient = gradients[events.indexOf(event) % gradients.length];
                  const ticketsSold = (event.total_tickets - event.available_tickets);
                  const percentageSold = Math.round((ticketsSold / event.total_tickets) * 100);

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="group"
                    >
                      <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-accent transition">
                        {/* Image */}
                        <div className={`h-48 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition line-clamp-2">
                            {event.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">{event.date}</p>
                          <p className="text-sm text-muted-foreground mb-4">{event.location}</p>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{ticketsSold} / {event.total_tickets}</span>
                              <span className="text-sm text-accent font-semibold">{percentageSold}%</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-accent to-primary"
                                style={{ width: `${percentageSold}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <span className="font-bold text-accent">{event.price_sol} SOL</span>
                            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition text-sm">
                              Get Ticket
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition"
              >
                View All Events
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to launch your next event?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect Phantom, create events from links, and let users purchase tickets with on-chain verification.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Explore Events
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/whitepaper"
                className="inline-flex items-center gap-2 px-8 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition"
              >
                Read Whitepaper
                <ArrowRight className="w-5 h-5" />
              </Link>
              {isConnected ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition"
                >
                  Go to Dashboard
                  <ChartNoAxesCombined className="w-5 h-5" />
                </Link>
              ) : (
              <Link
                href="/connect-wallet"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Connect Wallet Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
