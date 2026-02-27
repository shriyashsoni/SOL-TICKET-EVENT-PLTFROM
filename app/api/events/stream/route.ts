import { NextResponse } from 'next/server';
import { subscribeRealtime } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

function toSseChunk(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(toSseChunk('ready', { ok: true })));

      const unsubscribe = subscribeRealtime((payload) => {
        controller.enqueue(encoder.encode(toSseChunk('update', payload)));
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);

      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      // stream closed by client
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
