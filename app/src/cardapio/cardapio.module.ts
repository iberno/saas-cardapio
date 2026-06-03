import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CardapioController } from './cardapio.controller';
import { PublicCardapioController } from './public-cardapio.controller';
import { CardapioService } from './cardapio.service';
import { TokenService } from '../auth/shared/token.service';
import { TenantOrPlatformGuard } from '../common/guards/tenant-or-platform.guard';
import { UploadModule } from './upload/upload.module';
import { TenantModule } from '../tenant/tenant.module';
import { CategoriasModule } from './categorias/categorias.module';
import { VariantesModule } from './variantes/variantes.module';
import { GruposModule } from './grupos/grupos.module';
import { BannersModule } from './banners/banners.module';

@Module({
  imports: [
    JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) }),
    UploadModule, TenantModule, CategoriasModule, VariantesModule, GruposModule, BannersModule,
  ],
  controllers: [CardapioController, PublicCardapioController],
  providers: [CardapioService, TokenService, TenantOrPlatformGuard],
})
export class CardapioModule {}
