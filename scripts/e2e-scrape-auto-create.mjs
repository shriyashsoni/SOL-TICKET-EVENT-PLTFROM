import { readFileSync } from 'node:fs';
import {
  Connection,
  Keypair,
  Transaction,
} from '@solana/web3.js';

const BASE_URL = 'http://localhost:3000';
const RPC_URL = 'https://api.testnet.solana.com';
const KEYPAIR_PATH = 'C:/solana/id.json';

function toHexSignature(signature) {
  if (typeof signature === 'string') return signature;
  return Array.from(signature)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function decodeTx(base64) {
  return Transaction.from(Buffer.from(base64, 'base64'));
}

async function main() {
  const keyBytes = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  const signer = Keypair.fromSecretKey(Uint8Array.from(keyBytes));
  const connection = new Connection(RPC_URL, 'confirmed');

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
  const eventName = `${(scraped.name || 'Scraped Event').slice(0, 40)} ${Date.now()}`;
  const priceInSol = 0.01;
  const totalTickets = 20;
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

  const tx = decodeTx(actionJson.transaction);
  tx.sign(signer);
  const createSig = await connection.sendRawTransaction(tx.serialize());
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
      description: scraped.description || 'Auto-created from scraped link',
      source_url: scraped.source_url || sourceUrl,
      poster_url: scraped.poster_url || '',
      organizer_wallet: signer.publicKey.toBase58(),
      organizer_name: 'Auto E2E',
      event_account: actionJson.eventAccount,
      create_event_signature: createSig,
    }),
  });
  const saveJson = await saveRes.json();

  if (!saveRes.ok || !saveJson.success) {
    throw new Error(`Save event failed: ${JSON.stringify(saveJson)}`);
  }

  const verifyRes = await fetch(`${BASE_URL}/api/events?id=${encodeURIComponent(saveJson.data.id)}`);
  const verifyJson = await verifyRes.json();

  if (!verifyRes.ok || !verifyJson.success || !verifyJson.data) {
    throw new Error(`Verify fetch failed: ${JSON.stringify(verifyJson)}`);
  }

  console.log('SCRAPE_AUTO_CREATE_SUCCESS');
  console.log('Event ID:', verifyJson.data.id);
  console.log('Event Name:', verifyJson.data.name);
  console.log('Create Signature:', toHexSignature(createSig));
  console.log('Event Account:', actionJson.eventAccount);
  console.log('Source URL:', verifyJson.data.source_url);
}

main().catch((error) => {
  console.error('SCRAPE_AUTO_CREATE_FAILED');
  console.error(error);
  process.exit(1);
});
