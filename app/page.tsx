'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { useWallet } from '@/app/wallet-context';
import { ArrowRight, Ticket, TrendingUp, Zap } from 'lucide-react';
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
        <section className="bg-gradient-to-b from-background via-card to-background py-20 md:py-32 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
                  The Future of Event Ticketing
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Buy, sell, and manage NFT tickets on Solana. Instant transfers, verifiable ownership, and zero fees.
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/events"
                    className="px-8 py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition inline-flex items-center gap-2"
                  >
                    Browse Events
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  {!isConnected && (
                    <Link
                      href="/connect-wallet"
                      className="px-8 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition"
                    >
                      Connect Wallet
                    </Link>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-8 flex flex-col justify-center items-center h-48">
                  <Ticket className="w-12 h-12 text-accent mb-4" />
                  <p className="text-center text-sm font-medium">NFT Tickets</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl p-8 flex flex-col justify-center items-center h-48">
                  <Zap className="w-12 h-12 text-accent mb-4" />
                  <p className="text-center text-sm font-medium">Instant Transfers</p>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-pink-600/20 to-orange-600/20 border border-pink-500/30 rounded-2xl p-8 flex flex-col justify-center items-center h-48">
                  <TrendingUp className="w-12 h-12 text-accent mb-4" />
                  <p className="text-center text-sm font-medium">Resale Market</p>
                </div>
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
              <p className="text-lg text-muted-foreground">Discover upcoming events and get your NFT tickets</p>
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
            <h2 className="text-4xl font-bold mb-6">Ready to Get Your First NFT Ticket?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect your Phantom wallet and start buying verified NFT tickets today
            </p>
            {!isConnected && (
              <Link
                href="/connect-wallet"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Connect Wallet Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
