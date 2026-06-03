import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { TokenService } from '../../auth/shared/token.service';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [BannersController],
  providers: [BannersService, TokenService, TenantOrPlatformGuard],
})
export class BannersModule {}
