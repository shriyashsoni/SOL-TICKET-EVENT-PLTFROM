'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Search, Calendar, MapPin, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useWallet } from '@/app/wallet-context';

type EventRecord = {
  id: string;
  name: string;
  description?: string;
  source_url?: string;
  poster_url?: string;
  date: string;
  location: string;
  price_sol: number;
  total_tickets: number;
  available_tickets: number;
  category: string;
  organizer_name?: string;
  event_account?: string;
};

type EventsApiResponse = {
  data?: EventRecord[];
};

const categories = ['All', 'Music', 'Conference', 'Gaming', 'Art'];

export default function EventsPage() {
  const { publicKey, network } = useWallet();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [scraping, setScraping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [formState, setFormState] = useState({
    source_url: '',
    poster_url: '',
    name: '',
    date: '',
    location: '',
    category: 'General',
    description: '',
    price_sol: '',
    total_tickets: '',
  });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const payload = (await response.json()) as EventsApiResponse;
        setEvents(payload.data ?? []);
      } catch (error) {
        console.error('Failed to load events', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const onCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage('');

    try {
      if (!publicKey) {
        throw new Error('Connect wallet first to post an event.');
      }

      const wallet = (window as Window & {
        solana?: {
          signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string | Uint8Array }>;
        };
      }).solana;

      if (!wallet?.signAndSendTransaction) {
        throw new Error('Wallet does not support transaction signing.');
      }

      const rpcUrl = network === 'mainnet'
        ? 'https://api.mainnet-beta.solana.com'
        : clusterApiUrl('testnet');
      const connection = new Connection(rpcUrl, 'confirmed');
      const organizerPubkey = new PublicKey(publicKey);
      const treasuryPubkey = new PublicKey(
        process.env.NEXT_PUBLIC_BLINK_EVENT_TREASURY ?? '5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ'
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const feeTx = new Transaction({
        feePayer: organizerPubkey,
        blockhash,
        lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: organizerPubkey,
          toPubkey: treasuryPubkey,
          lamports: 100_000,
        })
      );

      const feeResult = await wallet.signAndSendTransaction(feeTx);
      const postFeeSignature = typeof feeResult.signature === 'string'
        ? feeResult.signature
        : Array.from(feeResult.signature)
            .map((value: number) => value.toString(16).padStart(2, '0'))
            .join('');

      const organizerName = typeof window !== 'undefined' ? localStorage.getItem('blink_user_name') : null;
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          price_sol: Number(formState.price_sol),
          total_tickets: Number(formState.total_tickets),
          organizer_wallet: publicKey,
          organizer_name: organizerName || 'Anonymous',
          post_fee_signature: postFeeSignature,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to create event');
      }

      setEvents((prev) => [payload.data, ...prev]);
      setFormState({
        source_url: '',
        poster_url: '',
        name: '',
        date: '',
        location: '',
        category: 'General',
        description: '',
        price_sol: '',
        total_tickets: '',
      });
      setSubmitMessage('Event posted successfully and is visible to all users. Posting fee paid: 0.0001 SOL.');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Failed to post event');
    } finally {
      setSubmitting(false);
    }
  };

  const onScrapeFromLink = async () => {
    if (!formState.source_url.trim()) {
      setScrapeMessage('Enter an event link first.');
      return;
    }

    setScraping(true);
    setScrapeMessage('');

    try {
      const response = await fetch('/api/events/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formState.source_url }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to scrape event link');
      }

      const data = payload.data ?? {};
      setFormState((prev) => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        date: data.date || prev.date,
        location: data.location || prev.location,
        category: data.category || prev.category,
      }));

      setScrapeMessage(payload.message || 'Event details generated from link.');
    } catch (error) {
      setScrapeMessage(error instanceof Error ? error.message : 'Failed to scrape link');
    } finally {
      setScraping(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event: EventRecord) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Discover Events</h1>
            <p className="text-lg text-muted-foreground">Find and buy NFT tickets for your favorite events</p>
          </div>

          <div className="mb-8 space-y-4">
            <form onSubmit={onCreateEvent} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h2 className="text-lg font-semibold">Post an Event</h2>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  type="url"
                  placeholder="Paste event page link (AI auto-fill)"
                  value={formState.source_url}
                  onChange={(e) => setFormState((prev) => ({ ...prev, source_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <button
                  type="button"
                  onClick={onScrapeFromLink}
                  disabled={scraping}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-70 inline-flex items-center gap-2"
                >
                  {scraping ? 'Scraping...' : 'AI Scrape'}
                  {!scraping && <Sparkles className="w-4 h-4" />}
                </button>
              </div>
              {scrapeMessage && <p className="text-sm text-muted-foreground">{scrapeMessage}</p>}
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="url"
                  placeholder="Poster photo URL"
                  value={formState.poster_url}
                  onChange={(e) => setFormState((prev) => ({ ...prev, poster_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md md:col-span-2"
                />
                <input
                  required
                  placeholder="Event name"
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <input
                  required
                  placeholder="Location"
                  value={formState.location}
                  onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <input
                  required
                  type="date"
                  value={formState.date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ticket price (SOL)"
                  value={formState.price_sol}
                  onChange={(e) => setFormState((prev) => ({ ...prev, price_sol: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Total tickets"
                  value={formState.total_tickets}
                  onChange={(e) => setFormState((prev) => ({ ...prev, total_tickets: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <input
                  placeholder="Category"
                  value={formState.category}
                  onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>
              <textarea
                placeholder="Description"
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md min-h-24"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Posting fee: 0.0001 SOL. Connected wallet is required and charged on submit.</p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-70"
                >
                  {submitting ? 'Posting...' : 'Post Event'}
                </button>
              </div>
              {submitMessage && <p className="text-sm text-muted-foreground">{submitMessage}</p>}
            </form>

            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events by name or location..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-card border border-border text-foreground hover:border-accent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading events...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {filteredEvents.map((event: EventRecord, index: number) => {
                const gradients = ['from-purple-600 to-blue-600', 'from-blue-600 to-cyan-600', 'from-pink-600 to-orange-600'];
                const gradient = gradients[index % gradients.length];
                const ticketsSold = event.total_tickets - event.available_tickets;
                const soldPct = Math.round((ticketsSold / event.total_tickets) * 100);

                return (
                  <Link key={event.id} href={`/events/${event.id}`} className="group">
                    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-accent transition h-full flex flex-col">
                      <div className={`h-48 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                        {event.poster_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.poster_url}
                            alt={`${event.name} poster`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
                        <span className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                          {event.category}
                        </span>
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition line-clamp-2">{event.name}</h3>
                        {event.source_url && (
                          <a
                            href={event.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent mb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkIcon className="w-3 h-3" />
                            Source link
                          </a>
                        )}

                        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        <div className="mb-4 flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium">{ticketsSold} / {event.total_tickets}</span>
                            <span className="text-xs text-accent font-semibold">{soldPct}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-accent to-primary" style={{ width: `${soldPct}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="font-bold text-accent">{event.price_sol} SOL</span>
                          <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition text-sm">
                            Buy Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No events found</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
