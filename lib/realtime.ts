type RealtimeEvent = {
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'ticket_purchased' | 'transaction_created';
  payload?: Record<string, unknown>;
  createdAt: string;
};

type Subscriber = (event: RealtimeEvent) => void;

const subscribers = new Set<Subscriber>();

export function subscribeRealtime(subscriber: Subscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function publishRealtimeEvent(
  type: RealtimeEvent['type'],
  payload?: RealtimeEvent['payload']
) {
  const event: RealtimeEvent = {
    type,
    payload,
    createdAt: new Date().toISOString(),
  };

  for (const subscriber of subscribers) {
    try {
      subscriber(event);
    } catch {
      // Ignore subscriber errors to avoid blocking other listeners
    }
  }
}
