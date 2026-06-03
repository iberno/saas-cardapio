import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { TokenService } from '../../auth/shared/token.service';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [CategoriasController],
  providers: [CategoriasService, TokenService, TenantOrPlatformGuard],
})
export class CategoriasModule {}
