import { readFileSync } from 'node:fs';
import { Connection, Keypair, Transaction } from '@solana/web3.js';

const BASE_URL = 'http://localhost:3000';
const RPC_URL = 'https://api.testnet.solana.com';
const KEYPAIR_PATH = 'C:/solana/id.json';

async function createEvent(connection, signer) {
  const sourceUrl = 'https://solana.com/breakpoint';

  const scrapeRes = await fetch(`${BASE_URL}/api/events/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: sourceUrl }),
  });
  const scrapeJson = await scrapeRes.json();
  if (!scrapeRes.ok || !scrapeJson.success) {
    throw new Error(`Scrape failed: ${JSON.stringify(scrapeJson)}`);
  }

  const scraped = scrapeJson.data ?? {};
  const eventName = `${(scraped.name || 'Auto Event').slice(0, 40)} ${Date.now()}`;
  const priceInSol = 0.01;
  const totalTickets = 5;
  const symbol = eventName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'EVNT';
  const uri = scraped.source_url || sourceUrl;

  const actionRes = await fetch(`${BASE_URL}/api/actions/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account: signer.publicKey.toBase58(),
      eventName,
      symbol,
      uri,
      totalTickets,
      priceInSol,
    }),
  });
  const actionJson = await actionRes.json();
  if (!actionRes.ok || !actionJson.transaction) {
    throw new Error(`Create action failed: ${JSON.stringify(actionJson)}`);
  }

  const createTx = Transaction.from(Buffer.from(actionJson.transaction, 'base64'));
  createTx.sign(signer);
  const createSig = await connection.sendRawTransaction(createTx.serialize());
  await connection.confirmTransaction(createSig, 'confirmed');

  const saveRes = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: eventName,
      date: scraped.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      location: scraped.location || 'Testnet Venue',
      price_sol: priceInSol,
      total_tickets: totalTickets,
      category: scraped.category || 'Conference',
      description: scraped.description || 'Auto-created event',
      source_url: scraped.source_url || sourceUrl,
      poster_url: scraped.poster_url || '',
      organizer_wallet: signer.publicKey.toBase58(),
      organizer_name: 'E2E Bot',
      event_account: actionJson.eventAccount,
      create_event_signature: createSig,
    }),
  });
  const saveJson = await saveRes.json();
  if (!saveRes.ok || !saveJson.success) {
    throw new Error(`Event save failed: ${JSON.stringify(saveJson)}`);
  }

  return saveJson.data;
}

async function buyTicket(connection, signer, event) {
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
    throw new Error(`Buy action failed: ${JSON.stringify(actionJson)}`);
  }

  const buyTx = Transaction.from(Buffer.from(actionJson.transaction, 'base64'));
  buyTx.sign(signer);
  const buySig = await connection.sendRawTransaction(buyTx.serialize());
  await connection.confirmTransaction(buySig, 'confirmed');

  const ticketRes = await fetch(`${BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'purchase',
      publicKey: signer.publicKey.toBase58(),
      eventId: event.id,
      priceSol: Number(event.price_sol),
      signature: buySig,
    }),
  });
  const ticketJson = await ticketRes.json();
  if (!ticketRes.ok || !ticketJson.success) {
    throw new Error(`Ticket verify failed: ${JSON.stringify(ticketJson)}`);
  }

  return { buySig, ticket: ticketJson.data };
}

async function main() {
  const keyBytes = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  const signer = Keypair.fromSecretKey(Uint8Array.from(keyBytes));
  const connection = new Connection(RPC_URL, 'confirmed');

  const event = await createEvent(connection, signer);
  const buy = await buyTicket(connection, signer, event);

  console.log('CREATE_AND_BUY_SUCCESS');
  console.log('Event ID:', event.id);
  console.log('Buy Signature:', buy.buySig);
  console.log('Ticket ID:', buy.ticket?.id);
}

main().catch((error) => {
  console.error('CREATE_AND_BUY_FAILED');
  console.error(error);
  process.exit(1);
});
