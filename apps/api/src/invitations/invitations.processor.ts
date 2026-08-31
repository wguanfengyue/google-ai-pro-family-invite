import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { PrismaService } from '../prisma/prisma.service';
import {
  INVITATION_EXECUTOR,
  type InvitationExecutor,
} from './invitation-executor';
import { INVITATION_QUEUE, SEND_INVITATION_JOB } from './invitations.constants';

@Injectable()
@Processor(INVITATION_QUEUE)
export class InvitationsProcessor extends WorkerHost {
  private readonly logger = new Logger(InvitationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(INVITATION_EXECUTOR) private readonly executor: InvitationExecutor,
  ) {
    super();
  }

  async process(job: Job<{ taskId: string }>): Promise<void> {
    if (job.name !== SEND_INVITATION_JOB) return;
    const task = await this.prisma.invitationTask.findUnique({
      where: { id: job.data.taskId },
      include: { ownerAccount: { select: { label: true } } },
    });
    if (!task || task.status === 'SUCCEEDED') return;

    await this.prisma.invitationTask.update({
      where: { id: task.id },
      data: { status: 'PROCESSING', failureReason: null },
    });

    try {
      const result = await this.executor.execute({
        taskId: task.id,
        ownerLabel: task.ownerAccount.label,
        targetEmail: task.email,
      });
      await this.prisma.$transaction([
        this.prisma.invitationTask.update({
          where: { id: task.id },
          data: {
            status: 'SUCCEEDED',
            providerReference: result.providerReference,
            completedAt: new Date(),
          },
        }),
        this.prisma.ownerAccount.update({
          where: { id: task.ownerAccountId },
          data: { pendingSlots: { decrement: 1 }, capacityUsed: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '邀请执行失败';
      const terminal = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await this.prisma.invitationTask.update({
        where: { id: task.id },
        data: { status: terminal ? 'FAILED' : 'QUEUED', failureReason: message },
      });
      if (terminal) {
        await this.prisma.ownerAccount.update({
          where: { id: task.ownerAccountId },
          data: { pendingSlots: { decrement: 1 } },
        });
      }
      this.logger.warn(`Invitation task ${task.id} failed`);
      throw error;
    }
  }
}
