import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9-]+$/)
  code!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;
}
