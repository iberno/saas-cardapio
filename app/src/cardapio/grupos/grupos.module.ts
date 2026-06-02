import { Module } from '@nestjs/common';
import { GruposController, GrupoItensController } from './grupos.controller';
import { GruposService } from './grupos.service';
import { TokenService } from '../../auth/shared/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [GruposController, GrupoItensController],
  providers: [GruposService, TokenService, JwtService],
})
export class GruposModule {}
