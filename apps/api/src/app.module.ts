import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { CardsModule } from './cards/cards.module';
import { HealthController } from './health.controller';
import { InvitationsModule } from './invitations/invitations.module';
import { OwnersModule } from './owners/owners.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    PrismaModule,
    CardsModule,
    OwnersModule,
    InvitationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
