import { createHash, randomBytes, randomUUID } from 'node:crypto';

/** Contributor "magic link" token. Only the SHA-256 hash is stored in the database. */
export function createReconfirmToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isPlausibleToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

export function newId(): string {
  return randomUUID();
}

export function shortId(bytes = 3): string {
  return randomBytes(bytes).toString('hex');
}
