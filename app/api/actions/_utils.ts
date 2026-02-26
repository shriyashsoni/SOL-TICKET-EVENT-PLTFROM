import { createHash } from 'crypto';

export const ACTIONS_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: ACTIONS_CORS_HEADERS,
  });
}

export function anchorDiscriminator(ixName: string): Buffer {
  return createHash('sha256')
    .update(`global:${ixName}`)
    .digest()
    .subarray(0, 8);
}

export function encodeU64LE(value: bigint): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64LE(value, 0);
  return out;
}

export function encodeString(value: string): Buffer {
  const body = Buffer.from(value, 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(body.length, 0);
  return Buffer.concat([len, body]);
}

export function parsePublicKeyString(value: string | null, fieldName: string): string {
  if (!value) {
    throw new Error(`Missing required ${fieldName}`);
  }
  return value;
}
