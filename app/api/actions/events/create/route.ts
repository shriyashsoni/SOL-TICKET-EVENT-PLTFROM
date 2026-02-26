import { NextRequest, NextResponse } from 'next/server';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  ACTIONS_CORS_HEADERS,
  anchorDiscriminator,
  encodeString,
  encodeU64LE,
  optionsResponse,
  parsePublicKeyString,
} from '../../_utils';

const DEFAULT_RPC = process.env.SOLANA_RPC_URL ?? clusterApiUrl('testnet');
const PROGRAM_ID = process.env.NEXT_PUBLIC_BLINK_TICKET_PROGRAM_ID ?? 'E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc';
const DEFAULT_TREASURY = '5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ';

type CreateEventPayload = {
  account?: string;
  eventName?: string;
  symbol?: string;
  uri?: string;
  totalTickets?: number;
  priceInSol?: number;
};

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  return NextResponse.json(
    {
      title: 'Create On-Chain Event',
      icon: 'https://solana.com/src/img/branding/solanaLogoMark.svg',
      description: 'Initialize a ticket event on Solana testnet',
      label: 'Create Event',
      links: {
        actions: [
          {
            label: 'Create Event',
            href: `${url.origin}/api/actions/events/create`,
            parameters: [
              { name: 'eventName', label: 'Event name', required: true },
              { name: 'symbol', label: 'Symbol (e.g. TIX)', required: true },
              { name: 'uri', label: 'Metadata URI', required: true },
              { name: 'totalTickets', label: 'Supply', required: true },
              { name: 'priceInSol', label: 'Price in SOL', required: true },
            ],
          },
        ],
      },
    },
    { headers: ACTIONS_CORS_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateEventPayload;

    const organizer = new PublicKey(parsePublicKeyString(body.account ?? null, 'account'));
    const eventName = body.eventName?.trim() ?? '';
    const symbol = body.symbol?.trim() ?? '';
    const uri = body.uri?.trim() ?? '';
    const totalTickets = BigInt(body.totalTickets ?? 0);
    const priceInSol = BigInt(Math.round((body.priceInSol ?? 0) * 1_000_000_000));

    if (!eventName || !symbol || !uri || totalTickets <= BigInt(0) || priceInSol <= BigInt(0)) {
      return NextResponse.json(
        { error: 'Invalid create event parameters' },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const query = request.nextUrl.searchParams;
    const programState = new PublicKey(
      parsePublicKeyString(query.get('programState') ?? process.env.BLINK_PROGRAM_STATE ?? null, 'programState')
    );
    const eventAccount = new PublicKey(
      parsePublicKeyString(query.get('eventAccount') ?? process.env.BLINK_EVENT_ACCOUNT ?? null, 'eventAccount')
    );
    const merkleTree = new PublicKey(
      parsePublicKeyString(query.get('merkleTree') ?? process.env.BLINK_DEFAULT_MERKLE_TREE ?? null, 'merkleTree')
    );
    const treasury = new PublicKey(
      parsePublicKeyString(query.get('treasury') ?? process.env.BLINK_EVENT_TREASURY ?? DEFAULT_TREASURY, 'treasury')
    );
    const programId = new PublicKey(PROGRAM_ID);

    const instructionData = Buffer.concat([
      anchorDiscriminator('create_event'),
      encodeString(eventName),
      encodeString(symbol),
      encodeString(uri),
      encodeU64LE(totalTickets),
      encodeU64LE(priceInSol / BigInt(1_000_000_000)),
    ]);

    const createEventIx = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: programState, isSigner: false, isWritable: true },
        { pubkey: eventAccount, isSigner: false, isWritable: true },
        { pubkey: organizer, isSigner: true, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: merkleTree, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });

    const connection = new Connection(DEFAULT_RPC, 'confirmed');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    const tx = new Transaction({
      feePayer: organizer,
      blockhash,
      lastValidBlockHeight,
    }).add(createEventIx);

    return NextResponse.json(
      {
        transaction: tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).toString('base64'),
        message: `Create event: ${eventName}`,
      },
      { headers: ACTIONS_CORS_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build create-event transaction';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}
