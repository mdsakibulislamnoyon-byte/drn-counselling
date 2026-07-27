import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM field-level encryption for PHI columns stored as `bytea`
 * (insurance_info, provider_notes_encrypted, messages.body_encrypted).
 * Layout: [12-byte IV][16-byte auth tag][ciphertext], base64-free — stored
 * directly as a Postgres bytea via a Buffer.
 *
 * Server-only. FIELD_ENCRYPTION_KEY must be 32 bytes, base64-encoded
 * (`openssl rand -base64 32`).
 */

function getKey(): Buffer {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key) throw new Error('FIELD_ENCRYPTION_KEY is not set.');
  const buf = Buffer.from(key, 'base64');
  if (buf.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }
  return buf;
}

export function encryptField(plaintext: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

export function decryptField(encrypted: Buffer): string {
  const iv = encrypted.subarray(0, 12);
  const authTag = encrypted.subarray(12, 28);
  const ciphertext = encrypted.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * PostgREST (Supabase's REST layer) represents `bytea` columns as Postgres's
 * hex format ("\\x4a2b...") on the wire — never raw binary, since JSON can't
 * carry that. These two helpers convert between that string form and the
 * Buffer that encryptField/decryptField expect, for every insert/select that
 * touches an encrypted bytea column.
 */
export function encryptFieldToPgHex(plaintext: string): string {
  return '\\x' + encryptField(plaintext).toString('hex');
}

export function decryptFieldFromPgHex(pgHex: string): string {
  const hex = pgHex.startsWith('\\x') ? pgHex.slice(2) : pgHex;
  return decryptField(Buffer.from(hex, 'hex'));
}
