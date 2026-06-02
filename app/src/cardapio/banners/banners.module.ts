import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { TokenService } from '../../auth/shared/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [BannersController],
  providers: [BannersService, TokenService, JwtService],
})
export class BannersModule {}
