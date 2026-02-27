# SOL Ticket Event Platform

A full-stack Solana testnet event-ticketing platform with:
- On-chain program instruction flows (Rust modules)
- Blink/Action-compatible API routes for wallet signing
- Next.js frontend for posting, discovering, and buying events
- Organizer dashboard for stats, revenue, delete, and featured control
- Realtime synchronization (SSE)
- Durable local persistence (SQLite + JSON fallback)

## Smart Contracts Quick Links

- Program entry: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/lib.rs
- Instructions folder: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/tree/main/programs/blink_ticket/src/instructions
- State folder: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/tree/main/programs/blink_ticket/src/state
- Cargo manifest: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/Cargo.toml

---

## Table of Contents

1. Project Overview
2. Network & On-Chain Identity
3. Repository Map
4. Smart Contract Modules (All Links)
5. Frontend Modules (All Major Links)
6. API Surface (All Major Links)
7. System Architecture & Data Flow
8. Data Model & Persistence Guarantees
9. Detailed API Specs + Request/Response Examples
10. Blink/Action Transaction Flows
11. Realtime Event Bus (SSE)
12. Stats Calculation Details
13. Environment Variables (Complete)
14. Local Development Runbook
15. Program Build/Deploy (Testnet)
16. Operational Troubleshooting
17. Security Model
18. Production Hardening Checklist
19. License Notes

## Detailed Docs Folder

