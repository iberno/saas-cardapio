import { Module } from '@nestjs/common';
import { CardapioController } from './cardapio.controller';
import { PublicCardapioController } from './public-cardapio.controller';
import { CardapioService } from './cardapio.service';
import { TokenService } from '../auth/shared/token.service';
import { JwtService } from '@nestjs/jwt';
import { UploadModule } from './upload/upload.module';
import { TenantModule } from '../tenant/tenant.module';
import { CategoriasModule } from './categorias/categorias.module';

@Module({
  imports: [UploadModule, TenantModule, CategoriasModule],
  controllers: [CardapioController, PublicCardapioController],
  providers: [CardapioService, TokenService, JwtService],
})
export class CardapioModule {}
