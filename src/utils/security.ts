/**
 * Lightweight cryptographic utilities using the Web Crypto API
 * Works consistently in modern browsers, Cloudflare Workers, and Node 18+.
 */

export async function hashString(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomId(length: number = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // no ambiguous chars like 0, O, 1, l
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
