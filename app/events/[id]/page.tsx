'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { Transaction } from '@solana/web3.js';
import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { useWallet } from '@/app/wallet-context';
import { Calendar, MapPin, Users, Share2, Heart, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';

type EventDetail = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  price_sol: number;
  category: string;
  organizer_wallet: string;
  total_tickets: number;
  available_tickets: number;
};

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isConnected, publicKey, refreshBalance } = useWallet();

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`/api/events?id=${id}`);
        const payload = await response.json();
        setEvent(payload.data ?? null);
      } catch (e) {
        console.error('Failed to load event', e);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  const percentageSold = useMemo(() => {
    if (!event || event.total_tickets <= 0) return 0;
    return Math.round(((event.total_tickets - event.available_tickets) / event.total_tickets) * 100);
  }, [event]);

  const remainingTickets = event?.available_tickets ?? 0;

  const decodeTx = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return Transaction.from(bytes);
  };

  const handleBuyTickets = async () => {
    if (!event) return;
    if (!isConnected || !publicKey) {
      setError('Please connect your wallet first.');
      return;
    }
    const wallet = (window as Window & {
      solana?: {
        signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string | Uint8Array }>;
      };
    }).solana;

    if (!wallet?.signAndSendTransaction) {
      setError('Wallet does not support transaction signing.');
      return;
    }

    setBuying(true);
    setError(null);
    setSuccess(null);

    try {
      let lastSignature = '';

      for (let count = 0; count < quantity; count += 1) {
        const actionResponse = await fetch(`/api/actions/events/${event.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: publicKey }),
        });

        const actionPayload = await actionResponse.json();
        if (!actionResponse.ok || !actionPayload.transaction) {
          throw new Error(actionPayload.error ?? 'Failed to build transaction');
        }

        const transaction = decodeTx(actionPayload.transaction as string);
        const signedResult = await wallet.signAndSendTransaction(transaction);

        const signature =
          typeof signedResult.signature === 'string'
            ? signedResult.signature
            : Array.from(signedResult.signature)
              .map((value: number) => value.toString(16).padStart(2, '0'))
                .join('');

        lastSignature = signature;

        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'purchase',
            publicKey,
            eventId: event.id,
            priceSol: event.price_sol,
            signature,
          }),
        });
      }

      await refreshBalance();
      setSuccess(`Purchase submitted. Last signature: ${lastSignature}`);
    } catch (buyError) {
      console.error(buyError);
      setError(buyError instanceof Error ? buyError.message : 'Ticket purchase failed');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderWrapper />
        <main className="min-h-screen bg-gradient-to-b from-background to-card flex items-center justify-center text-muted-foreground">
          Loading event...
        </main>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <HeaderWrapper />
        <main className="min-h-screen bg-gradient-to-b from-background to-card flex items-center justify-center text-muted-foreground">
          Event not found.
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4 py-8">
          <Link href="/events" className="flex items-center gap-2 text-accent hover:underline mb-8 inline-flex">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="md:col-span-2">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 h-96 rounded-lg mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/30" />
                <span className="absolute top-4 left-4 bg-accent text-accent-foreground px-4 py-2 rounded-full font-medium">
                  {event.category}
                </span>
              </div>

              <h1 className="text-5xl font-bold mb-6">{event.name}</h1>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="text-foreground">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-foreground">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organizer</p>
                    <p className="text-foreground">{event.organizer_wallet}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <p className="text-foreground whitespace-pre-wrap">{event.description}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">Ticket Availability</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">
                        {(event.total_tickets - event.available_tickets).toLocaleString()} / {event.total_tickets.toLocaleString()} sold
                      </span>
                      <span className="text-accent font-bold">{percentageSold}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent to-primary" style={{ width: `${percentageSold}%` }} />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{remainingTickets.toLocaleString()} tickets remaining</p>

                  {percentageSold > 90 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
                      <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        This event is almost sold out. Get your tickets before they&apos;re gone!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24 space-y-6">
                <div className="text-center pb-6 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-2">Price per ticket</p>
                  <p className="text-4xl font-bold text-accent">{event.price_sol} SOL</p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3 text-foreground">Quantity</p>
                  <div className="flex items-center gap-3 bg-background rounded-lg border border-border p-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition text-foreground"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center bg-transparent text-foreground focus:outline-none"
                      min="1"
                      max={remainingTickets}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(remainingTickets, quantity + 1))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition text-foreground"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-accent/10 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground">Subtotal</span>
                    <span className="text-foreground font-semibold">{quantity} × {event.price_sol} SOL</span>
                  </div>
                  <div className="border-t border-accent/20 pt-4 flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-accent">{(event.price_sol * quantity).toFixed(2)} SOL</span>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

                <button
                  onClick={handleBuyTickets}
                  disabled={remainingTickets === 0 || buying}
                  className="w-full py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buying ? 'Processing...' : remainingTickets === 0 ? 'Sold Out' : `Buy ${quantity} Ticket${quantity > 1 ? 's' : ''}`}
                </button>

                {!isConnected && (
                  <Link
                    href="/connect-wallet"
                    className="w-full block py-3 bg-background border border-border text-foreground rounded-lg font-semibold hover:border-accent transition text-center"
                  >
                    Connect Wallet First
                  </Link>
                )}

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => setLiked(!liked)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:border-accent transition text-foreground"
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    {liked ? 'Liked' : 'Like'}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:border-accent transition text-foreground">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
