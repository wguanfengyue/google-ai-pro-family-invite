import { Module } from '@nestjs/common';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';

@Module({
  controllers: [OwnersController],
  providers: [OwnersService, AdminKeyGuard],
  exports: [OwnersService],
})
export class OwnersModule {}
