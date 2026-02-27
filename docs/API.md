# API Guide

Base URL (local): `http://localhost:3000`

All examples below are JSON unless noted.

## 1. Event APIs

## 1.1 GET /api/events

Query params:
- `id` (optional): fetch one event
- `category` (optional): filter by category
- `search` (optional): match by name/location

Success response (list):

```json
{
  "success": true,
  "data": [
    {
      "id": "event-123",
      "name": "Solana Summit",
      "featured": true,
      "tickets_sold": 10,
      "gross_profit_sol": 2.5,
      "available_profit_sol": 2.5
    }
  ],
  "count": 1
}
```

## 1.2 POST /api/events

Creates event record after on-chain verification.

Request body:

```json
{
  "name": "Solana Summit",
  "date": "2026-06-10",
  "location": "Mumbai",
  "price_sol": 0.25,
  "total_tickets": 100,
  "category": "Conference",
  "description": "Builders event",
  "source_url": "https://example.com/event",
  "poster_url": "https://example.com/poster.jpg",
  "organizer_wallet": "<wallet>",
  "organizer_name": "Organizer",
  "event_account": "<optional_event_pda>",
  "create_event_signature": "<base58_signature>"
}
```

Alternative verification path:

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
  "message": "Event created successfully",
  "data": {
    "id": "event-171...",
    "name": "Solana Summit"
  }
}
```

Common errors:
- `400` invalid signature format
- `400` wallet missing
- `400` on-chain verification failed
- `500` internal persistence or runtime error

## 1.3 PATCH /api/events

Updates featured flag (organizer-only).

Request body:

```json
{
  "eventId": "event-123",
  "organizerWallet": "<wallet>",
  "featured": true
}
```

Success response:

```json
{
  "success": true,
  "message": "Event marked as featured"
}
```

Common errors:
- `403` organizer mismatch
- `404` event not found

## 1.4 DELETE /api/events

Manual organizer delete only.

Request body:

```json
{
  "eventId": "event-123",
  "organizerWallet": "<wallet>"
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

---

## 2. Event Scrape API

## 2.1 POST /api/events/scrape

Request body:

```json
{
  "url": "https://example.com/event"
}
```

Success response (shape may vary by source page metadata):

```json
{
  "success": true,
  "message": "Event details generated from link.",
  "data": {
    "name": "...",
    "date": "...",
    "location": "...",
    "category": "...",
    "description": "...",
    "poster_url": "..."
  }
}
```

---

## 3. Action/Blink APIs

## 3.1 GET /api/actions/events/create

Returns Action metadata for wallets.

## 3.2 POST /api/actions/events/create

Builds serialized create-event transaction.

Request body:

```json
{
  "account": "<organizer_wallet>",
  "eventName": "Solana Summit",
  "symbol": "SUMMIT",
  "uri": "https://metadata.uri",
  "totalTickets": 100,
  "priceInSol": 0.25
}
```

Success response:

```json
{
  "transaction": "<base64_tx>",
  "eventAccount": "<pda_or_null>",
  "verificationMode": "create_event",
  "message": "Create event: Solana Summit"
}
```

Fallback mode response may return `verificationMode = post_fee`.

## 3.3 GET /api/actions/events/[eventId]

Returns Action metadata for buy operation.

## 3.4 POST /api/actions/events/[eventId]

Builds serialized buy transaction.

Request body:

```json
{
  "account": "<buyer_wallet>"
}
```

Success response:

```json
{
  "transaction": "<base64_tx>",
  "message": "Buy 1 ticket for Solana Summit"
}
```

---

## 4. Ticket APIs

## 4.1 GET /api/tickets?publicKey=<wallet>

Returns buyer tickets mapped with event labels.

## 4.2 POST /api/tickets

`action=purchase` finalizes purchase after chain verification.

Request body:

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
    "eventTitle": "Solana Summit",
    "status": "active"
  }
}
```

---

## 5. Transactions APIs

## 5.1 GET /api/transactions?publicKey=<wallet>&limit=10

Returns wallet transaction history.

## 5.2 POST /api/transactions

Supports status check flow.

Request body:

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
  "err": null
}
```

---

## 6. Stats, Wallet, Prices, Health

- `GET /api/stats` → platform-wide stats
- `GET /api/wallet` → wallet state data used by UI
- `GET /api/prices` → SOL/price helper data
- `GET /api/health/db` → DB mode/path diagnostics

Example health payload:

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
  }
}
```

---

## 7. Realtime API

## 7.1 GET /api/events/stream

SSE stream used by Home, Events, Dashboard for near realtime updates.

Triggers include event creation/update/delete, ticket purchase, and transaction creation.
