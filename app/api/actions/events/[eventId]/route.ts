import { NextRequest, NextResponse } from 'next/server';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { dbGet, type Event } from '@/lib/db';
import {
  ACTIONS_CORS_HEADERS,
  anchorDiscriminator,
  encodeU64LE,
  optionsResponse,
  parsePublicKeyString,
} from '../../_utils';

const DEFAULT_RPC = process.env.SOLANA_RPC_URL ?? clusterApiUrl('testnet');
const PROGRAM_ID = process.env.NEXT_PUBLIC_BLINK_TICKET_PROGRAM_ID ?? 'E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc';
const DEFAULT_TREASURY = '5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ';

type ActionPostBody = {
  account?: string;
};

function tryParsePublicKey(value?: string | null): PublicKey | null {
  if (!value) return null;
  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

function getActionUrl(eventId: string, request: NextRequest): string {
  const url = new URL(request.url);
  return `${url.origin}/api/actions/events/${eventId}`;
}

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const event = await dbGet<Event>('SELECT * FROM events WHERE id = ?', [eventId]);

    if (!event) {
      return NextResponse.json(
        { error: `Event ${eventId} not found` },
        { status: 404, headers: ACTIONS_CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        title: event.name,
        icon: 'https://solana.com/src/img/branding/solanaLogoMark.svg',
        description: event.description,
        label: 'Buy Ticket',
        links: {
          actions: [
            {
              label: `Buy for ${event.price_sol} SOL`,
              href: getActionUrl(eventId, request),
            },
          ],
        },
      },
      { headers: ACTIONS_CORS_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load action' },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const event = await dbGet<Event>('SELECT * FROM events WHERE id = ?', [eventId]);

    if (!event) {
      return NextResponse.json(
        { error: `Event ${eventId} not found` },
        { status: 404, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const body = (await request.json()) as ActionPostBody;
    const buyer = new PublicKey(parsePublicKeyString(body.account ?? null, 'account'));

    const searchParams = request.nextUrl.searchParams;
    const eventAccountCandidate = tryParsePublicKey(
      searchParams.get('eventAccount') ?? event.event_account ?? process.env.BLINK_EVENT_ACCOUNT ?? null
    );
    const treasury =
      tryParsePublicKey(searchParams.get('treasury'))
      ?? tryParsePublicKey(event.organizer_wallet)
      ?? tryParsePublicKey(process.env.BLINK_EVENT_TREASURY)
      ?? new PublicKey(DEFAULT_TREASURY);
    const programId = new PublicKey(PROGRAM_ID);
    const connection = new Connection(DEFAULT_RPC, 'confirmed');

    let validatedEventAccount: PublicKey | null = null;
    if (eventAccountCandidate) {
      const accountInfo = await connection.getAccountInfo(eventAccountCandidate, 'confirmed');
      if (accountInfo?.owner?.equals(programId)) {
        validatedEventAccount = eventAccountCandidate;
      }
    }

    const lamports = BigInt(Math.round(event.price_sol * 1_000_000_000));
    if (lamports <= BigInt(0)) {
      return NextResponse.json(
        { error: 'Invalid event price' },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const purchaseIx = validatedEventAccount
      ? new TransactionInstruction({
          programId,
          keys: [
            { pubkey: validatedEventAccount, isSigner: false, isWritable: true },
            { pubkey: buyer, isSigner: true, isWritable: true },
            { pubkey: treasury, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data: Buffer.concat([
            anchorDiscriminator('purchase_ticket'),
            encodeU64LE(lamports),
          ]),
        })
      : SystemProgram.transfer({
          fromPubkey: buyer,
          toPubkey: treasury,
          lamports: Number(lamports),
        });

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    const tx = new Transaction({
      feePayer: buyer,
      blockhash,
      lastValidBlockHeight,
    }).add(purchaseIx);

    return NextResponse.json(
      {
        transaction: tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).toString('base64'),
        message: validatedEventAccount
          ? `Buy 1 ticket for ${event.name}`
          : `Pay ${event.price_sol} SOL for ${event.name} (verified transfer fallback)`,
      },
      { headers: ACTIONS_CORS_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build transaction';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}
