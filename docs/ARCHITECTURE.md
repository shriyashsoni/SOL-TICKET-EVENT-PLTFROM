# Architecture Guide

## 1. System Overview

SOL Ticket Event Platform is a full-stack event-ticketing system built around Solana testnet transaction verification.

It combines:
- Next.js App Router frontend and API backend
- Solana Action/Blink transaction builders
- Rust smart contract modules for ticket/event lifecycle
- Local persistence layer with fallback strategy
- Realtime synchronization using Server-Sent Events (SSE)

## 2. Core Architectural Layers

### 2.1 Presentation Layer

Primary pages:
- Home: `app/page.tsx`
- Events (list + posting): `app/events/page.tsx`
- Event detail + buy: `app/events/[id]/page.tsx`
- Organizer dashboard: `app/dashboard/page.tsx`

Frontend responsibilities:
- Wallet-aware interaction flows
- Calling Action APIs to build transactions
- Sending signed transaction metadata to write APIs
- Realtime listening on `/api/events/stream`

### 2.2 API Layer

Main route groups:
- Event domain: `app/api/events/**`
- Action/Blink domain: `app/api/actions/events/**`
- Ticket/transaction domain: `app/api/tickets`, `app/api/transactions`
- Analytics domain: `app/api/stats`
- Diagnostics domain: `app/api/health/db`

API responsibilities:
- Build wallet-signable transactions
- Validate signatures and signer-wallet consistency
- Persist events/tickets/transactions
- Publish realtime updates to clients

### 2.3 Data Layer

Implemented in `lib/db.ts`.

Storage strategy:
1. SQLite file mode (preferred)
2. Runtime fallback if sqlite binding unavailable
3. Persisted JSON fallback to avoid data loss in fallback mode

Design goal:
- Events remain until explicit manual delete by organizer.

### 2.4 Realtime Layer

Files:
- `lib/realtime.ts`
- `app/api/events/stream/route.ts`

Event types:
- event_created
- event_updated
- event_deleted
- ticket_purchased
- transaction_created

Realtime mechanism:
- API writes publish events
- Clients subscribe and re-fetch data on update event

## 3. End-to-End Runtime Flows

## 3.1 Organizer Event Posting

1. Organizer enters event data or scrapes event link.
2. Frontend requests tx from `/api/actions/events/create`.
3. Wallet signs and sends returned transaction.
4. Frontend sends signature + event metadata to `/api/events`.
5. Backend verifies chain status and signer.
6. Event and event_post transaction are persisted.
7. Realtime events broadcast to subscribers.

## 3.2 Buyer Ticket Purchase

1. Buyer opens event detail.
2. Frontend requests purchase tx from `/api/actions/events/[eventId]`.
3. Wallet signs and sends tx.
4. Frontend calls `/api/tickets` with purchase payload.
5. Backend confirms tx and signer wallet.
6. Ticket persisted, transaction persisted, available tickets decremented.
7. Realtime updates trigger UI refresh.

## 3.3 Featured Event Toggle

1. Organizer clicks Feature/Unfeature in dashboard.
2. Frontend calls `PATCH /api/events`.
3. Backend validates organizer ownership and updates flag.
4. Realtime event_updated is published.

## 4. Event Durability and Deletion Policy

Persistence guarantee implemented by design:
- There is no automatic event expiry cleanup job.
- There is no TTL deletion flow in backend routes.
- Event deletion occurs only via organizer-initiated `DELETE /api/events`.

Operational check endpoint:
- `GET /api/health/db` to inspect mode, active path, fallback path.

## 5. Observability and Health

Current observability points:
- Browser/API logs
- DB health endpoint
- Transaction status endpoint (`POST /api/transactions` action=status)

Recommended enhancement path:
- Structured logs with request correlation IDs
- Per-route latency metrics
- Alerting on fallback mode activation

## 6. Security Boundaries

Current controls:
- Base58 signature format checks
- RPC confirmation checks with retry strategy
- Signer-wallet verification for critical actions
- Organizer authorization checks for privileged operations

Not yet included:
- Full auth/session layer beyond wallet ownership checks
- Centralized rate limiting/WAF policy
- Formal smart contract audit artifacts

## 7. Scaling Considerations

Current state is suitable for development and controlled deployment.

For production scale:
- Migrate to managed SQL (Postgres/Supabase)
- Add migration framework
- Add queue-backed async tasks if throughput grows
- Add horizontal-safe pub/sub or message broker for realtime
