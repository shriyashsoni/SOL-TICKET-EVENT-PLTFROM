import { NextRequest, NextResponse } from 'next/server';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

const TESTNET_RPC = process.env.SOLANA_RPC_URL ?? clusterApiUrl('testnet');

export async function POST(request: NextRequest) {
  try {
    const { action, publicKey } = await request.json();

    const selectedNetwork = 'testnet';

    if (action === 'balance') {
      if (!publicKey) {
        return NextResponse.json(
          { success: false, error: 'Public key required' },
          { status: 400 }
        );
      }

      const connection = new Connection(TESTNET_RPC, 'confirmed');
      const wallet = new PublicKey(publicKey);
      const lamports = await connection.getBalance(wallet, 'confirmed');
      const balance = lamports / 1_000_000_000;
      
      return NextResponse.json({
        success: true,
        publicKey,
        network: selectedNetwork,
        balance,
        currency: 'SOL',
      });
    }

    if (action === 'connected') {
      let valid = false;
      if (publicKey) {
        try {
          new PublicKey(publicKey);
          valid = true;
        } catch {
          valid = false;
        }
      }

      return NextResponse.json({
        success: true,
        connected: valid,
        publicKey,
        network: selectedNetwork,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process wallet request' },
      { status: 500 }
    );
  }
}
