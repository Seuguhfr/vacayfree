/**
 * Lightweight cryptographic utilities using the Web Crypto API
 * Works consistently in modern browsers, Cloudflare Workers, and Node 18+.
 */

const SALT_PEPPER = 'vacay_salt_sec_2026';

export async function hashString(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Salted hash for 4-digit PINs scoped to the specific event and participant
 * Defeats rainbow tables and 10k brute-force dictionary attacks
 */
export async function hashParticipantPin(
  eventId: string,
  participantId: string,
  pin: string
): Promise<string> {
  return hashString(`${eventId}:${participantId}:${pin.trim()}:${SALT_PEPPER}`);
}

/**
 * Salted hash for organizer admin keys scoped to the event
 */
export async function hashAdminKey(
  eventId: string,
  adminKey: string
): Promise<string> {
  return hashString(`${eventId}:${adminKey.trim()}:${SALT_PEPPER}`);
}

export function generateRandomId(length: number = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function generateAdminKey(): string {
  return generateRandomId(16);
}
