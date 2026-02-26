import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, type Event, type Ticket } from '@/lib/db';
import { clusterApiUrl, Connection } from '@solana/web3.js';

const DEFAULT_RPC = process.env.SOLANA_RPC_URL ?? clusterApiUrl('testnet');

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

      if (!signature || typeof signature !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Valid transaction signature is required' },
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

      const connection = new Connection(DEFAULT_RPC, 'confirmed');
      const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
      const confirmation = status.value;

      if (!confirmation || confirmation.err) {
        return NextResponse.json(
          { success: false, error: 'Transaction verification failed on-chain' },
          { status: 400 }
        );
      }

      const confirmationState = confirmation.confirmationStatus;
      if (confirmationState !== 'confirmed' && confirmationState !== 'finalized') {
        return NextResponse.json(
          { success: false, error: 'Transaction not confirmed yet. Please retry in a moment.' },
          { status: 409 }
        );
      }

      const parsedTx = await connection.getParsedTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      const buyerSigned = parsedTx?.transaction.message.accountKeys.some(
        (account) => account.signer && account.pubkey.toBase58() === publicKey
      );

      if (!buyerSigned) {
        return NextResponse.json(
          { success: false, error: 'Security verification failed: wallet signer mismatch' },
          { status: 403 }
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
        [`tx-${Date.now()}`, 'purchase', eventId, publicKey, paidSol, confirmationState]
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
