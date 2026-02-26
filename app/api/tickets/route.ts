import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, type Event, type Ticket } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publicKey = searchParams.get('publicKey');

    if (!publicKey) {
      return NextResponse.json(
        { success: false, error: 'Public key required' },
        { status: 400 }
      );
    }

    const tickets = await dbAll<Ticket>('SELECT * FROM tickets WHERE owner_wallet = ?', [publicKey]);
    const events = await dbAll<Event>('SELECT * FROM events');

    const mapped = tickets.map((ticket) => {
      const event = events.find((item) => item.id === ticket.event_id);
      return {
        id: ticket.id,
        eventTitle: event?.name ?? ticket.event_id,
        eventDate: event?.date ?? 'TBD',
        price: `${ticket.price_paid_sol} SOL`,
        date: new Date(ticket.purchased_at).toLocaleDateString(),
        status: 'active' as const,
        mint: `cNFT-${ticket.id}`,
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
      count: mapped.length,
      publicKey,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, publicKey, eventId, priceSol, signature } = body;

    if (action === 'purchase') {
      if (!publicKey || !eventId) {
        return NextResponse.json(
          { success: false, error: 'publicKey and eventId are required' },
          { status: 400 }
        );
      }

      const event = await dbGet<Event>('SELECT * FROM events WHERE id = ?', [eventId]);
      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        );
      }

      const ticketId = `ticket-${Date.now()}`;
      const paidSol = typeof priceSol === 'number' && priceSol > 0 ? priceSol : event.price_sol;

      await dbRun(
        'INSERT INTO tickets (id, event_id, owner_wallet, price_paid_sol) VALUES (?, ?, ?, ?)',
        [ticketId, eventId, publicKey, paidSol]
      );

      await dbRun(
        'INSERT INTO transactions (id, type, event_id, user_wallet, amount_sol, status) VALUES (?, ?, ?, ?, ?, ?)',
        [`tx-${Date.now()}`, 'purchase', eventId, publicKey, paidSol, 'confirmed']
      );

      return NextResponse.json({
        success: true,
        message: 'Ticket purchased successfully',
        data: {
          id: ticketId,
          eventTitle: event.name,
          eventDate: event.date,
          price: `${paidSol} SOL`,
          date: new Date().toLocaleDateString(),
          status: 'active',
          mint: signature ?? `cNFT-${ticketId}`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process ticket request' },
      { status: 500 }
    );
  }
}
