import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, type Event } from '@/lib/db';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

const POST_EVENT_FEE_LAMPORTS = 100_000;
const DEFAULT_TREASURY = '5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ';
const PROGRAM_ID = process.env.NEXT_PUBLIC_BLINK_TICKET_PROGRAM_ID ?? 'E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc';

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

async function hasValidCreateEventSignature(
  signature: string,
  organizer: string,
  eventAccount?: string
): Promise<boolean> {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL ?? clusterApiUrl('testnet'), 'confirmed');
    const tx = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) return false;

    const programId = new PublicKey(PROGRAM_ID).toBase58();
    const organizerKey = new PublicKey(organizer).toBase58();
    const eventKey = eventAccount ? new PublicKey(eventAccount).toBase58() : null;

    const keys = tx.transaction.message.accountKeys;
    const hasSigner = keys.some((entry) => {
      if (typeof entry === 'string') return false;
      return entry.pubkey.toBase58() === organizerKey && entry.signer;
    });

    const hasProgram = tx.transaction.message.instructions.some((instruction) => {
      if ('programId' in instruction) {
        return instruction.programId.toBase58() === programId;
      }
      return false;
    });

    const hasEventAccount = !eventKey || keys.some((entry) => {
      if (typeof entry === 'string') return entry === eventKey;
      return entry.pubkey.toBase58() === eventKey;
    });

    return hasSigner && hasProgram && hasEventAccount;
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
      const enriched = event
        ? {
            ...event,
            tickets_sold: Math.max(0, Number(event.total_tickets) - Number(event.available_tickets)),
            gross_profit_sol:
              Math.max(0, Number(event.total_tickets) - Number(event.available_tickets)) * Number(event.price_sol),
            withdrawn_profit_sol: Number(event.withdrawn_profit_sol ?? 0),
            available_profit_sol:
              Math.max(0, Number(event.total_tickets) - Number(event.available_tickets)) * Number(event.price_sol)
              - Number(event.withdrawn_profit_sol ?? 0),
          }
        : null;
      return NextResponse.json({
        data: enriched,
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

    const enriched = filtered.map((event) => {
      const ticketsSold = Math.max(0, Number(event.total_tickets) - Number(event.available_tickets));
      const grossProfit = ticketsSold * Number(event.price_sol);
      const withdrawn = Number(event.withdrawn_profit_sol ?? 0);
      return {
        ...event,
        tickets_sold: ticketsSold,
        gross_profit_sol: grossProfit,
        withdrawn_profit_sol: withdrawn,
        available_profit_sol: Math.max(0, grossProfit - withdrawn),
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
      count: enriched.length,
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
      create_event_signature,
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
    let verified = false;

    if (typeof create_event_signature === 'string' && create_event_signature.length > 0) {
      verified = await hasValidCreateEventSignature(create_event_signature, organizer_wallet, event_account);
    }

    if (!verified && typeof post_fee_signature === 'string' && post_fee_signature.length > 0) {
      verified = await hasValidPostFeeTransfer(post_fee_signature, organizer_wallet, treasury);
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'On-chain event posting transaction not verified' },
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
