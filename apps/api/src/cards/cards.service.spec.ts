import { ConfigService } from '@nestjs/config';
import { CardsService } from './cards.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('CardsService', () => {
  const findUnique = jest.fn();
  const prisma = { redeemCode: { findUnique } } as unknown as PrismaService;
  const config = new ConfigService({ CARD_HASH_PEPPER: 'test-pepper' });
  const service = new CardsService(prisma, config);

  beforeEach(() => jest.clearAllMocks());

  it('returns NOT_FOUND without exposing lookup details', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.verify('CARD-0001')).resolves.toEqual({
      valid: false,
      status: 'NOT_FOUND',
      expiresAt: null,
    });
  });

  it('rejects an expired active card', async () => {
    findUnique.mockResolvedValue({ status: 'ACTIVE', expiresAt: new Date(0) });
    await expect(service.verify('CARD-0001')).resolves.toMatchObject({
      valid: false,
      status: 'EXPIRED',
    });
  });
});
