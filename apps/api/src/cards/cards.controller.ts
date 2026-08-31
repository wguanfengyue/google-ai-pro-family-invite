import { Body, Controller, Post } from '@nestjs/common';
import type { CardsService} from './cards.service';
import { type CardVerification } from './cards.service';
import type { VerifyCardDto } from './dto/verify-card.dto';

@Controller('v1/cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Post('verify')
  verify(@Body() input: VerifyCardDto): Promise<CardVerification> {
    return this.cards.verify(input.code);
  }
}
