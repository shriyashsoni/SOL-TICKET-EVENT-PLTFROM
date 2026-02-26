'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { Transaction } from '@solana/web3.js';
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
  const [autoPosting, setAutoPosting] = useState(false);
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

  const hasScrapedEventData = Boolean(
    formState.name.trim() && formState.date.trim() && formState.location.trim()
  );
  const hasPricingData = Boolean(formState.price_sol.trim() && formState.total_tickets.trim());

  const decodeTx = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return Transaction.from(bytes);
  };

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

  const createEventFromForm = async (activeFormState: typeof formState) => {
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

    if (!activeFormState.name.trim() || !activeFormState.date.trim() || !activeFormState.location.trim()) {
      throw new Error('Use AI Scrape first so event details are auto-filled.');
    }

    const derivedSymbol = activeFormState.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) || 'EVNT';
    const metadataUri = activeFormState.source_url || activeFormState.poster_url || 'https://example.com';

    const actionResponse = await fetch('/api/actions/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: publicKey,
        eventName: activeFormState.name,
        symbol: derivedSymbol,
        uri: metadataUri,
        totalTickets: Number(activeFormState.total_tickets),
        priceInSol: Number(activeFormState.price_sol),
      }),
    });

    const actionPayload = await actionResponse.json();
    if (!actionResponse.ok || !actionPayload.transaction) {
      throw new Error(actionPayload.error || 'Failed to build on-chain create event transaction');
    }

    const createTx = decodeTx(actionPayload.transaction as string);
    const createResult = await wallet.signAndSendTransaction(createTx);
    const createEventSignature = typeof createResult.signature === 'string'
      ? createResult.signature
      : Array.from(createResult.signature)
          .map((value: number) => value.toString(16).padStart(2, '0'))
          .join('');

    const organizerName = typeof window !== 'undefined' ? localStorage.getItem('blink_user_name') : null;
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...activeFormState,
        price_sol: Number(activeFormState.price_sol),
        total_tickets: Number(activeFormState.total_tickets),
        organizer_wallet: publicKey,
        organizer_name: organizerName || 'Anonymous',
        event_account: actionPayload.eventAccount || null,
        create_event_signature: createEventSignature,
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
  };

  const onCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage('');

    try {
      await createEventFromForm(formState);
      setSubmitMessage('Event created on-chain and posted successfully. Posting fee (0.0001 SOL) charged by smart contract.');
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
        poster_url: data.poster_url || prev.poster_url,
      }));

      setScrapeMessage(payload.message || 'Event details generated from link.');
    } catch (error) {
      setScrapeMessage(error instanceof Error ? error.message : 'Failed to scrape link');
    } finally {
      setScraping(false);
    }
  };

  const onScrapeAndCreate = async () => {
    if (!formState.source_url.trim()) {
      setScrapeMessage('Enter an event link first.');
      return;
    }

    setAutoPosting(true);
    setSubmitMessage('');
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
      const mergedFormState = {
        ...formState,
        name: data.name || formState.name,
        description: data.description || formState.description,
        date: data.date || formState.date,
        location: data.location || formState.location,
        category: data.category || formState.category,
        poster_url: data.poster_url || formState.poster_url,
      };

      setFormState(mergedFormState);
      await createEventFromForm(mergedFormState);
      setSubmitMessage('Link scraped and event auto-created on-chain successfully.');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Auto create failed');
    } finally {
      setAutoPosting(false);
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
            <form onSubmit={onCreateEvent} className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-semibold">AI Event Publisher</h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent">Smart On-Chain Create</span>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className={`rounded-md border px-3 py-2 text-xs ${formState.source_url.trim() ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}>
                  1. Add Event Link
                </div>
                <div className={`rounded-md border px-3 py-2 text-xs ${hasScrapedEventData ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}>
                  2. AI Scrape Details
                </div>
                <div className={`rounded-md border px-3 py-2 text-xs ${hasPricingData ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}>
                  3. Set Price + Size
                </div>
              </div>

              {!publicKey && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  Connect wallet before creating event on-chain.
                </div>
              )}

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
                  disabled={scraping || autoPosting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-70 inline-flex items-center gap-2"
                >
                  {scraping ? 'Scraping...' : 'AI Scrape'}
                  {!scraping && <Sparkles className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onScrapeAndCreate}
                  disabled={autoPosting || scraping || !formState.price_sol || !formState.total_tickets}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-70"
                >
                  {autoPosting ? 'Scraping + Creating...' : 'Scrape + Auto Create'}
                </button>
              </div>
              {scrapeMessage && <p className="text-sm text-muted-foreground">{scrapeMessage}</p>}
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Poster URL (auto-filled, editable)"
                  value={formState.poster_url}
                  onChange={(e) => setFormState((prev) => ({ ...prev, poster_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md md:col-span-2"
                />
                <input
                  required
                  placeholder="Event name (auto-filled)"
                  value={formState.name}
                  readOnly
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-muted-foreground"
                />
                <input
                  required
                  placeholder="Location (auto-filled)"
                  value={formState.location}
                  readOnly
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-muted-foreground"
                />
                <input
                  required
                  type="date"
                  value={formState.date}
                  readOnly
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-muted-foreground"
                />
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ticket price (SOL) - enter"
                  value={formState.price_sol}
                  onChange={(e) => setFormState((prev) => ({ ...prev, price_sol: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Total tickets (size) - enter"
                  value={formState.total_tickets}
                  onChange={(e) => setFormState((prev) => ({ ...prev, total_tickets: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
                <input
                  placeholder="Category (auto-filled)"
                  value={formState.category}
                  readOnly
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-muted-foreground"
                />
              </div>
              {formState.poster_url && (
                <div className="rounded-md border border-border bg-muted/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formState.poster_url} alt="Scraped poster" className="h-40 w-full rounded object-cover" />
                </div>
              )}

              <div className="rounded-md border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground mb-2">Live Event Preview</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{formState.name || 'Event title will appear here'}</p>
                    <p className="text-xs text-muted-foreground truncate">{formState.location || 'Event location'} · {formState.date || 'Event date'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent">{formState.price_sol || '0'} SOL</p>
                    <p className="text-xs text-muted-foreground">{formState.total_tickets || '0'} tickets</p>
                  </div>
                </div>
              </div>

              <textarea
                placeholder="Description (auto-filled)"
                value={formState.description}
                readOnly
                className="w-full px-3 py-2 bg-muted border border-border rounded-md min-h-24 text-muted-foreground"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Paste link → scrape data → set price & size → create on-chain (or use one-click auto create).</p>
                <button
                  type="submit"
                  disabled={submitting || autoPosting || !hasScrapedEventData || !hasPricingData || !publicKey}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-70"
                >
                  {submitting ? 'Paying & Posting...' : 'Pay & Post Event'}
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
