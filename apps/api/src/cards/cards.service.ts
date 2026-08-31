import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { hashRedeemCode } from '../common/code-hash';
import type { PrismaService } from '../prisma/prisma.service';

export type CardVerification = {
  valid: boolean;
  status: 'ACTIVE' | 'REDEEMED' | 'DISABLED' | 'EXPIRED' | 'NOT_FOUND';
  expiresAt: string | null;
};

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async verify(code: string): Promise<CardVerification> {
    const card = await this.prisma.redeemCode.findUnique({
      where: { codeHash: this.hash(code) },
      select: { status: true, expiresAt: true },
    });
    if (!card) return { valid: false, status: 'NOT_FOUND', expiresAt: null };
    if (card.expiresAt && card.expiresAt.getTime() <= Date.now()) {
      return { valid: false, status: 'EXPIRED', expiresAt: card.expiresAt.toISOString() };
    }
    return {
      valid: card.status === 'ACTIVE',
      status: card.status,
      expiresAt: card.expiresAt?.toISOString() ?? null,
    };
  }

  hash(code: string): string {
    const pepper = this.config.get<string>('CARD_HASH_PEPPER');
    if (!pepper) throw new Error('CARD_HASH_PEPPER is required');
    return hashRedeemCode(code, pepper);
  }
}
