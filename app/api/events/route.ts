import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, type Event } from '@/lib/db';
import { publishRealtimeEvent } from '@/lib/realtime';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

const POST_EVENT_FEE_LAMPORTS = 100_000;
const DEFAULT_TREASURY = '5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ';
const PROGRAM_ID = process.env.NEXT_PUBLIC_BLINK_TICKET_PROGRAM_ID ?? 'E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc';

const VERIFY_RETRIES = 20;
const VERIFY_RETRY_DELAY_MS = 500;

function resolveTestnetRpcCandidates(): string[] {
  const candidates: string[] = [];
  const configured = process.env.SOLANA_RPC_URL?.trim();

  if (configured && configured.toLowerCase().includes('testnet')) {
    candidates.push(configured);
  }

  candidates.push(clusterApiUrl('testnet'));
  candidates.push('https://api.testnet.solana.com');

  return Array.from(new Set(candidates));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toBase58Like(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'toBase58' in value && typeof (value as { toBase58?: unknown }).toBase58 === 'function') {
    return ((value as { toBase58: () => string }).toBase58());
  }
  return null;
}

function parsedAccountKeyToBase58(entry: unknown): string | null {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry && 'pubkey' in entry) {
    return toBase58Like((entry as { pubkey?: unknown }).pubkey);
  }
  return null;
}

function isLikelyBase58Signature(signature: string): boolean {
  try {
    const decoded = bs58.decode(signature);
    return decoded.length === 64;
  } catch {
    return false;
  }
}

async function hasValidPostFeeTransfer(signature: string, organizer: string, treasury: string): Promise<boolean> {
  try {
    let tx: Awaited<ReturnType<Connection['getParsedTransaction']>> | null = null;

    for (const rpc of resolveTestnetRpcCandidates()) {
      const connection = new Connection(rpc, 'confirmed');

      for (let attempt = 0; attempt < VERIFY_RETRIES; attempt += 1) {
        tx = await connection.getParsedTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (tx) break;
        await sleep(VERIFY_RETRY_DELAY_MS);
      }

      if (tx) break;
    }

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
    let tx: Awaited<ReturnType<Connection['getParsedTransaction']>> | null = null;

    for (const rpc of resolveTestnetRpcCandidates()) {
      const connection = new Connection(rpc, 'confirmed');

      for (let attempt = 0; attempt < VERIFY_RETRIES; attempt += 1) {
        tx = await connection.getParsedTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (tx) break;
        await sleep(VERIFY_RETRY_DELAY_MS);
      }

      if (tx) break;
    }

    if (!tx || tx.meta?.err) return false;

    const programId = new PublicKey(PROGRAM_ID).toBase58();
    const organizerKey = new PublicKey(organizer).toBase58();
    const eventKey = eventAccount ? new PublicKey(eventAccount).toBase58() : null;

    const keys = tx.transaction.message.accountKeys;
    const hasSigner = keys.some((entry) => {
      if (typeof entry === 'string') return false;
      const key = parsedAccountKeyToBase58(entry);
      const isSigner = Boolean((entry as { signer?: boolean }).signer);
      return key === organizerKey && isSigner;
    });

    const hasProgram = tx.transaction.message.instructions.some((instruction) => {
      if ('programId' in instruction) {
        const instructionProgramId = toBase58Like((instruction as { programId?: unknown }).programId);
        return instructionProgramId === programId;
      }
      return false;
    });

    const hasEventAccount = !eventKey || keys.some((entry) => {
      return parsedAccountKeyToBase58(entry) === eventKey;
    });

    return hasSigner && hasProgram && hasEventAccount;
  } catch {
    return false;
  }
}

async function hasConfirmedSignatureFromOrganizer(signature: string, organizer: string): Promise<boolean> {
  try {
    const organizerKey = new PublicKey(organizer).toBase58();

    for (const rpc of resolveTestnetRpcCandidates()) {
      const connection = new Connection(rpc, 'confirmed');

      for (let attempt = 0; attempt < VERIFY_RETRIES; attempt += 1) {
        const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
        const confirmation = status.value;

        if (confirmation?.err) {
          return false;
        }

        const confirmationState = confirmation?.confirmationStatus;
        if (confirmationState === 'confirmed' || confirmationState === 'finalized') {
          const tx = await connection.getParsedTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || tx.meta?.err) {
            return true;
          }

          const hasSigner = tx.transaction.message.accountKeys.some((entry) => {
            if (typeof entry === 'string') return entry === organizerKey;
            const key = parsedAccountKeyToBase58(entry);
            const isSigner = Boolean((entry as { signer?: boolean }).signer);
            return key === organizerKey && isSigner;
          });

          return hasSigner;
        }

        await sleep(VERIFY_RETRY_DELAY_MS);
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

    if (typeof create_event_signature === 'string' && create_event_signature.length > 0 && !isLikelyBase58Signature(create_event_signature)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid create_event_signature format (expected base58 signature)',
          hint: {
            expected: 'base58',
            receivedLength: create_event_signature.length,
            rpcCandidates: resolveTestnetRpcCandidates(),
          },
        },
        { status: 400 }
      );
    }

    if (typeof post_fee_signature === 'string' && post_fee_signature.length > 0 && !isLikelyBase58Signature(post_fee_signature)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid post_fee_signature format (expected base58 signature)',
          hint: {
            expected: 'base58',
            receivedLength: post_fee_signature.length,
            rpcCandidates: resolveTestnetRpcCandidates(),
          },
        },
        { status: 400 }
      );
    }

    if (typeof create_event_signature === 'string' && create_event_signature.length > 0) {
      verified = await hasValidCreateEventSignature(create_event_signature, organizer_wallet, event_account);

      if (!verified) {
        verified = await hasConfirmedSignatureFromOrganizer(create_event_signature, organizer_wallet);
      }
    }

    if (!verified && typeof post_fee_signature === 'string' && post_fee_signature.length > 0) {
      verified = await hasValidPostFeeTransfer(post_fee_signature, organizer_wallet, treasury);
    }

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'On-chain event posting transaction not verified',
          hint: {
            rpcCandidatesTried: resolveTestnetRpcCandidates(),
            createEventSignatureProvided: Boolean(create_event_signature),
            postFeeSignatureProvided: Boolean(post_fee_signature),
            organizerWallet: organizer_wallet,
            eventAccount: event_account ?? null,
            note: 'Ensure frontend sends base58 signature and Vercel SOLANA_RPC_URL points to testnet.',
          },
        },
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

    await dbRun(
      'INSERT INTO transactions (id, type, event_id, user_wallet, amount_sol, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        `tx-post-${Date.now()}`,
        'event_post',
        id,
        organizer_wallet,
        Number(POST_EVENT_FEE_LAMPORTS) / 1_000_000_000,
        'confirmed',
      ]
    );

    const newEvent = await dbGet<Event>('SELECT * FROM events WHERE id = ?', [id]);

    publishRealtimeEvent('event_created', {
      eventId: id,
      organizerWallet: organizer_wallet,
    });
    publishRealtimeEvent('transaction_created', {
      eventId: id,
      organizerWallet: organizer_wallet,
      type: 'event_post',
    });

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
        { success: false, error: 'Only organizer can delete event' },
        { status: 403 }
      );
    }

    const deleted = await dbRun('DELETE FROM events WHERE id = ?', [eventId]);
    if (deleted.changes <= 0) {
      return NextResponse.json(
        { success: false, error: 'Event deletion failed' },
        { status: 500 }
      );
    }

    publishRealtimeEvent('event_deleted', {
      eventId,
      organizerWallet,
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
      data: { eventId },
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
