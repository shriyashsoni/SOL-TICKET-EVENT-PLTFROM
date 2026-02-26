import { NextRequest, NextResponse } from 'next/server';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { dbAll, type Event, type Transaction } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publicKey = searchParams.get('publicKey');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!publicKey) {
      return NextResponse.json(
        { success: false, error: 'Public key required' },
        { status: 400 }
      );
    }

    const rows = await dbAll<Transaction>('SELECT * FROM transactions WHERE user_wallet = ?', [publicKey]);
    const events = await dbAll<Event>('SELECT * FROM events');

    const mapped = rows
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map((tx) => ({
        id: tx.id,
        type: tx.type,
        event: events.find((item) => item.id === tx.event_id)?.name ?? tx.event_id,
        amount: tx.amount_sol,
        token: 'SOL',
        date: new Date(tx.created_at).toLocaleDateString(),
        status: tx.status,
        signature: tx.id,
      }));

    return NextResponse.json({
      success: true,
      data: mapped,
      count: mapped.length,
      total: rows.length,
      publicKey,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, signature } = body;

    if (action === 'status') {
      const connection = new Connection(process.env.SOLANA_RPC_URL ?? clusterApiUrl('testnet'), 'confirmed');
      const tx = await connection.getSignatureStatus(signature);

      return NextResponse.json({
        success: true,
        signature,
        status: tx.value?.confirmationStatus ?? 'unknown',
        confirmations: tx.value?.confirmations ?? null,
        err: tx.value?.err ?? null,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}
