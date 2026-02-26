import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbRun, type Event } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventId = String(body.eventId ?? '').trim();
    const organizerWallet = String(body.organizerWallet ?? '').trim();

    if (!eventId || !organizerWallet) {
      return NextResponse.json(
        { success: false, error: 'eventId and organizerWallet are required' },
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

    if (event.organizer_wallet !== organizerWallet) {
      return NextResponse.json(
        { success: false, error: 'Only organizer can withdraw profit' },
        { status: 403 }
      );
    }

    const ticketsSold = Math.max(0, Number(event.total_tickets) - Number(event.available_tickets));
    const grossProfit = ticketsSold * Number(event.price_sol);
    const withdrawn = Number(event.withdrawn_profit_sol ?? 0);
    const available = Math.max(0, grossProfit - withdrawn);

    if (available <= 0) {
      return NextResponse.json(
        { success: false, error: 'No available profit to withdraw' },
        { status: 400 }
      );
    }

    const updatedWithdrawn = withdrawn + available;
    await dbRun('UPDATE events SET withdrawn_profit_sol = ? WHERE id = ?', [updatedWithdrawn, event.id]);

    return NextResponse.json({
      success: true,
      message: 'Profit withdrawn successfully',
      data: {
        eventId: event.id,
        withdrawnNowSol: available,
        totalWithdrawnSol: updatedWithdrawn,
      },
    });
  } catch (error) {
    console.error('Withdraw profit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to withdraw profit' },
      { status: 500 }
    );
  }
}
