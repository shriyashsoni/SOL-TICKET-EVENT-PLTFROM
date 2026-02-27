# Smart Contract Guide

This document explains the on-chain module organization and how the app integrates with instruction flows.

## 1. Contract Source Map

Program root:
- `programs/blink_ticket/src/lib.rs`

Instruction modules:
- `programs/blink_ticket/src/instructions/initialize_program.rs`
- `programs/blink_ticket/src/instructions/create_event.rs`
- `programs/blink_ticket/src/instructions/update_event.rs`
- `programs/blink_ticket/src/instructions/purchase_ticket.rs`
- `programs/blink_ticket/src/instructions/mint_cnft_ticket.rs`
- `programs/blink_ticket/src/instructions/transfer_ticket.rs`
- `programs/blink_ticket/src/instructions/verify_ticket.rs`
- `programs/blink_ticket/src/instructions/claim_revenue.rs`

State modules:
- `programs/blink_ticket/src/state/program_state.rs`
- `programs/blink_ticket/src/state/event.rs`
- `programs/blink_ticket/src/state/ticket.rs`

## 2. Program Responsibilities

The program design and app integration jointly enforce:
- Event creation constraints and fee policy
- Ticket purchase validation and accounting
- Event/ticket state transitions
- Revenue claims by organizer pathways

The backend complements on-chain checks by validating transaction signatures and signer wallet ownership before persisting off-chain records.

## 3. Instruction-Level Intent

### initialize_program
Purpose:
- Create/initialize global program state, treasury config, and counters.

### create_event
Purpose:
- Create event account for organizer with pricing and supply metadata.

### update_event
Purpose:
- Modify selected event attributes according to program rules.

### purchase_ticket
Purpose:
- Execute purchase transfer/account updates and sold counters.

### mint_cnft_ticket
Purpose:
- Mint/issue compressed NFT style ticket proof path.

### transfer_ticket
Purpose:
- Controlled ownership transfer path for ticket records.

### verify_ticket
Purpose:
- Verification primitive for ticket authenticity/ownership assumptions.

### claim_revenue
Purpose:
- Organizer claim path for accrued event revenue.

## 4. App Integration Points

Action route integration:
- `app/api/actions/events/create/route.ts`
  - Builds create transaction payload
  - Supports fallback mode when full program-state path is unavailable

- `app/api/actions/events/[eventId]/route.ts`
  - Builds buy transaction payload
  - Attempts on-chain event account decode for strict path
  - Falls back to transfer-based route if required

Event write verification:
- `app/api/events/route.ts`
  - Verifies signature format and chain confirmation
  - Confirms signer-wallet relation
  - Persists event only after verification

Ticket write verification:
- `app/api/tickets/route.ts`
  - Verifies purchase signature confirmation and signer
  - Persists ticket and transaction
  - Decrements event available supply

## 5. PDA and Addressing Concepts

The app uses deterministic derivations and account lookups when possible:
- Program state PDA
- Event account PDA (or configured account)

When account introspection is unavailable, the app uses explicit fallback tx flows while still requiring signature and confirmation checks.

## 6. Security Expectations

Already implemented in app + route layer:
- Base58 signature validation
- Confirmation retries across testnet RPC candidates
- Signer verification checks
- Organizer-only controls for delete/feature/withdraw routes

Recommended before mainnet:
- Independent smart contract security audit
- Formal threat model and abuse-case testing
- Integration test matrix for every instruction path

## 7. Build and Deploy Quick Reference

Build:

```bash
cargo build-sbf --manifest-path ./programs/blink_ticket/Cargo.toml
```

Deploy to testnet:

```bash
solana program deploy ./programs/blink_ticket/target/deploy/blink_ticket.so --url https://api.testnet.solana.com
```

Verify:

```bash
solana program show E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc --url https://api.testnet.solana.com
```

## 8. Operational Notes

- Keep `declare_id!` synchronized with deployed Program ID.
- Keep environment variable `NEXT_PUBLIC_BLINK_TICKET_PROGRAM_ID` aligned with deployed address.
- Keep action route defaults aligned with active network cluster and treasury.
