import { hashRedeemCode, normalizeRedeemCode } from './code-hash';

describe('redeem code hashing', () => {
  it('normalizes casing and whitespace before hashing', () => {
    expect(hashRedeemCode(' demo-code ', 'pepper')).toBe(
      hashRedeemCode('DEMO-CODE', 'pepper'),
    );
    expect(normalizeRedeemCode(' abc-123 ')).toBe('ABC-123');
  });
});