- Docs index: [docs/README.md](docs/README.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- API reference: [docs/API.md](docs/API.md)
- Smart contract guide: [docs/SMART-CONTRACT.md](docs/SMART-CONTRACT.md)

---

## 1) Project Overview

This repository implements an end-to-end event platform where:
- Organizers post events through wallet-signed on-chain transaction flow.
- Buyers purchase tickets through wallet-signed action flow.
- Backend verifies transactions and signer consistency before writing records.
- Home/events/dashboard pages refresh in realtime via SSE.
- Data persists to DB and remains until manual organizer delete.

Core UX goals currently implemented:
- AI-assisted event scrape and auto-fill
- Link-based event posting flow
- Featured/unfeatured event controls
- Realtime stats and event visibility
- Manual organizer delete only (no automatic event deletion job)

---

## 2) Network & On-Chain Identity

- Solana Cluster: Testnet
- Default Program ID: `E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc`
- Default Treasury: `5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ`

Program entrypoint:
- https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/lib.rs

---

## 3) Repository Map

- `app/` → Next.js App Router pages + API routes
- `components/` → reusable UI blocks
- `lib/` → DB abstraction, realtime pub/sub, utilities
- `programs/blink_ticket/` → Rust program source
- `scripts/` → SQL/setup helper files
- `public/` → static assets

---

## 4) Smart Contract Modules (All Links)

### Program Root
- `Cargo.toml`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/Cargo.toml
- `src/lib.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/lib.rs

### Instruction Modules
- `initialize_program.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/initialize_program.rs
- `create_event.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/create_event.rs
- `update_event.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/update_event.rs
- `purchase_ticket.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/purchase_ticket.rs
- `mint_cnft_ticket.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/mint_cnft_ticket.rs
- `transfer_ticket.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/transfer_ticket.rs
- `verify_ticket.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/verify_ticket.rs
- `claim_revenue.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/claim_revenue.rs
- `mod.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/instructions/mod.rs

### State Modules
- `event.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/state/event.rs
- `ticket.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/state/ticket.rs
- `program_state.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/state/program_state.rs
- `mod.rs`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/programs/blink_ticket/src/state/mod.rs

---

## 5) Frontend Modules (All Major Links)

### Pages
- Home: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/page.tsx
- Events list/posting: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/events/page.tsx
- Event details/buy: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/events/%5Bid%5D/page.tsx
- Dashboard: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/dashboard/page.tsx
- Connect wallet: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/connect-wallet/page.tsx
- Whitepaper: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/whitepaper/page.tsx
- About: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/about/page.tsx

### Context/Providers
- Wallet context: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/wallet-context.tsx
- App providers: https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/providers.tsx

---

## 6) API Surface (All Major Links)

### Event APIs
- `GET/POST/PATCH/DELETE /api/events`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/events/route.ts
- `POST /api/events/scrape`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/events/scrape/route.ts
- `POST /api/events/withdraw`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/events/withdraw/route.ts
- `GET /api/events/stream`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/events/stream/route.ts

### Blink/Action APIs
- `GET/POST /api/actions/events/create`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/actions/events/create/route.ts
- `GET/POST /api/actions/events/[eventId]`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/actions/events/%5BeventId%5D/route.ts

### Tickets/Transactions/Stats/Wallet/Health
- `GET/POST /api/tickets`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/tickets/route.ts
- `GET/POST /api/transactions`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/transactions/route.ts
- `GET /api/stats`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/stats/route.ts
- `GET /api/wallet`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/wallet/route.ts
- `GET /api/prices`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/prices/route.ts
- `GET /api/health/db`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/app/api/health/db/route.ts

---

## 7) System Architecture & Data Flow

### Posting flow (Organizer)
1. Organizer fills event form (or scrapes link).
2. Frontend calls `/api/actions/events/create`.
3. Backend returns serialized transaction (on-chain `create_event` or transfer fallback).
4. Wallet signs and sends transaction.
5. Frontend submits metadata + signature to `POST /api/events`.
6. Backend verifies signature and signer.
7. Event row + `event_post` transaction row are written.
8. SSE publishes `event_created` and `transaction_created`.

### Buy flow (User)
1. User opens event detail page.
2. Frontend calls `/api/actions/events/[eventId]`.
3. Backend returns serialized purchase transaction.
4. Wallet signs/sends tx.
5. Frontend sends signature to `POST /api/tickets` (`action=purchase`).
6. Backend verifies tx confirmation + signer wallet.
7. Ticket row + purchase transaction row written.
8. Event available ticket count decremented.
9. SSE publishes purchase + update signals.

### Realtime sync
- Clients subscribe to `/api/events/stream`.
- On each `update` event, pages re-fetch latest data.
- Interval refresh exists as backup polling.

---

## 8) Data Model & Persistence Guarantees

Data layer implementation:
- `lib/db.ts`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/lib/db.ts

Realtime pub/sub implementation:
- `lib/realtime.ts`:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/lib/realtime.ts

### Logical entities
- **events**
  - id, name, description, source_url, poster_url
  - location, date, category
  - price_sol, price_usdc
  - total_tickets, available_tickets
  - withdrawn_profit_sol
  - organizer_wallet, organizer_name
  - event_account
  - featured
  - created_at

- **tickets**
  - id, event_id, owner_wallet, price_paid_sol, purchased_at

- **transactions**
  - id, type (`purchase`, `event_post`, `withdraw`, ...)
  - event_id, user_wallet, amount_sol, status, created_at

### Persistence strategy
1. SQLite file path mode (preferred)
2. Runtime fallback to memory if SQLite init fails
3. Memory fallback persisted to JSON file (`blink-fallback.json`)
4. Event rows remain until manual organizer delete endpoint is called

No cron/TTL/auto-cleanup removes events.

---

## 9) Detailed API Specs + Request/Response Examples

### 9.1 `POST /api/events` (Create Event Record)

Purpose:
- Validate wallet + on-chain signature
- Persist event metadata after transaction verification

Minimal request body:

```json
{
  "name": "Solana Hacker Meetup",
  "date": "2026-04-20",
  "location": "Bengaluru",
  "price_sol": 0.25,
  "total_tickets": 100,
  "category": "Conference",
  "description": "Builders meetup",
  "organizer_wallet": "<wallet_pubkey>",
  "organizer_name": "Shriyash",
  "event_account": "<optional_event_pda>",
  "create_event_signature": "<base58_signature>"
}
```

Alternative verification payload (fee fallback):

```json
{
  "...": "same fields",
  "post_fee_signature": "<base58_signature>"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": "event-...",
    "name": "Solana Hacker Meetup"
  },
  "message": "Event created successfully"
}
```

### 9.2 `PATCH /api/events` (Feature / Unfeature)

Request:

```json
{
  "eventId": "event-123",
  "organizerWallet": "<wallet_pubkey>",
  "featured": true
}
```

Success response:

```json
{
  "success": true,
  "message": "Event marked as featured",
  "data": {
    "id": "event-123",
    "featured": true
  }
}
```

### 9.3 `DELETE /api/events` (Manual Organizer Delete)

Request:

```json
{
  "eventId": "event-123",
  "organizerWallet": "<wallet_pubkey>"
}
```

Success response:

```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "eventId": "event-123"
  }
}
```

### 9.4 `POST /api/tickets` (Purchase Finalization)

Request:

```json
{
  "action": "purchase",
  "publicKey": "<buyer_wallet>",
  "eventId": "event-123",
  "priceSol": 0.25,
  "signature": "<base58_signature>"
}
```

Success response:

```json
{
  "success": true,
  "message": "Ticket purchased successfully",
  "data": {
    "id": "ticket-...",
    "eventTitle": "Solana Hacker Meetup",
    "price": "0.25 SOL",
    "status": "active"
  }
}
```

### 9.5 `POST /api/transactions` (`action=status`)

Request:

```json
{
  "action": "status",
  "signature": "<tx_signature>"
}
```

Response:

```json
{
  "success": true,
  "signature": "<tx_signature>",
  "status": "confirmed",
  "confirmations": null,
  "err": null
}
```

### 9.6 `GET /api/health/db`

Example response:

```json
{
  "success": true,
  "status": "ok",
  "db": {
    "mode": "file",
    "path": ".../data/blink.db",
    "fallbackPath": ".../data/blink-fallback.json",
    "initialized": true,
    "connected": true
  },
  "timestamp": "2026-..."
}
```

---

## 10) Blink/Action Transaction Flows

### `POST /api/actions/events/create`
Input:
- `account`, `eventName`, `symbol`, `uri`, `totalTickets`, `priceInSol`

Output:
- base64 serialized transaction
- `verificationMode`: `create_event` or `post_fee`
- `eventAccount` when available

### `POST /api/actions/events/[eventId]`
Input:
- `account` (buyer wallet)

Output:
- base64 serialized transaction for purchase
- prefers program instruction when valid on-chain event account exists
- fallback to verified transfer path when needed

---

## 11) Realtime Event Bus (SSE)

SSE endpoint:
- `/api/events/stream`

Published event types:
- `event_created`
- `event_updated`
- `event_deleted`
- `ticket_purchased`
- `transaction_created`

Frontend behavior:
- On `update`, pages re-fetch `/api/events`, `/api/stats`, dashboard sources

---

## 12) Stats Calculation Details

`GET /api/stats` returns:
- `totalTicketsSold`
- `activeEvents`
- `activeUsers`
- `totalRevenueSol`
- `platformFees`

Calculation basis:
- Tickets + transactions + event organizers are considered in user activity
- Platform fees are aggregated from `event_post` transactions
- Values refresh in realtime via stream-triggered data reloads

---

## 13) Environment Variables (Complete)

Create `.env.local`:

```env
# Solana
SOLANA_RPC_URL=https://api.testnet.solana.com
NEXT_PUBLIC_BLINK_TICKET_PROGRAM_ID=E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc
BLINK_EVENT_TREASURY=5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ
BLINK_PROGRAM_STATE=
BLINK_EVENT_ACCOUNT=
BLINK_DEFAULT_MERKLE_TREE=

