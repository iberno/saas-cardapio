import { Module } from '@nestjs/common';
import { CardapioController } from './cardapio.controller';
import { PublicCardapioController } from './public-cardapio.controller';
import { CardapioService } from './cardapio.service';
import { TokenService } from '../auth/shared/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [CardapioController, PublicCardapioController],
  providers: [CardapioService, TokenService, JwtService],
})
export class CardapioModule {}
