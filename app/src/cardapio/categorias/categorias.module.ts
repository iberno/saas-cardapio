import { Module } from '@nestjs/common';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { TokenService } from '../../auth/shared/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [CategoriasController],
  providers: [CategoriasService, TokenService, JwtService],
})
export class CategoriasModule {}
