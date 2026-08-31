import { maskEmail, normalizeEmail } from './mask-email';

describe('email privacy helpers', () => {
  it('normalizes and masks an email', () => {
    expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com');
    expect(maskEmail('user@example.com')).toBe('us***@example.com');
  });
});
