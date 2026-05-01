import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const VERSION = 'sfpbkdf2';
const ITERATIONS = 120_000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${VERSION}$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;
  const [version, iterationsText, salt, expectedHex] = parts;
  if (version !== VERSION) return false;

  const iterations = Number(iterationsText);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const actual = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
  const expected = Buffer.from(expectedHex, 'hex');
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

export function isAppHash(storedHash: string): boolean {
  return storedHash.startsWith(`${VERSION}$`);
}
