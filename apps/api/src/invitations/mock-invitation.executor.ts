import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { InvitationExecution, InvitationExecutor } from './invitation-executor';

@Injectable()
export class MockInvitationExecutor implements InvitationExecutor {
  async execute(): Promise<InvitationExecution> {
    return { providerReference: `mock-${randomUUID()}` };
  }
}
