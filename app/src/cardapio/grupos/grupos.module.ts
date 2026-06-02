import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GruposController, GrupoItensController } from './grupos.controller';
import { GruposService } from './grupos.service';
import { TokenService } from '../../auth/shared/token.service';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [GruposController, GrupoItensController],
  providers: [GruposService, TokenService],
})
export class GruposModule {}
