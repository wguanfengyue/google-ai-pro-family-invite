import { ConflictException } from '@nestjs/common';
import type { InvitationStatus } from '@prisma/client';
import type { Queue } from 'bullmq';
import type { CardsService } from '../cards/cards.service';
import type { PrismaService } from '../prisma/prisma.service';
import { InvitationsService } from './invitations.service';

const now = new Date('2026-08-31T08:00:00.000Z');

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    publicId: '20000000-0000-4000-8000-000000000001',
    email: 'user@example.com',
    maskedEmail: 'us***@example.com',
    status: 'QUEUED' as InvitationStatus,
    failureReason: null,
    providerReference: null,
    redeemCodeId: '30000000-0000-4000-8000-000000000001',
    ownerAccountId: '40000000-0000-4000-8000-000000000001',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  };
}

describe('InvitationsService', () => {
  const queue = { add: jest.fn() } as unknown as Queue;
  const cards = { hash: jest.fn(() => 'hashed-code') } as unknown as CardsService;

  beforeEach(() => jest.clearAllMocks());

  it('reserves a slot transactionally and queues only the task id', async () => {
    const created = task();
    const tx = {
      redeemCode: {
        findUnique: jest.fn().mockResolvedValue({
          id: created.redeemCodeId,
          status: 'ACTIVE',
          expiresAt: null,
          invitation: null,
        }),
        update: jest.fn(),
      },
      ownerAccount: { update: jest.fn() },
      invitationTask: { create: jest.fn().mockResolvedValue(created) },
      $queryRaw: jest.fn().mockResolvedValue([{ id: created.ownerAccountId }]),
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new InvitationsService(prisma, cards, queue);

    await expect(service.create('CARD-0001', 'User@Example.com')).resolves.toMatchObject({
      id: created.publicId,
      email: 'us***@example.com',
      status: 'QUEUED',
    });
    expect(tx.ownerAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pendingSlots: { increment: 1 } } }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'send-invitation',
      { taskId: created.id },
      expect.objectContaining({ jobId: created.id }),
    );
  });

  it('does not allow a redeemed card to be rebound to another email', async () => {
    const tx = {
      redeemCode: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'card-id',
          status: 'REDEEMED',
          expiresAt: null,
          invitation: task(),
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new InvitationsService(prisma, cards, queue);

    await expect(service.create('CARD-0001', 'other@example.com')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queue.add).not.toHaveBeenCalled();
  });
});
