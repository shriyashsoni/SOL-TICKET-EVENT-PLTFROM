import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, type Event } from '@/lib/db';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

const POST_EVENT_FEE_LAMPORTS = 100_000;
const DEFAULT_TREASURY = '5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ';

async function hasValidPostFeeTransfer(signature: string, organizer: string, treasury: string): Promise<boolean> {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL ?? clusterApiUrl('testnet'), 'confirmed');
    const tx = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return false;

    const organizerKey = new PublicKey(organizer).toBase58();
    const treasuryKey = new PublicKey(treasury).toBase58();

    const { instructions } = tx.transaction.message;
    for (const instruction of instructions) {
      if (!('parsed' in instruction) || !instruction.parsed || typeof instruction.parsed !== 'object') {
        continue;
      }

      const parsed = instruction.parsed as {
        type?: string;
        info?: {
          source?: string;
          destination?: string;
          lamports?: number;
        };
      };

      if (parsed.type !== 'transfer') continue;

      const source = parsed.info?.source;
      const destination = parsed.info?.destination;
      const lamports = Number(parsed.info?.lamports ?? 0);

      if (source === organizerKey && destination === treasuryKey && lamports >= POST_EVENT_FEE_LAMPORTS) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { nextUrl } = request;
    const { searchParams } = nextUrl;
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
      source_url,
      poster_url,
      post_fee_signature,
      organizer_wallet,
      organizer_name,
      event_account,
    } = body;

    if (!name || !date || !location || !price_sol || !total_tickets || !organizer_wallet || organizer_wallet === 'guest') {
      return NextResponse.json(
        { success: false, error: 'Connect wallet to post event' },
        { status: 400 }
      );
    }

    const treasury = process.env.BLINK_EVENT_TREASURY ?? DEFAULT_TREASURY;
    if (!post_fee_signature || typeof post_fee_signature !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Posting fee payment signature is required' },
        { status: 400 }
      );
    }

    const feePaid = await hasValidPostFeeTransfer(post_fee_signature, organizer_wallet, treasury);
    if (!feePaid) {
      return NextResponse.json(
        { success: false, error: 'Posting fee transaction not verified (need 0.0001 SOL transfer)' },
        { status: 400 }
      );
    }

    const id = `event-${Date.now()}`;
    const priceUsdc = Math.round(Number(price_sol) * 60);

    await dbRun(
      'INSERT INTO events (id, name, description, location, date, category, price_sol, price_usdc, total_tickets, available_tickets, organizer_wallet, organizer_name, event_account, source_url, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        source_url || null,
        poster_url || null,
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