# Database / persistence
BLINK_DB_PATH=
BLINK_DB_DIR=
BLINK_FALLBACK_JSON_PATH=
```

Notes:
- Use `BLINK_DB_PATH` for a fixed DB file location.
- Use `BLINK_FALLBACK_JSON_PATH` for a fixed JSON fallback location.
- Ensure the configured path is writable in your deployment runtime.

---

## 14) Local Development Runbook

Install + start:

```bash
pnpm install
pnpm dev
```

Typecheck + lint + build:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Open app:
- http://localhost:3000

---

## 15) Program Build/Deploy (Testnet)

Set CLI cluster:

```bash
solana config set --url https://api.testnet.solana.com
solana config get
```

Build program artifact:

```bash
cargo build-sbf --manifest-path ./programs/blink_ticket/Cargo.toml
```

Deploy:

```bash
solana program deploy ./programs/blink_ticket/target/deploy/blink_ticket.so --url https://api.testnet.solana.com
```

Verify:

```bash
solana program show E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc --url https://api.testnet.solana.com
```

---

## 16) Operational Troubleshooting

### Event posts but later disappears
- Check `/api/health/db` for `mode`, `path`, `fallbackPath`
- Confirm runtime has write access to persistence directory
- Set `BLINK_DB_PATH` explicitly if runtime path is unstable

### Event not accepted by backend
- Ensure wallet is connected
- Ensure signatures are valid base58 transaction signatures
- Ensure tx is confirmed on testnet RPC

### Stats remain zero unexpectedly
- Verify write APIs are being called successfully (`/api/events`, `/api/tickets`)
- Confirm transactions table receives `event_post` and `purchase` entries
- Watch SSE updates in browser network tab

### SQLite native load issue
- Backend automatically falls back to memory + persisted JSON
- For scale/production, migrate to managed SQL

---

## 17) Security Model

Implemented checks include:
- Signature format validation (`base58`)
- Multi-RPC confirmation retries
- Signer-wallet consistency checks
- Organizer authorization for event delete/feature/withdraw
- Defensive fallback flows when direct program account decoding fails

Important:
- This project is testnet-first and should undergo full audit/review before mainnet usage.

---

## 18) Production Hardening Checklist

- [ ] Replace file-based persistence with managed Postgres/Supabase
- [ ] Add structured logging + tracing (request IDs)
- [ ] Add API rate limiting and abuse controls
- [ ] Add integration tests for post/buy/withdraw paths
- [ ] Add wallet auth/session hardening
- [ ] Add alerting on DB fallback mode activation
- [ ] Add migration/versioning strategy for schema updates

---

## 19) Scripts / SQL Helpers

- SQL setup helper:
  https://github.com/shriyashsoni/SOL-TICKET-EVENT-PLTFROM/blob/main/scripts/setup-db.sql

---

## 20) License Notes

No `LICENSE` file is currently present in this repository.

If distribution is planned, add a license matching your intent:
- MIT (permissive)
- Apache-2.0 (permissive + patent grant)
- Proprietary (closed distribution)
