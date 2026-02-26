import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

const BASE_URL = 'http://localhost:3000';
const RPC_URL = 'https://api.testnet.solana.com';
const PROGRAM_ID = new PublicKey('E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc');
const KEYPAIR_PATH = 'C:/solana/id.json';

function discriminator(ixName) {
  return createHash('sha256').update(`global:${ixName}`).digest().subarray(0, 8);
}

async function ensureProgramState(connection, signer) {
  const [programState] = PublicKey.findProgramAddressSync([Buffer.from('program-state')], PROGRAM_ID);
  const info = await connection.getAccountInfo(programState, 'confirmed');

  if (info) {
    return programState;
  }

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: programState, isSigner: false, isWritable: true },
      { pubkey: signer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator('initialize_program'),
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer: signer.publicKey, blockhash, lastValidBlockHeight }).add(ix);
  tx.sign(signer);

  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

  return programState;
}

async function main() {
  const keyBytes = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  const signer = Keypair.fromSecretKey(Uint8Array.from(keyBytes));
  const connection = new Connection(RPC_URL, 'confirmed');

  await ensureProgramState(connection, signer);

  const now = Date.now();
  const eventName = `E2E Event ${now}`;
  const payload = {
    account: signer.publicKey.toBase58(),
    eventName,
    symbol: 'E2E',
    uri: 'https://example.com/e2e',
    totalTickets: 25,
    priceInSol: 0.01,
  };

  const actionRes = await fetch(`${BASE_URL}/api/actions/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const actionJson = await actionRes.json();
  if (!actionRes.ok || !actionJson.transaction) {
    throw new Error(`Action create failed: ${JSON.stringify(actionJson)}`);
  }

  const tx = Transaction.from(Buffer.from(actionJson.transaction, 'base64'));
  tx.sign(signer);

  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  const saveRes = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: eventName,
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      location: 'Testnet Arena',
      price_sol: 0.01,
      total_tickets: 25,
      category: 'Conference',
      description: 'Automated e2e on-chain posting test',
      source_url: 'https://example.com',
      poster_url: 'https://picsum.photos/1200/600',
      organizer_wallet: signer.publicKey.toBase58(),
      organizer_name: 'E2E Bot',
      event_account: actionJson.eventAccount,
      create_event_signature: signature,
    }),
  });

  const saveJson = await saveRes.json();
  if (!saveRes.ok || !saveJson.success) {
    throw new Error(`Event save failed: ${JSON.stringify(saveJson)}`);
  }

  const verifyRes = await fetch(`${BASE_URL}/api/events?id=${encodeURIComponent(saveJson.data.id)}`);
  const verifyJson = await verifyRes.json();

  if (!verifyRes.ok || !verifyJson.success || !verifyJson.data) {
    throw new Error(`Verification fetch failed: ${JSON.stringify(verifyJson)}`);
  }

  console.log('E2E_SUCCESS');
  console.log('Event ID:', verifyJson.data.id);
  console.log('Event Name:', verifyJson.data.name);
  console.log('On-chain Signature:', signature);
  console.log('Event Account:', actionJson.eventAccount);
}

main().catch((error) => {
  console.error('E2E_FAILED');
  console.error(error);
  process.exit(1);
});
