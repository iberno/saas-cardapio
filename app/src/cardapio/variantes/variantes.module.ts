import { Module } from '@nestjs/common';
import { VariantesController } from './variantes.controller';
import { VariantesService } from './variantes.service';
import { TokenService } from '../../auth/shared/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [VariantesController],
  providers: [VariantesService, TokenService, JwtService],
})
export class VariantesModule {}
