import { readFileSync } from 'node:fs';
import { Connection, Keypair, Transaction } from '@solana/web3.js';

const BASE_URL = 'http://localhost:3000';
const RPC_URL = 'https://api.testnet.solana.com';
const KEYPAIR_PATH = 'C:/solana/id.json';

async function main() {
  const keyBytes = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  const signer = Keypair.fromSecretKey(Uint8Array.from(keyBytes));
  const connection = new Connection(RPC_URL, 'confirmed');

  const eventsRes = await fetch(`${BASE_URL}/api/events`);
  const eventsJson = await eventsRes.json();
  if (!eventsRes.ok || !eventsJson.success || !Array.isArray(eventsJson.data) || eventsJson.data.length === 0) {
    throw new Error(`No events available for buy test: ${JSON.stringify(eventsJson)}`);
  }

  const event = eventsJson.data.find((item) => Number(item.available_tickets) > 0) ?? eventsJson.data[0];
  if (!event?.id) {
    throw new Error('No valid event id found for buy test');
  }

  const actionUrl = event.event_account
    ? `${BASE_URL}/api/actions/events/${event.id}?eventAccount=${encodeURIComponent(event.event_account)}`
    : `${BASE_URL}/api/actions/events/${event.id}`;

  const actionRes = await fetch(actionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: signer.publicKey.toBase58() }),
  });
  const actionJson = await actionRes.json();

  if (!actionRes.ok || !actionJson.transaction) {
    throw new Error(`Failed to build buy transaction: ${JSON.stringify(actionJson)}`);
  }

  const tx = Transaction.from(Buffer.from(actionJson.transaction, 'base64'));
  tx.sign(signer);

  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  const ticketRes = await fetch(`${BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'purchase',
      publicKey: signer.publicKey.toBase58(),
      eventId: event.id,
      priceSol: Number(event.price_sol ?? 0),
      signature,
    }),
  });

  const ticketJson = await ticketRes.json();
  if (!ticketRes.ok || !ticketJson.success) {
    throw new Error(`Ticket purchase verify failed: ${JSON.stringify(ticketJson)}`);
  }

  console.log('BUY_TICKET_SUCCESS');
  console.log('Event ID:', event.id);
  console.log('Signature:', signature);
  console.log('Ticket ID:', ticketJson.data?.id);
}

main().catch((error) => {
  console.error('BUY_TICKET_FAILED');
  console.error(error);
  process.exit(1);
});
