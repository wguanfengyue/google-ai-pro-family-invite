import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminKeyGuard } from '../common/admin-key.guard';
import type { CreateOwnerDto } from './dto/create-owner.dto';
import type { UpdateOwnerDto } from './dto/update-owner.dto';
import type { OwnersService} from './owners.service';
import { type OwnerView } from './owners.service';

@Controller('v1/admin/owners')
@UseGuards(AdminKeyGuard)
export class OwnersController {
  constructor(private readonly owners: OwnersService) {}

  @Get()
  list(): Promise<OwnerView[]> {
    return this.owners.list();
  }

  @Post()
  create(@Body() input: CreateOwnerDto): Promise<OwnerView> {
    return this.owners.create(input.label, input.capacityTotal);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateOwnerDto): Promise<OwnerView> {
    return this.owners.update(id, input);
  }
}
