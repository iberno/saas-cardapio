import { Module } from '@nestjs/common';
import { CardapioController } from './cardapio.controller';
import { PublicCardapioController } from './public-cardapio.controller';
import { CardapioService } from './cardapio.service';
import { TokenService } from '../auth/shared/token.service';
import { JwtService } from '@nestjs/jwt';
import { UploadModule } from './upload/upload.module';
import { TenantModule } from '../tenant/tenant.module';
import { CategoriasModule } from './categorias/categorias.module';
import { VariantesModule } from './variantes/variantes.module';
import { GruposModule } from './grupos/grupos.module';
import { BannersModule } from './banners/banners.module';

@Module({
  imports: [UploadModule, TenantModule, CategoriasModule, VariantesModule, GruposModule, BannersModule],
  controllers: [CardapioController, PublicCardapioController],
  providers: [CardapioService, TokenService, JwtService],
})
export class CardapioModule {}
