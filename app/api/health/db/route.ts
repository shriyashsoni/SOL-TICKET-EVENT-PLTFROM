import { NextResponse } from 'next/server';
import { dbAll, getDbHealth } from '@/lib/db';

export async function GET() {
  try {
    await dbAll('SELECT * FROM events LIMIT 1');
    const health = getDbHealth();

    return NextResponse.json({
      success: true,
      status: 'ok',
      db: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const health = getDbHealth();

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        db: health,
        error: error instanceof Error ? error.message : 'Unknown DB error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
