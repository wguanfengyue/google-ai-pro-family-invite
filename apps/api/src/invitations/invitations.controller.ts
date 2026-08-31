import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService, type InvitationView } from './invitations.service';

@Controller('v1/invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post()
  create(@Body() input: CreateInvitationDto): Promise<InvitationView> {
    return this.invitations.create(input.code, input.email);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<InvitationView> {
    return this.invitations.get(id);
  }
}
