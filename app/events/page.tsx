'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { Search, Calendar, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import Link from 'next/link';

type EventRecord = {
  id: string;
  name: string;
  date: string;
  location: string;
  price_sol: number;
  total_tickets: number;
  available_tickets: number;
  category: string;
};

type EventsApiResponse = {
  data?: EventRecord[];
};

const categories = ['All', 'Music', 'Conference', 'Gaming', 'Art'];

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
                        <span className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                          {event.category}
                        </span>
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition line-clamp-2">{event.name}</h3>

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
