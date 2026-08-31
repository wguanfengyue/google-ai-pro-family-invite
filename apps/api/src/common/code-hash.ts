import { createHash } from 'node:crypto';

export function normalizeRedeemCode(code: string): string {
  return code.trim().toUpperCase();
}

export function hashRedeemCode(code: string, pepper: string): string {
  return createHash('sha256')
    .update(`${pepper}:${normalizeRedeemCode(code)}`)
    .digest('hex');
}
