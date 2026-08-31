import { OwnerAccountStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateOwnerDto {
  @IsOptional()
  @IsEnum(OwnerAccountStatus)
  status?: OwnerAccountStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  capacityTotal?: number;
}
