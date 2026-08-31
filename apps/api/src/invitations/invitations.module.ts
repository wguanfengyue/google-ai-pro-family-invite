import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { INVITATION_EXECUTOR } from './invitation-executor';
import { INVITATION_QUEUE } from './invitations.constants';
import { InvitationsController } from './invitations.controller';
import { InvitationsProcessor } from './invitations.processor';
import { InvitationsService } from './invitations.service';
import { MockInvitationExecutor } from './mock-invitation.executor';

@Module({
  imports: [CardsModule, BullModule.registerQueue({ name: INVITATION_QUEUE })],
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    InvitationsProcessor,
    MockInvitationExecutor,
    { provide: INVITATION_EXECUTOR, useExisting: MockInvitationExecutor },
  ],
})
export class InvitationsModule {}
