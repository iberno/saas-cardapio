import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VariantesController } from './variantes.controller';
import { VariantesService } from './variantes.service';
import { TokenService } from '../../auth/shared/token.service';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [VariantesController],
  providers: [VariantesService, TokenService],
})
export class VariantesModule {}
