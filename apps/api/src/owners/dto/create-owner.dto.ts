import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateOwnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  label!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  capacityTotal!: number;
}
