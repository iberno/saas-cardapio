import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { TokenService } from '../../auth/shared/token.service';

@Module({
  controllers: [ThemeController],
  providers: [ThemeService, TokenService, JwtService],
})
export class ThemeModule {}
