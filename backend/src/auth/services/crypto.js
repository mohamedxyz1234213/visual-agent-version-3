import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// ── Password hashing (scrypt) ─────────────────────────────────────────────────
// We use Node's built-in scrypt — no third-party dep, constant-time compare.
const KEY_LEN = 64;
const SALT_LEN = 16;

export function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(plain, salt, KEY_LEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(plain, stored) {
  try {
    if (!stored || typeof stored !== 'string') return false;
    const [scheme, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(plain, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// ── Random token ──────────────────────────────────────────────────────────────
export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export function generateInviteCode() {
  // Short, human-friendly invite code: 12 chars, uppercase
  return randomBytes(8).toString('hex').toUpperCase();
}
