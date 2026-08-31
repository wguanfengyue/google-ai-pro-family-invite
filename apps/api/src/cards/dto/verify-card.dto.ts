import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class VerifyCardDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9-]+$/)
  code!: string;
}
