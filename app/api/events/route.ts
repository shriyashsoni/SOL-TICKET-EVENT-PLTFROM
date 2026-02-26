import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, type Event } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    if (id) {
      const event = await dbGet<Event>('SELECT * FROM events WHERE id = ?', [id]);
      return NextResponse.json({
        data: event,
        success: true,
      });
    }

    let query = 'SELECT * FROM events';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const events = await dbAll<Event>(query, params);

    let filtered = events;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        event =>
          event.name.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      date,
      location,
      price_sol,
      total_tickets,
      category,
      description,
      organizer_wallet,
      organizer_name,
      event_account,
    } = body;

    if (!name || !date || !location || !price_sol || !total_tickets) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = `event-${Date.now()}`;
    const priceUsdc = Math.round(Number(price_sol) * 60);

    await dbRun(
      'INSERT INTO events (id, name, description, location, date, category, price_sol, price_usdc, total_tickets, available_tickets, organizer_wallet, organizer_name, event_account) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        description || '',
        location,
        date,
        category || 'General',
        Number(price_sol),
        priceUsdc,
        Number(total_tickets),
        Number(total_tickets),
        organizer_wallet || 'guest',
        organizer_name || 'Anonymous',
        event_account || null,
      ]
    );

    const newEvent = await dbGet<Event>('SELECT * FROM events WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
