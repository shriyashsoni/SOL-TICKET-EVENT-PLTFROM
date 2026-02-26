# SOL Ticket Event Platform

Blink/Action-enabled Solana ticketing platform built with Next.js + an Anchor program.

## Current Network & Deployment

- Network: **Solana Testnet**
- Program ID: **E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc**
- Program crate: `programs/blink_ticket`
- Frontend + API env defaults are set for testnet.

## Project Structure

- `app/` Next.js App Router UI + API routes
- `app/api/actions/events/*` Blink action transaction routes
- `programs/blink_ticket/` Anchor smart contract source
- `scripts/setup-db.sql` SQLite setup helpers

## Environment Variables

Use `.env.local` (already created in this workspace):

```env
SOLANA_RPC_URL=https://api.testnet.solana.com
NEXT_PUBLIC_BLINK_TICKET_PROGRAM_ID=E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc
BLINK_EVENT_TREASURY=5DaiEmbAiLEN6gkEXAufxyaFnNUE8ZL6fK66L1nW2VpZ
BLINK_PROGRAM_STATE=
BLINK_EVENT_ACCOUNT=
BLINK_DEFAULT_MERKLE_TREE=
```

## Local App

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Solana CLI Setup (Testnet)

```bash
solana config set --url https://api.testnet.solana.com
solana config get
solana address
solana balance
```

## Build Program

```bash
cargo build-sbf --manifest-path .\programs\blink_ticket\Cargo.toml
```

## Deploy Program (Testnet)

If deploying with the existing testnet program ID keypair:

```bash
solana program deploy .\programs\blink_ticket\target\deploy\blink_ticket.so \
  --program-id .\programs\blink_ticket\target\deploy\blink_ticket-testnet-keypair.json \
  --url https://api.testnet.solana.com
```

Verify:

```bash
solana program show E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc --url https://api.testnet.solana.com
```

## Important Notes

- `programs/blink_ticket/src/lib.rs` `declare_id!` is synced to the deployed testnet Program ID.
- API fallback program IDs are synced in:
  - `app/api/actions/events/create/route.ts`
  - `app/api/actions/events/[eventId]/route.ts`
- If you change Program ID in future, update:
  - `.env.local`
  - `.env.example`
  - `declare_id!` in the program
  - any docs/UI text that display Program ID

## Available NPM Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```
