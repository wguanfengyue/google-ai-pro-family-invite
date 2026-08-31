import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { InvitationStatus} from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { Queue } from 'bullmq';
import { maskEmail, normalizeEmail } from '../common/mask-email';
import type { CardsService } from '../cards/cards.service';
import type { PrismaService } from '../prisma/prisma.service';
import { INVITATION_QUEUE, SEND_INVITATION_JOB } from './invitations.constants';

export type InvitationView = {
  id: string;
  email: string;
  status: InvitationStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskRecord = {
  id: string;
  publicId: string;
  maskedEmail: string;
  status: InvitationStatus;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerAccountId: string;
  redeemCodeId: string;
};

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cards: CardsService,
    @InjectQueue(INVITATION_QUEUE) private readonly queue: Queue,
  ) {}

  async create(code: string, email: string): Promise<InvitationView> {
    const normalizedEmail = normalizeEmail(email);
    const codeHash = this.cards.hash(code);
    const task = await this.prisma.$transaction(
      async (tx) => {
        const card = await tx.redeemCode.findUnique({
          where: { codeHash },
          include: { invitation: true },
        });
        if (!card) throw new BadRequestException('卡密无效');
        if (card.invitation) {
          if (card.invitation.email !== normalizedEmail) {
            throw new ConflictException('该卡密已绑定其他邮箱');
          }
          return card.invitation;
        }
        if (card.status !== 'ACTIVE') throw new BadRequestException('卡密不可用');
        if (card.expiresAt && card.expiresAt.getTime() <= Date.now()) {
          throw new BadRequestException('卡密已过期');
        }

        const owners = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "owner_accounts"
          WHERE status = 'ACTIVE'::"OwnerAccountStatus"
            AND capacity_used + pending_slots < capacity_total
          ORDER BY capacity_used + pending_slots ASC, created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `);
        const owner = owners[0];
        if (!owner) throw new ServiceUnavailableException('当前暂无可用席位');

        await tx.ownerAccount.update({
          where: { id: owner.id },
          data: { pendingSlots: { increment: 1 } },
        });
        const created = await tx.invitationTask.create({
          data: {
            email: normalizedEmail,
            maskedEmail: maskEmail(normalizedEmail),
            redeemCodeId: card.id,
            ownerAccountId: owner.id,
          },
        });
        await tx.redeemCode.update({
          where: { id: card.id },
          data: { status: 'REDEEMED', redeemedAt: new Date() },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (task.status === 'QUEUED') {
      try {
        await this.queue.add(
          SEND_INVITATION_JOB,
          { taskId: task.id },
          { jobId: task.id, attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
        );
      } catch (error) {
        await this.rollbackEnqueueFailure(task);
        throw new ServiceUnavailableException('任务队列暂不可用，请稍后重试', {
          cause: error,
        });
      }
    }
    return this.toView(task);
  }

  async get(publicId: string): Promise<InvitationView> {
    const task = await this.prisma.invitationTask.findUnique({ where: { publicId } });
    if (!task) throw new NotFoundException('邀请任务不存在');
    return this.toView(task);
  }

  private async rollbackEnqueueFailure(task: TaskRecord): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.invitationTask.delete({ where: { id: task.id } }),
      this.prisma.redeemCode.update({
        where: { id: task.redeemCodeId },
        data: { status: 'ACTIVE', redeemedAt: null },
      }),
      this.prisma.ownerAccount.update({
        where: { id: task.ownerAccountId },
        data: { pendingSlots: { decrement: 1 } },
      }),
    ]);
  }

  private toView(task: {
    publicId: string;
    maskedEmail: string;
    status: InvitationStatus;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvitationView {
    return {
      id: task.publicId,
      email: task.maskedEmail,
      status: task.status,
      failureReason: task.failureReason,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
