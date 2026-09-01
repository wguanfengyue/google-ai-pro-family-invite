import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardsModule } from '../cards/cards.module';
import { BrowserInvitationExecutor } from './browser-invitation.executor';
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
    BrowserInvitationExecutor,
    {
      provide: INVITATION_EXECUTOR,
      inject: [ConfigService, MockInvitationExecutor, BrowserInvitationExecutor],
      useFactory: (
        config: ConfigService,
        mock: MockInvitationExecutor,
        browser: BrowserInvitationExecutor,
      ) => (config.get('INVITATION_EXECUTOR', 'mock') === 'browser' ? browser : mock),
    },
  ],
})
export class InvitationsModule {}
