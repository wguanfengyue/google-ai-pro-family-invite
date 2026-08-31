import { BadRequestException, Injectable } from '@nestjs/common';
import type { OwnerAccountStatus } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

export type OwnerView = {
  id: string;
  label: string;
  status: OwnerAccountStatus;
  capacityTotal: number;
  capacityUsed: number;
  pendingSlots: number;
  availableSlots: number;
};

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<OwnerView[]> {
    const owners = await this.prisma.ownerAccount.findMany({ orderBy: { createdAt: 'asc' } });
    return owners.map(this.toView);
  }

  async create(label: string, capacityTotal: number): Promise<OwnerView> {
    const owner = await this.prisma.ownerAccount.create({
      data: { label: label.trim(), capacityTotal },
    });
    return this.toView(owner);
  }

  async update(
    id: string,
    input: { status?: OwnerAccountStatus; capacityTotal?: number },
  ): Promise<OwnerView> {
    const current = await this.prisma.ownerAccount.findUniqueOrThrow({ where: { id } });
    if (
      input.capacityTotal !== undefined &&
      input.capacityTotal < current.capacityUsed + current.pendingSlots
    ) {
      throw new BadRequestException('总席位不能小于已用与预占席位之和');
    }
    const owner = await this.prisma.ownerAccount.update({ where: { id }, data: input });
    return this.toView(owner);
  }

  private readonly toView = (owner: {
    id: string;
    label: string;
    status: OwnerAccountStatus;
    capacityTotal: number;
    capacityUsed: number;
    pendingSlots: number;
  }): OwnerView => ({
    ...owner,
    availableSlots: owner.capacityTotal - owner.capacityUsed - owner.pendingSlots,
  });
}
