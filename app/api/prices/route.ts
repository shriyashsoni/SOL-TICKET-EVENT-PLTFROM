import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In production, would fetch from actual price oracles
    // For now, returning mock prices
    const prices = {
      SOL: {
        price: 185.50,
        change24h: 2.45,
        volume: 45000000,
        marketCap: 72000000000,
        symbol: 'SOL',
        name: 'Solana',
      },
      USDC: {
        price: 1.00,
        change24h: 0.01,
        volume: 8000000000,
        marketCap: 35000000000,
        symbol: 'USDC',
        name: 'USD Coin',
      },
      BTC: {
        price: 68500,
        change24h: -1.23,
        volume: 35000000000,
        marketCap: 1350000000000,
        symbol: 'BTC',
        name: 'Bitcoin',
      },
      ETH: {
        price: 3650,
        change24h: 1.50,
        volume: 25000000000,
        marketCap: 438000000000,
        symbol: 'ETH',
        name: 'Ethereum',
      },
    };

    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
